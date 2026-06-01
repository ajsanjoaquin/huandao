import React, { useEffect, useRef } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import XYZ from "ol/source/XYZ";
import "ol/ol.css";

import {
  TAIWAN_CENTER,
  TAIWAN_ZOOM,
  trackToFeature,
  activeTrackStyle,
  dimmedTrackStyle,
  dayTrackStyle,
  bboxToExtent,
  photoToFeature,
  photoMarkerStyle,
  photoMarkerHoverStyle,
} from "../../lib/ol-helpers";

export default function MapView({ days, activeDay, photos, onPhotoClick }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const trackSourceRef = useRef(null);
  const photoSourceRef = useRef(null);

  // Initialize map once
  useEffect(() => {
    const trackSource = new VectorSource();
    const photoSource = new VectorSource();
    trackSourceRef.current = trackSource;
    photoSourceRef.current = photoSource;

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new XYZ({
            url: "https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png",
            attributions:
              'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
            maxZoom: 17,
          }),
        }),
        new VectorLayer({ source: trackSource, zIndex: 1 }),
        new VectorLayer({ source: photoSource, zIndex: 2 }),
      ],
      view: new View({
        center: TAIWAN_CENTER,
        zoom: TAIWAN_ZOOM,
        minZoom: 6,
        maxZoom: 18,
      }),
    });

    // Click handler for photo markers
    map.on("click", (e) => {
      map.forEachFeatureAtPixel(e.pixel, (feature) => {
        const photo = feature.get("photo");
        if (photo) {
          onPhotoClick(photo);
          return true;
        }
      });
    });

    // Pointer cursor on hover
    map.on("pointermove", (e) => {
      const hit = map.hasFeatureAtPixel(e.pixel, {
        layerFilter: (l) => l.getSource() === photoSource,
      });
      map.getTargetElement().style.cursor = hit ? "pointer" : "";
    });

    mapInstance.current = map;

    return () => {
      map.setTarget(null);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-render tracks when days or activeDay changes
  useEffect(() => {
    const source = trackSourceRef.current;
    const map = mapInstance.current;
    if (!source || !map || !days?.length) return;

    source.clear();

    if (activeDay) {
      // Single day: one highlighted track
      const feature = trackToFeature(activeDay);
      feature.setStyle(activeTrackStyle());
      source.addFeature(feature);

      const extent = bboxToExtent(activeDay.bbox);
      map.getView().fit(extent, { padding: [60, 60, 160, 60], duration: 500, maxZoom: 14 });
    } else {
      // Overview: all tracks with distinct hues
      days.forEach((day, i) => {
        const hue = Math.round((i / days.length) * 280 + 160); // seafoam → teal → blue range
        const feature = trackToFeature(day);
        feature.setStyle(dayTrackStyle(hue));
        source.addFeature(feature);
      });

      map.getView().animate({ center: TAIWAN_CENTER, zoom: TAIWAN_ZOOM, duration: 600 });
    }
  }, [days, activeDay]);

  // Re-render photo markers when photos change
  useEffect(() => {
    const source = photoSourceRef.current;
    if (!source) return;

    source.clear();
    photos.forEach((photo) => {
      const feature = photoToFeature(photo);
      feature.setStyle(photoMarkerStyle());
      source.addFeature(feature);
    });
  }, [photos]);

  return <div ref={mapRef} className="w-full h-full" />;
}
