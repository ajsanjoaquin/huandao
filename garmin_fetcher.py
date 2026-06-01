"""Fetch cycling activities and GPX tracks from Garmin Connect."""

import json
import os
from pathlib import Path

import garminconnect


CACHE_DIR = Path("cache")
GPX_DIR = CACHE_DIR / "garmin_gpx"


def _garmin_client():
    email = os.environ["GARMIN_EMAIL"]
    password = os.environ["GARMIN_PASSWORD"]
    client = garminconnect.Garmin(email, password)
    client.login()
    return client


def fetch_activities(start_date: str, end_date: str, force_refresh: bool = False) -> list[dict]:
    """Return list of cycling activity metadata, using cache when available."""
    cache_file = CACHE_DIR / "garmin_activities.json"

    if not force_refresh and cache_file.exists():
        print(f"  [garmin] Using cached activities from {cache_file}")
        return json.loads(cache_file.read_text())

    print(f"  [garmin] Fetching activities {start_date} → {end_date}...")
    client = _garmin_client()
    raw = client.get_activities_by_date(start_date, end_date, activitytype="cycling")

    activities = []
    for a in raw:
        activities.append(
            {
                "activity_id": str(a["activityId"]),
                "date": a["startTimeLocal"][:10],
                "name": a.get("activityName", ""),
                "distance_m": a.get("distance", 0),
                "duration_s": a.get("duration", 0),
                "elevation_gain_m": a.get("elevationGain", 0),
                "calories": a.get("calories", 0),
                "start_lat": a.get("startLatitude"),
                "start_lng": a.get("startLongitude"),
            }
        )

    CACHE_DIR.mkdir(exist_ok=True)
    cache_file.write_text(json.dumps(activities, indent=2))
    print(f"  [garmin] Saved {len(activities)} activities to cache")
    return activities


def fetch_gpx(activity_id: str, force_refresh: bool = False) -> bytes:
    """Download GPX bytes for a single activity, using cache when available."""
    GPX_DIR.mkdir(parents=True, exist_ok=True)
    gpx_file = GPX_DIR / f"{activity_id}.gpx"

    if not force_refresh and gpx_file.exists():
        return gpx_file.read_bytes()

    print(f"  [garmin] Downloading GPX for activity {activity_id}...")
    client = _garmin_client()
    data = client.download_activity(activity_id, dl_fmt=garminconnect.Garmin.ActivityDownloadFormat.GPX)
    gpx_file.write_bytes(data)
    return data


def fetch_all_gpx(activities: list[dict], force_refresh: bool = False) -> dict[str, Path]:
    """Fetch GPX for all activities; return mapping activity_id → gpx Path."""
    result = {}
    for act in activities:
        aid = act["activity_id"]
        fetch_gpx(aid, force_refresh=force_refresh)
        result[aid] = GPX_DIR / f"{aid}.gpx"
    return result
