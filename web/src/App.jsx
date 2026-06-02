import React, { useEffect, useState } from "react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const handleSelectDay = (dayIndex) => {
    selectDay(dayIndex);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-forest-900">
      {/* Sidebar */}
      <Sidebar
        trip={trip}
        days={days}
        activeDayIndex={activeDayIndex}
        dayPhotos={visiblePhotos}
        onSelectDay={handleSelectDay}
        onClearDay={clearDay}
        onPhotoClick={setActivePhoto}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content: map + elevation */}
      <div className="flex flex-col flex-1 overflow-hidden relative">
        {/* Mobile nav toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open day list"
          className="md:hidden absolute top-3 left-3 z-10 flex items-center gap-2 bg-forest-800/90 text-seafoam-200 text-sm font-medium rounded-lg px-3 py-2 border border-forest-600"
        >
          <span className="text-base leading-none">☰</span>
          <span>{activeDayIndex != null ? `Day ${activeDayIndex}` : "Days"}</span>
        </button>

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
