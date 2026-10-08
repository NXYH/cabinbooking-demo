import { Accessibility, Car, Coffee, Mic, PenLine, Projector, ShieldCheck, Snowflake, Sofa, Video, Wifi, Zap } from "lucide-react";

// Single source for venue copy. Swap these values for the client's real details.
export const VENUE = {
  name: "The Cabin",
  fullName: "The Cabin · Conference Hall",
  tagline: "A conference hall, composed.",
  address: "4th Floor, Marine Crest, Marine Drive, Kochi, Kerala 682031",
  phone: "+91 98470 12345",
  email: "reservations@thecabin.in",
  gstin: "32ABCDE1234F1Z5",
  sqft: 2400,
  maxPax: 80,
  ceiling: "14 ft",
  heroVideo: "/media/hall.mp4", // drop the client's video here; the hero image shows until it loads
  heroImage: "/images/hero.jpg",
  gallery: [
    { src: "/images/hall.jpg", alt: "Main hall in conference layout" },
    { src: "/images/suite.jpg", alt: "Boardroom suite with city view" },
    { src: "/images/keynote.jpg", alt: "Keynote presentation on the main screen" },
    { src: "/images/boardroom.jpg", alt: "Boardroom table setup" },
    { src: "/images/audience.jpg", alt: "Theatre seating during a seminar" },
    { src: "/images/evening.jpg", alt: "Evening networking reception" },
  ],
  layouts: [
    { name: "Theatre", pax: 80 },
    { name: "Cocktail", pax: 100 },
    { name: "Classroom", pax: 50 },
    { name: "U-Shape", pax: 36 },
    { name: "Boardroom", pax: 30 },
  ],
} as const;

export const FACILITIES = [
  { icon: Snowflake, title: "Central air conditioning", text: "Zoned, silent VRF cooling." },
  { icon: Projector, title: "4K laser projector", text: "150\" screen with a 4K confidence monitor." },
  { icon: Mic, title: "Studio-grade audio", text: "Bose line array, 4 wireless mics." },
  { icon: Wifi, title: "1 Gbps fibre Wi-Fi", text: "Dedicated, redundant links." },
  { icon: Video, title: "Video conferencing", text: "Zoom Rooms, PTZ camera, ceiling mics." },
  { icon: Zap, title: "100% power backup", text: "Online UPS and silent DG set." },
  { icon: Coffee, title: "Pantry & catering", text: "Barista coffee, curated menus." },
  { icon: Car, title: "Valet parking", text: "40 covered bays on site." },
  { icon: Sofa, title: "Green room & lounge", text: "Private prep room for speakers." },
  { icon: Accessibility, title: "Step-free access", text: "Lift access, accessible restrooms." },
  { icon: PenLine, title: "Writable walls", text: "Glass boards and flip charts." },
  { icon: ShieldCheck, title: "On-site host", text: "Event manager for every booking." },
] as const;

export const PURPOSES = [
  "Corporate meeting",
  "Conference",
  "Training / Workshop",
  "Seminar",
  "Product launch",
  "Press meet",
  "Interviews",
  "Celebration",
  "Other",
] as const;
