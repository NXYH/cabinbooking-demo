"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { VENUE } from "@/lib/venue";

/** Hero image with a slow drift; the video fades in over it once it actually plays. */
export function HeroMedia() {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="absolute inset-0 overflow-hidden bg-ink">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={VENUE.heroImage} alt="" className="kenburns absolute inset-0 h-full w-full object-cover" />
      <video
        className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-1000", playing ? "opacity-100" : "opacity-0")}
        src={VENUE.heroVideo}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onPlaying={() => setPlaying(true)}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(12,20,18,0.9)_0%,rgba(12,20,18,0.6)_50%,rgba(12,20,18,0.35)_100%)]" />
    </div>
  );
}
