import React from "react";
import { formatDistance, formatElevation } from "../../lib/format-utils";
import DayCard from "./DayCard";
import TripDescription from "./TripDescription";

function formatTripDates(start, end) {
  if (!start) return "—";
  const fmt = (s) =>
    new Date(s + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const year = end ? new Date(end + "T00:00:00").getFullYear() : new Date(start + "T00:00:00").getFullYear();
  return end ? `${fmt(start)} – ${fmt(end)} ${year}` : `${fmt(start)} ${year}`;
}

export default function Sidebar({ trip, days, activeDayIndex, dayPhotos, onSelectDay, onClearDay, onPhotoClick, isOpen, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={onClose} />
      )}

      <aside className={[
        "w-80 flex flex-col bg-forest-800 border-r border-forest-600 grain-overlay",
        // Mobile: fixed slide-over drawer
        "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40",
        "max-md:transition-transform max-md:duration-300 max-md:ease-in-out",
        isOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full",
        // Desktop: normal flex child
        "md:h-full",
      ].join(" ")}>
      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b border-forest-600 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="text-seafoam-400 text-xs tracking-widest uppercase mb-1 font-medium">
              Taiwan · {trip?.start_date?.slice(0, 4)}
            </div>
            <h1 className="text-white font-semibold text-xl leading-tight">
              <span className="text-coral-400">環島</span>
              <br />
              <span className="text-base font-normal text-seafoam-200">Taiwan by Bike</span>
            </h1>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="md:hidden flex-shrink-0 ml-3 w-9 h-9 flex items-center justify-center text-seafoam-400 hover:text-white rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Trip totals */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat label="Distance" value={formatDistance(trip?.total_distance_km)} />
          <Stat label="Elevation" value={formatElevation(trip?.total_elevation_m)} />
          <Stat label="Days" value={trip?.total_days ?? "—"} />
          <Stat label="Dates" value={formatTripDates(trip?.start_date, trip?.end_date)} />
        </div>

        {activeDayIndex != null && (
          <button
            onClick={onClearDay}
            className="mt-3 text-xs text-seafoam-400 hover:text-seafoam-200 transition-colors flex items-center gap-1"
          >
            ← All days
          </button>
        )}
      </div>

      {/* Day list */}
      <div className="flex-1 overflow-y-auto sidebar-scroll py-3 space-y-1.5">
        <TripDescription />
        {days.map((day) => (
          <DayCard
            key={day.day_index}
            day={day}
            isActive={activeDayIndex === day.day_index}
            onClick={() => onSelectDay(day.day_index)}
          />
        ))}
      </div>

      {/* Day photo strip — shown when a day is selected and has photos */}
      {activeDayIndex != null && dayPhotos?.length > 0 && (
        <div className="flex-shrink-0 border-t border-forest-600">
          <div className="px-3 pt-2 pb-1 text-[10px] text-seafoam-500 uppercase tracking-widest">
            {dayPhotos.length} photo{dayPhotos.length !== 1 ? "s" : ""}
          </div>
          <div className="flex gap-1.5 overflow-x-auto px-3 pb-3 sidebar-scroll">
            {dayPhotos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => { onPhotoClick(photo); onClose(); }}
                className="flex-shrink-0 rounded overflow-hidden opacity-80 hover:opacity-100 transition-opacity"
              >
                <img
                  src={photo.thumb_url}
                  alt=""
                  className="h-16 w-16 object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      )}
      </aside>
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-[10px] text-seafoam-500 uppercase tracking-wider">{label}</div>
      <div className="text-white text-sm font-medium">{value}</div>
    </div>
  );
}
