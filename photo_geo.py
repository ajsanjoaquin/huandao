"""Assign GPS coordinates to photos via EXIF, track time correlation, or overrides."""

import io
import json
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS


OVERRIDES_FILE = Path("photo_overrides.json")


def _load_overrides() -> dict:
    if OVERRIDES_FILE.exists():
        return json.loads(OVERRIDES_FILE.read_text())
    return {}


def _dms_to_dd(dms, ref) -> float | None:
    """Convert degrees/minutes/seconds tuple to decimal degrees."""
    try:
        d, m, s = dms
        dd = float(d) + float(m) / 60 + float(s) / 3600
        if ref in ("S", "W"):
            dd = -dd
        return dd
    except Exception:
        return None


def _exif_gps(local_path: str) -> tuple[float, float] | None:
    """Extract GPS coordinates from a local image file's EXIF. Returns (lat, lng) or None."""
    try:
        with Image.open(local_path) as img:
            exif_data = img._getexif()
        if not exif_data:
            return None

        gps_info = {}
        for tag_id, value in exif_data.items():
            tag = TAGS.get(tag_id, tag_id)
            if tag == "GPSInfo":
                for gps_tag_id, gps_value in value.items():
                    gps_tag = GPSTAGS.get(gps_tag_id, gps_tag_id)
                    gps_info[gps_tag] = gps_value

        if "GPSLatitude" not in gps_info:
            return None

        lat = _dms_to_dd(gps_info["GPSLatitude"], gps_info.get("GPSLatitudeRef", "N"))
        lng = _dms_to_dd(gps_info["GPSLongitude"], gps_info.get("GPSLongitudeRef", "E"))
        if lat is not None and lng is not None:
            return lat, lng
    except Exception:
        pass
    return None


def _parse_creation_time(ts: str | None) -> datetime | None:
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except ValueError:
        return None


def _nearest_track_point(photo_dt: datetime, all_days_raw: list[dict]) -> tuple[float, float, int] | None:
    """
    Find the GPX track point closest in time to photo_dt.
    all_days_raw: list of dicts with keys 'raw_points' [(lat, lng, elev, dt), ...] and 'day_index'
    Returns (lat, lng, day_index) or None if no match within 30 minutes.
    """
    best = None
    best_delta = float("inf")

    for day in all_days_raw:
        for pt in day.get("raw_points", []):
            pt_dt = pt[3]
            if pt_dt is None:
                continue
            # Ensure both are timezone-aware
            if pt_dt.tzinfo is None:
                pt_dt = pt_dt.replace(tzinfo=timezone.utc)
            if photo_dt.tzinfo is None:
                photo_dt = photo_dt.replace(tzinfo=timezone.utc)
            delta = abs((photo_dt - pt_dt).total_seconds())
            if delta < best_delta:
                best_delta = delta
                best = (pt[0], pt[1], day["day_index"])

    if best and best_delta <= 30 * 60:
        return best
    return None


def _day_midpoint(day_parsed: dict) -> tuple[float, float]:
    pts = day_parsed.get("raw_points", [])
    if not pts:
        return (23.6978, 120.9605)  # Taiwan geographic centre fallback
    mid = pts[len(pts) // 2]
    return mid[0], mid[1]


def assign_coordinates(
    photos: list[dict],
    days_parsed: list[dict],  # [{day_index, date, raw_points, ...}]
    use_exif: bool = True,
) -> list[dict]:
    """
    Return photos enriched with lat, lng, day_index, geo_approximate.
    """
    overrides = _load_overrides()

    # Build date → day_index lookup
    date_to_day = {d["date"]: d["day_index"] for d in days_parsed}

    result = []
    for photo in photos:
        pid = photo["id"]
        filename = photo["filename"]
        creation_time = photo.get("creation_time")
        base_url = photo.get("base_url", "")

        lat, lng, day_index, geo_approximate = None, None, None, False

        # Strategy A: EXIF GPS (pre-extracted by photos_fetcher, or read from file)
        if use_exif:
            coords = photo.get("gps")  # already extracted tuple [lat, lng] or None
            if coords is None:
                local_path = photo.get("local_path")
                if local_path:
                    coords = _exif_gps(local_path)
            if coords:
                lat, lng = coords[0], coords[1]
                photo_date = creation_time[:10] if creation_time else None
                day_index = date_to_day.get(photo_date)

        # Strategy B: Time-based track correlation
        if lat is None and creation_time:
            photo_dt = _parse_creation_time(creation_time)
            if photo_dt:
                match = _nearest_track_point(photo_dt, days_parsed)
                if match:
                    lat, lng, day_index = match

        # Strategy C: Manual override by filename
        if lat is None and filename in overrides:
            ov = overrides[filename]
            lat, lng = ov["lat"], ov["lng"]
            day_index = ov.get("day_index") or date_to_day.get(creation_time[:10] if creation_time else "")

        # Strategy D: Day midpoint fallback
        if lat is None:
            photo_date = creation_time[:10] if creation_time else None
            day_index = date_to_day.get(photo_date)
            if day_index is not None:
                day_data = next((d for d in days_parsed if d["day_index"] == day_index), None)
                if day_data:
                    lat, lng = _day_midpoint(day_data)
                    geo_approximate = True

        if lat is None:
            # No location at all — skip
            continue

        result.append(
            {
                "id": pid,
                "filename": filename,
                "thumb_url": f"/photos/{filename}",
                "lat": round(lat, 6),
                "lng": round(lng, 6),
                "day_index": day_index,
                "timestamp": creation_time,
                "geo_approximate": geo_approximate,
            }
        )

    return result
