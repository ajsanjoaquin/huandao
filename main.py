#!/usr/bin/env python3
"""
Huandao data pipeline.

Usage:
    python main.py --start 2024-10-01 --end 2024-10-21 --photos-zip ~/Downloads/album.zip
    python main.py --start 2024-10-01 --end 2024-10-21 --photos-dir ~/Downloads/album-folder/
    python main.py --start 2024-10-01 --end 2024-10-21 --force-refresh --photos-zip ~/Downloads/album.zip
"""

import argparse
import json
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

import garmin_fetcher
import geo_utils
import photo_geo
import photos_fetcher

OUT_DIR = Path("web/public/data")


def _english_title(name: str, day_num: int) -> str:
    """Use Garmin activity name only if it's already in English (ASCII); otherwise Day N."""
    if name and name.isascii() and name.strip():
        return name.strip()
    return f"Day {day_num}"


def build_tracks_json(activities: list[dict], gpx_paths: dict) -> list[dict]:
    days = []
    for i, act in enumerate(sorted(activities, key=lambda a: a["date"])):
        aid = act["activity_id"]
        gpx_path = gpx_paths.get(aid)
        if not gpx_path or not gpx_path.exists():
            print(f"  [pipeline] Warning: no GPX for activity {aid}, skipping")
            continue

        parsed = geo_utils.parse_gpx(gpx_path)
        if not parsed:
            print(f"  [pipeline] Warning: empty GPX for activity {aid}, skipping")
            continue

        day = {
            "day_index": i + 1,
            "date": act["date"],
            "title": _english_title(act.get("name", ""), i + 1),
            "distance_km": parsed["distance_km"],
            "elevation_gain_m": parsed["elevation_gain_m"],
            "duration_s": round(act.get("duration_s", 0)),
            "calories": round(act.get("calories", 0)),
            "bbox": parsed["bbox"],
            "track_points": parsed["track_points"],
            "elevation_profile": parsed["elevation_profile"],
            # Keep raw_points for photo correlation (stripped before JSON output)
            "_raw_points": parsed.get("raw_points", []),
        }
        days.append(day)

    return days


def main():
    parser = argparse.ArgumentParser(description="Huandao data pipeline")
    parser.add_argument("--start", required=True, help="Trip start date YYYY-MM-DD")
    parser.add_argument("--end", required=True, help="Trip end date YYYY-MM-DD")
    parser.add_argument("--force-refresh", action="store_true", help="Bypass all caches")
    parser.add_argument("--photos-zip", help="Path to Google Photos album ZIP file")
    parser.add_argument("--photos-dir", help="Path to directory of photo files")
    parser.add_argument("--skip-exif", action="store_true", help="Skip EXIF GPS extraction (faster)")
    parser.add_argument("--skip-garmin", action="store_true", help="Skip Garmin fetch, use cached activities and GPX files")
    args = parser.parse_args()

    force = args.force_refresh
    start = args.start
    end = args.end

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Phase 1: Garmin
    print("\n── Phase 1: Garmin Connect ─────────────────────────────────────────")
    if args.skip_garmin:
        activities = garmin_fetcher.fetch_activities(start, end, force_refresh=False)
        gpx_paths = garmin_fetcher.fetch_all_gpx(activities, force_refresh=False)
        print(f"  Skipped fetch — using cache: {len(activities)} activities, {len(gpx_paths)} GPX files")
    else:
        activities = garmin_fetcher.fetch_activities(start, end, force_refresh=force)
        print(f"  {len(activities)} cycling activities found")
        gpx_paths = garmin_fetcher.fetch_all_gpx(activities, force_refresh=force)
        print(f"  {len(gpx_paths)} GPX files ready")

    # Phase 2: Photos
    photos_raw = []
    if args.photos_zip or args.photos_dir:
        print("\n── Phase 2: Photos ─────────────────────────────────────────────────")
        photos_raw = photos_fetcher.fetch_photos(
            photos_zip=args.photos_zip,
            photos_dir=args.photos_dir,
            force_refresh=force,
        )
        print(f"  {len(photos_raw)} photos processed")
    else:
        print("\n── Phase 2: No photos source provided (use --photos-zip or --photos-dir) ──")

    # Phase 3: GPX processing
    print("\n── Phase 3: GPX processing ─────────────────────────────────────────")
    days = build_tracks_json(activities, gpx_paths)
    print(f"  Processed {len(days)} days")

    total_distance = sum(d["distance_km"] for d in days)
    total_elevation = sum(d["elevation_gain_m"] for d in days)

    tracks_out = {
        "trip": {
            "title": os.getenv("TRIP_TITLE", "Huandao — Taiwan by Bike"),
            "start_date": start,
            "end_date": end,
            "total_days": len(days),
            "total_distance_km": round(total_distance, 1),
            "total_elevation_m": round(total_elevation),
        },
        "days": [
            {k: v for k, v in d.items() if not k.startswith("_")}
            for d in days
        ],
    }

    tracks_path = OUT_DIR / "tracks.json"
    tracks_path.write_text(json.dumps(tracks_out, separators=(",", ":")))
    print(f"  Written: {tracks_path}")

    # Phase 4: Photo geolocation
    if photos_raw:
        print("\n── Phase 4: Photo geolocation ──────────────────────────────────────")
        geotagged = photo_geo.assign_coordinates(
            photos_raw, days, use_exif=not args.skip_exif
        )
        print(f"  Geotagged {len(geotagged)} / {len(photos_raw)} photos")

        # Only include photos whose thumbnail file actually exists on disk.
        # This keeps photos.json in sync even when select_photos.py has culled files.
        geotagged = [p for p in geotagged
                     if (Path("web/public") / p["thumb_url"].lstrip("/")).exists()]
        print(f"  Thumbnail files present: {len(geotagged)}")

        photos_out = {"photos": geotagged}
        photos_path = OUT_DIR / "photos.json"
        photos_path.write_text(json.dumps(photos_out, separators=(",", ":")))
        print(f"  Written: {photos_path}")
    else:
        photos_path = OUT_DIR / "photos.json"
        photos_path.write_text('{"photos":[]}')

    print("\nPipeline complete\n")


if __name__ == "__main__":
    main()
