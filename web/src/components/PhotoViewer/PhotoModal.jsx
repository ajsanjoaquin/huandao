import React, { useEffect, useCallback } from "react";
import PhotoStrip from "./PhotoStrip";

export default function PhotoModal({ photo, dayPhotos, onClose, onNavigate }) {
  const currentIndex = dayPhotos.findIndex((p) => p.id === photo.id);

  const goNext = useCallback(() => {
    if (currentIndex < dayPhotos.length - 1) onNavigate(dayPhotos[currentIndex + 1]);
  }, [currentIndex, dayPhotos, onNavigate]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) onNavigate(dayPhotos[currentIndex - 1]);
  }, [currentIndex, dayPhotos, onNavigate]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, goNext, goPrev]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl leading-none transition-colors"
      >
        ✕
      </button>

      {/* Main image */}
      <div className="relative max-w-4xl w-full mx-4 flex-shrink">
        <img
          src={photo.thumb_url.replace("w400", "w1200")}
          alt={photo.filename}
          className="max-h-[70vh] w-full object-contain rounded-lg"
        />

        {/* Prev / Next */}
        {currentIndex > 0 && (
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
          >
            ‹
          </button>
        )}
        {currentIndex < dayPhotos.length - 1 && (
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
          >
            ›
          </button>
        )}
      </div>

      {/* Metadata */}
      <div className="text-white/60 text-xs mt-3">
        {currentIndex + 1} / {dayPhotos.length}
        {photo.timestamp && (
          <span className="ml-4">
            {new Date(photo.timestamp).toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      {/* Strip */}
      {dayPhotos.length > 1 && (
        <PhotoStrip photos={dayPhotos} activePhoto={photo} onSelect={onNavigate} />
      )}
    </div>
  );
}
