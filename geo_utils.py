"""Parse GPX files and compute route statistics."""

import math
from pathlib import Path

import gpxpy
import gpxpy.gpx


def _haversine(lat1, lon1, lat2, lon2) -> float:
    """Return distance in metres between two lat/lng points."""
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _downsample(points: list, max_points: int = 500) -> list:
    if len(points) <= max_points:
        return points
    stride = len(points) // max_points
    return points[::stride]


def parse_gpx(gpx_path: Path) -> dict:
    """Parse a GPX file and return all derived route data."""
    with gpx_path.open("rb") as f:
        gpx = gpxpy.parse(f)

    raw_points = []  # (lat, lng, elevation_m, time)
    for track in gpx.tracks:
        for segment in track.segments:
            for pt in segment.points:
                raw_points.append((pt.latitude, pt.longitude, pt.elevation or 0, pt.time))

    if not raw_points:
        return {}

    # Track points for map: [lng, lat, elevation]
    track_points = [[p[1], p[0], round(p[2], 1)] for p in raw_points]

    # Distance
    total_m = 0.0
    for i in range(1, len(raw_points)):
        total_m += _haversine(raw_points[i - 1][0], raw_points[i - 1][1], raw_points[i][0], raw_points[i][1])

    # Elevation gain
    elev_gain = 0.0
    for i in range(1, len(raw_points)):
        delta = raw_points[i][2] - raw_points[i - 1][2]
        if delta > 0:
            elev_gain += delta

    # Elevation profile (cumulative distance vs elevation)
    cumulative_m = 0.0
    profile_raw = [{"distance_km": 0.0, "elevation_m": round(raw_points[0][2], 1)}]
    for i in range(1, len(raw_points)):
        cumulative_m += _haversine(raw_points[i - 1][0], raw_points[i - 1][1], raw_points[i][0], raw_points[i][1])
        profile_raw.append(
            {
                "distance_km": round(cumulative_m / 1000, 3),
                "elevation_m": round(raw_points[i][2], 1),
            }
        )
    elevation_profile = _downsample(profile_raw)

    # Bounding box [min_lng, min_lat, max_lng, max_lat]
    lats = [p[0] for p in raw_points]
    lngs = [p[1] for p in raw_points]
    bbox = [min(lngs), min(lats), max(lngs), max(lats)]

    # Timestamps for photo correlation
    timestamps = [p[3] for p in raw_points if p[3] is not None]

    return {
        "track_points": _downsample(track_points, max_points=2000),
        "distance_km": round(total_m / 1000, 2),
        "elevation_gain_m": round(elev_gain),
        "elevation_profile": elevation_profile,
        "bbox": [round(v, 6) for v in bbox],
        "timestamps": timestamps,  # kept in memory only, not written to JSON
        "raw_points": raw_points,  # kept in memory only, for photo correlation
    }
