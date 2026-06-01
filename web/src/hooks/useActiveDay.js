import { useState, useCallback } from "react";

export function useActiveDay() {
  const [activeDayIndex, setActiveDayIndex] = useState(null); // null = overview
  const [activePhoto, setActivePhoto] = useState(null);

  const selectDay = useCallback((index) => {
    setActiveDayIndex(index);
    setActivePhoto(null);
  }, []);

  const clearDay = useCallback(() => {
    setActiveDayIndex(null);
    setActivePhoto(null);
  }, []);

  return { activeDayIndex, activePhoto, selectDay, clearDay, setActivePhoto };
}
