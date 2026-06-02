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
  const [mobileView, setMobileView] = useState("map");

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
    setMobileView("map");
  };

  const handlePhotoClick = (photo) => {
    setActivePhoto(photo);
    setMobileView("map");
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-forest-900">
      {/* Sidebar — full-screen on mobile "days" view, fixed column on desktop */}
      <div className={mobileView === "days" ? "flex flex-1 flex-col md:flex-none md:w-80" : "hidden md:flex md:flex-col md:w-80"}>
        <Sidebar
          trip={trip}
          days={days}
          activeDayIndex={activeDayIndex}
          dayPhotos={visiblePhotos}
          onSelectDay={handleSelectDay}
          onClearDay={clearDay}
          onPhotoClick={handlePhotoClick}
        />
      </div>

      {/* Main content: map + elevation */}
      <div className={mobileView === "map" ? "flex flex-col flex-1 overflow-hidden" : "hidden md:flex md:flex-col md:flex-1 md:overflow-hidden"}>
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

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex h-14 bg-forest-800 border-t border-forest-600">
        <button
          onClick={() => setMobileView("map")}
          className={`flex-1 text-sm font-medium transition-colors ${
            mobileView === "map" ? "text-coral-400" : "text-seafoam-400"
          }`}
        >
          Map
        </button>
        <button
          onClick={() => setMobileView("days")}
          className={`flex-1 text-sm font-medium transition-colors ${
            mobileView === "days" ? "text-coral-400" : "text-seafoam-400"
          }`}
        >
          {activeDayIndex != null ? `Day ${activeDayIndex}` : "Days"}
        </button>
      </nav>

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
