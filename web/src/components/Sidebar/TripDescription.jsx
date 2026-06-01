import React from "react";

const DESCRIPTION = [
  "Four kids from YNC — AJ ",
  { flag: "🇵🇭" },
  ", Sangam ",
  { flag: "🇳🇵" },
  ", Ian ",
  { flag: "🇳🇿" },
  ", and Prayog ",
  { flag: "🇳🇵" },
  " — decided to ride around the entire island of Taiwan on the power of their legs. Slightly easier than a Level 2000 YNC module. Harder than a Week 7.",
];

export default function TripDescription() {
  return (
    <div className="mx-3 mb-3 rounded-lg border border-seafoam-500/20 bg-forest-700/50">
      <div className="h-px bg-gradient-to-r from-coral-500/80 via-coral-400/40 to-transparent" />
      <div className="px-4 py-3">
        <div className="text-coral-400 text-[10px] font-semibold uppercase tracking-widest mb-2">
          The Story
        </div>
        <p className="text-seafoam-200/80 text-[12.5px] leading-relaxed">
          {DESCRIPTION.map((part, i) =>
            typeof part === "string" ? (
              <span key={i}>{part}</span>
            ) : (
              <span key={i} className="text-sm">
                {part.flag}
              </span>
            )
          )}
        </p>
      </div>
    </div>
  );
}
