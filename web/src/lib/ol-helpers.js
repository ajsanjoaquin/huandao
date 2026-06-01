import { fromLonLat } from "ol/proj";
import Feature from "ol/Feature";
import { LineString, Point } from "ol/geom";
import { Style, Stroke, Fill, Circle as CircleStyle } from "ol/style";

// Taiwan-centred view
export const TAIWAN_CENTER = fromLonLat([120.9605, 23.6978]);
export const TAIWAN_ZOOM = 8;

export function trackToFeature(day) {
  const coords = day.track_points.map(([lng, lat]) => fromLonLat([lng, lat]));
  const feature = new Feature({ geometry: new LineString(coords) });
  feature.set("day", day);
  return feature;
}

export function activeTrackStyle() {
  return new Style({
    stroke: new Stroke({ color: "#E05A2B", width: 5, lineCap: "round", lineJoin: "round" }),
  });
}

export function dimmedTrackStyle() {
  return new Style({
    stroke: new Stroke({ color: "rgba(224,90,43,0.25)", width: 3, lineCap: "round" }),
  });
}

export function dayTrackStyle(hue) {
  return new Style({
    stroke: new Stroke({ color: `hsla(${hue},70%,60%,0.85)`, width: 3.5, lineCap: "round" }),
  });
}

export function bboxToExtent(bbox) {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const sw = fromLonLat([minLng, minLat]);
  const ne = fromLonLat([maxLng, maxLat]);
  return [sw[0], sw[1], ne[0], ne[1]];
}

export function photoToFeature(photo) {
  const feature = new Feature({
    geometry: new Point(fromLonLat([photo.lng, photo.lat])),
  });
  feature.set("photo", photo);
  return feature;
}

export function photoMarkerStyle() {
  return new Style({
    image: new CircleStyle({
      radius: 10,
      fill: new Fill({ color: "#E05A2B" }),
      stroke: new Stroke({ color: "#fff", width: 2.5 }),
    }),
  });
}

export function photoMarkerHoverStyle() {
  return new Style({
    image: new CircleStyle({
      radius: 13,
      fill: new Fill({ color: "#e87a54" }),
      stroke: new Stroke({ color: "#fff", width: 2.5 }),
    }),
  });
}
