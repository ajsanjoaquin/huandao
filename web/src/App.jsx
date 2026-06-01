import React, { useEffect } from "react";
import { useTrackData } from "./hooks/useTrackData";
import { usePhotoData } from "./hooks/usePhotoData";
import { useActiveDay } from "./hooks/useActiveDay";
import MapView from "./components/Map/MapView";
import Sidebar from "./components/Sidebar/Sidebar";
import ElevationChart from "./components/ElevationProfile/ElevationChart";
import PhotoModal from "./components/PhotoViewer/PhotoModal";

export default function App() {
  const { data: trackData, error: trackError } = useTrackData();
  const { photos, error: photoError } = usePhotoData();
  const { activeDayIndex, activePhoto, selectDay, clearDay, setActivePhoto } = useActiveDay();

  useEffect(() => {
    if (trackData?.trip?.title) document.title = trackData.trip.title;
  }, [trackData?.trip?.title]);

  if (trackError) {
    return (
      <div className="flex h-screen items-center justify-center bg-forest-900 text-seafoam-400 text-sm">
        Failed to load track data. Run the pipeline first.
      </div>
    );
  }

  if (!trackData) {
    return (
      <div className="flex h-screen items-center justify-center bg-forest-900">
        <div className="text-seafoam-400 text-sm animate-pulse">Loading…</div>
      </div>
    );
  }

  const { trip, days } = trackData;
  const activeDay = activeDayIndex != null ? days.find((d) => d.day_index === activeDayIndex) : null;
  const visiblePhotos = activeDay
    ? photos.filter((p) => p.day_index === activeDay.day_index)
    : photos;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-forest-900">
      {/* Sidebar */}
      <Sidebar
        trip={trip}
        days={days}
        activeDayIndex={activeDayIndex}
        dayPhotos={visiblePhotos}
        onSelectDay={selectDay}
        onClearDay={clearDay}
        onPhotoClick={setActivePhoto}
      />

      {/* Main content: map + elevation */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 min-h-0">
          <MapView
            days={days}
            activeDay={activeDay}
            photos={visiblePhotos}
            onPhotoClick={setActivePhoto}
          />
        </div>
        {activeDay && <ElevationChart profile={activeDay.elevation_profile} />}
      </div>

      {/* Photo lightbox */}
      {activePhoto && (
        <PhotoModal
          photo={activePhoto}
          dayPhotos={visiblePhotos}
          onClose={() => setActivePhoto(null)}
          onNavigate={setActivePhoto}
        />
      )}
    </div>
  );
}
