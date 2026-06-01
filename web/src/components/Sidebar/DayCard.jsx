import React from "react";
import { formatDistance, formatElevation, formatDuration, formatDate } from "../../lib/format-utils";

export default function DayCard({ day, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg px-3 py-3 transition-all duration-150 ${
        isActive
          ? "bg-coral-500 text-white shadow-lg"
          : "bg-forest-700 hover:bg-forest-600 text-seafoam-200"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div
            className={`text-[10px] font-medium uppercase tracking-wider mb-0.5 ${
              isActive ? "text-coral-200" : "text-seafoam-500"
            }`}
          >
            Day {day.day_index} · {formatDate(day.date)}
          </div>
          <div className={`text-sm font-medium leading-snug ${isActive ? "text-white" : "text-seafoam-100"}`}>
            {day.title}
          </div>
        </div>
        <div className={`text-right text-xs ml-3 flex-shrink-0 ${isActive ? "text-coral-200" : "text-seafoam-500"}`}>
          <div className="font-medium">{formatDistance(day.distance_km)}</div>
          <div className="mt-0.5">{formatDuration(day.duration_s)}</div>
        </div>
      </div>
      <div className={`mt-2 flex gap-3 text-[11px] ${isActive ? "text-coral-200" : "text-seafoam-500"}`}>
        <span>↑ {formatElevation(day.elevation_gain_m)}</span>
        {day.calories > 0 && <span>{day.calories.toLocaleString()} kcal</span>}
      </div>
    </button>
  );
}
