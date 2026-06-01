import { useState, useEffect } from "react";

export function useTrackData() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/data/tracks.json")
      .then((r) => {
        if (!r.ok) throw new Error(`tracks.json: ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch(setError);
  }, []);

  return { data, error };
}
