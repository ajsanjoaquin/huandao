"""
Load photos from a ZIP file (Google Photos Takeout) or a local directory.
Generates small thumbnails in web/public/photos/ to keep deployment size manageable.

Usage:
    python main.py --start ... --end ... --photos-zip ~/Downloads/album.zip
    python main.py --start ... --end ... --photos-dir ~/Downloads/album-folder/
"""

import json
import os
import zipfile
from io import BytesIO
from pathlib import Path

from PIL import Image, ExifTags

PHOTOS_OUT_DIR = Path("web/public/photos")
CACHE_DIR = Path("cache")

THUMB_MAX_PX = 1200        # longest edge for lightbox quality
THUMB_QUALITY = 82         # JPEG quality — good balance of size/quality
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".m4v", ".3gp"}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".heic", ".png", ".webp"}


def _is_image(name: str) -> bool:
    return Path(name).suffix.lower() in IMAGE_EXTENSIONS


def _exif_from_image(img: Image.Image) -> dict:
    """Return raw EXIF dict or empty dict."""
    try:
        return img._getexif() or {}
    except Exception:
        return {}


def _exif_datetime(exif: dict) -> str | None:
    """Extract DateTimeOriginal as ISO 8601 string (Taiwan UTC+8)."""
    for tag_id, value in exif.items():
        if ExifTags.TAGS.get(tag_id) == "DateTimeOriginal":
            try:
                dt = str(value).replace(":", "-", 2).replace(" ", "T")
                return dt + "+08:00"
            except Exception:
                pass
    return None


def _exif_gps(exif: dict) -> tuple[float, float] | None:
    """Extract GPS lat/lng from EXIF dict. Returns (lat, lng) or None."""
    from PIL.ExifTags import GPSTAGS

    def dms_to_dd(dms, ref):
        try:
            d, m, s = dms
            dd = float(d) + float(m) / 60 + float(s) / 3600
            return -dd if ref in ("S", "W") else dd
        except Exception:
            return None

    for tag_id, value in exif.items():
        if ExifTags.TAGS.get(tag_id) == "GPSInfo":
            gps = {ExifTags.GPSTAGS.get(k, k): v for k, v in value.items()}
            lat = dms_to_dd(gps.get("GPSLatitude"), gps.get("GPSLatitudeRef", "N"))
            lng = dms_to_dd(gps.get("GPSLongitude"), gps.get("GPSLongitudeRef", "E"))
            if lat is not None and lng is not None:
                return lat, lng
    return None


def _save_thumbnail(img: Image.Image, out_path: Path) -> None:
    """Resize and save as JPEG, preserving orientation."""
    # Apply EXIF orientation before resizing
    try:
        for tag_id, value in (img._getexif() or {}).items():
            if ExifTags.TAGS.get(tag_id) == "Orientation":
                rotations = {3: 180, 6: 270, 8: 90}
                if value in rotations:
                    img = img.rotate(rotations[value], expand=True)
                break
    except Exception:
        pass

    img = img.convert("RGB")
    img.thumbnail((THUMB_MAX_PX, THUMB_MAX_PX), Image.LANCZOS)
    img.save(out_path, "JPEG", quality=THUMB_QUALITY, optimize=True)


def _process_image(name: str, img_bytes: bytes, out_dir: Path) -> dict | None:
    """Process one image: generate thumbnail, extract EXIF. Returns metadata dict."""
    stem = Path(name).stem
    out_path = out_dir / f"{stem}.jpg"

    try:
        img = Image.open(BytesIO(img_bytes))
        exif = _exif_from_image(img)

        if not out_path.exists():
            _save_thumbnail(img, out_path)

        return {
            "id": stem,
            "filename": Path(name).name,
            "creation_time": _exif_datetime(exif),
            "gps": _exif_gps(exif),   # (lat, lng) or None — used by photo_geo
            "local_path": str(out_path),
            "thumb_local": str(out_path),
            "base_url": None,
        }
    except Exception as e:
        print(f"  [photos] Warning: could not process {name}: {e}")
        return None


def fetch_photos_from_zip(zip_path: str, force_refresh: bool = False) -> list[dict]:
    """Process a Google Photos Takeout ZIP, generating thumbnails."""
    zip_path = Path(zip_path)
    raw_cache = CACHE_DIR / "photos_raw.json"

    if not force_refresh and raw_cache.exists():
        print(f"  [photos] Using cached photo metadata from {raw_cache}")
        return json.loads(raw_cache.read_text())

    PHOTOS_OUT_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(exist_ok=True)

    print(f"  [photos] Processing ZIP: {zip_path}")

    photos = []
    skipped_videos = 0

    with zipfile.ZipFile(zip_path, "r") as zf:
        entries = [e for e in zf.namelist() if not e.endswith("/")]
        images = [e for e in entries if _is_image(e)]
        videos = [e for e in entries if Path(e).suffix.lower() in VIDEO_EXTENSIONS]
        skipped_videos = len(videos)

        print(f"  [photos] {len(images)} images, {skipped_videos} videos (skipped) in ZIP")

        for i, entry in enumerate(images, 1):
            stem = Path(entry).stem
            out_path = PHOTOS_OUT_DIR / f"{stem}.jpg"
            print(f"  [photos] {i}/{len(images)}: {Path(entry).name}", end="\r")

            img_bytes = zf.read(entry)
            meta = _process_image(entry, img_bytes, PHOTOS_OUT_DIR)
            if meta:
                photos.append(meta)

    print(f"\n  [photos] Generated {len(photos)} thumbnails in {PHOTOS_OUT_DIR}")

    thumb_size_mb = sum(p.stat().st_size for p in PHOTOS_OUT_DIR.glob("*.jpg")) / 1_000_000
    print(f"  [photos] Total thumbnail size: {thumb_size_mb:.1f} MB")
    if thumb_size_mb > 800:
        print(f"  [photos] ⚠  Thumbnails exceed 800MB — consider reducing THUMB_MAX_PX or filtering photos")

    raw_cache.write_text(json.dumps(photos, indent=2))
    return photos


def fetch_photos_from_dir(photos_dir: str, force_refresh: bool = False) -> list[dict]:
    """Process a local directory of photos, generating thumbnails."""
    photos_dir = Path(photos_dir)
    raw_cache = CACHE_DIR / "photos_raw.json"

    if not force_refresh and raw_cache.exists():
        print(f"  [photos] Using cached photo metadata from {raw_cache}")
        return json.loads(raw_cache.read_text())

    image_files = [p for p in sorted(photos_dir.iterdir()) if p.suffix.lower() in IMAGE_EXTENSIONS]
    print(f"  [photos] {len(image_files)} images found in {photos_dir}")

    PHOTOS_OUT_DIR.mkdir(parents=True, exist_ok=True)
    photos = []
    for i, path in enumerate(image_files, 1):
        print(f"  [photos] {i}/{len(image_files)}: {path.name}", end="\r")
        meta = _process_image(path.name, path.read_bytes(), PHOTOS_OUT_DIR)
        if meta:
            photos.append(meta)

    print(f"\n  [photos] Done. {len(photos)} thumbnails generated.")
    CACHE_DIR.mkdir(exist_ok=True)
    raw_cache.write_text(json.dumps(photos, indent=2))
    return photos


def fetch_photos(photos_zip: str | None = None, photos_dir: str | None = None, force_refresh: bool = False) -> list[dict]:
    if photos_zip:
        return fetch_photos_from_zip(photos_zip, force_refresh)
    if photos_dir:
        return fetch_photos_from_dir(photos_dir, force_refresh)
    print("  [photos] No --photos-zip or --photos-dir provided — skipping photos")
    return []
