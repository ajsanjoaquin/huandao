import { useState, useEffect } from "react";

export function usePhotoData() {
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/data/photos.json")
      .then((r) => {
        if (!r.ok) throw new Error(`photos.json: ${r.status}`);
        return r.json();
      })
      .then((d) => setPhotos(d.photos || []))
      .catch(setError);
  }, []);

  return { photos, error };
}
