import React, { useRef, useEffect } from "react";

export default function PhotoStrip({ photos, activePhoto, onSelect }) {
  const activeRef = useRef(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activePhoto]);

  return (
    <div className="flex gap-2 overflow-x-auto mt-4 px-4 pb-2 max-w-4xl w-full">
      {photos.map((p) => {
        const isActive = p.id === activePhoto.id;
        return (
          <button
            key={p.id}
            ref={isActive ? activeRef : null}
            onClick={() => onSelect(p)}
            className={`flex-shrink-0 rounded overflow-hidden transition-all ${
              isActive ? "ring-2 ring-coral-500 opacity-100" : "opacity-50 hover:opacity-80"
            }`}
          >
            <img src={p.thumb_url} alt="" className="h-14 w-14 object-cover" />
          </button>
        );
      })}
    </div>
  );
}
