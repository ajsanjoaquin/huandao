# Huandao 環島 — Taiwan by Bike

Interactive map of a Taiwan circumnavigation bike trip.

**Live site: [https://web-kohl-nine-66.vercel.app](https://aj-crew-huandao.vercel.app/)**

## What it shows

- GPS tracks for each day pulled from Garmin Connect
- Elevation profile per day
- Geotagged photos from the trip
- Trip stats: distance, elevation gain, duration

## Re-running the data pipeline

Requires a Python virtual environment and a Google Photos Takeout ZIP of the album.

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Full run
python main.py --start 2025-12-08 --end 2025-12-18 --photos-zip ~/path/to/album.zip

# Photos only (Garmin data cached)
python main.py --start 2025-12-08 --end 2025-12-18 --skip-garmin --photos-zip ~/path/to/album.zip

# Trim photos to ~25% for deployment size
python select_photos.py
```

Copy `.env.template` to `.env` and fill in your Garmin credentials before the first run.

## Deploying

```bash
cd web
npm run build        # verify build passes
vercel --prod        # deploy to Vercel
```
