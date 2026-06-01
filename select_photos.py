#!/usr/bin/env python3
"""
Randomly keep KEEP_FRACTION% of photos.
Rebuilds photos.json from the full pipeline cache so all kept photos
have complete metadata regardless of previous runs of this script.
"""

import json
import random
from pathlib import Path

PHOTOS_DIR = Path("web/public/photos")
PHOTOS_JSON = Path("web/public/data/photos.json")
CACHE_JSON = Path("cache/photos_raw.json")
KEEP_FRACTION = 0.25
SEED = 42  # fixed seed — re-runs produce the same selection

# Load full geotagged metadata from the pipeline output
full_photos = json.loads(PHOTOS_JSON.read_text())["photos"]

random.seed(SEED)
kept = random.sample(full_photos, k=int(len(full_photos) * KEEP_FRACTION))
kept_filenames = {Path(p["thumb_url"]).name for p in kept}

# Delete physical files for dropped photos
dropped = 0
for jpg in PHOTOS_DIR.glob("*.jpg"):
    if jpg.name not in kept_filenames:
        jpg.unlink()
        dropped += 1

# Write photos.json with every kept photo included
PHOTOS_JSON.write_text(json.dumps({"photos": kept}, separators=(",", ":")))

total_mb = sum(p.stat().st_size for p in PHOTOS_DIR.glob("*.jpg")) / 1e6
print(f"Total: {len(full_photos)}  Kept: {len(kept)}  Deleted files: {dropped}")
print(f"photos.json entries: {len(kept)}")
print(f"Total photo size: {total_mb:.1f} MB")
