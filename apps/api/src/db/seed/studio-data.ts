export const packagesSeed = [
  {
    name: "Shabad Recording",
    slug: "shabad-recording",
    description:
      "A focused session to record a single shabad with clean vocals and harmonium, ready for release.",
    durationHours: 2,
    includes: ["Vocal + harmonium recording", "Sound engineer", "Basic mix"],
    icon: "mic",
    isFeatured: false,
    sortOrder: 1,
  },
  {
    name: "Kirtan Album Day",
    slug: "kirtan-album-day",
    description:
      "A full day in the studio for a jatha to record multiple shabads with tabla and supporting instruments.",
    durationHours: 8,
    includes: [
      "Up to 6 shabads",
      "Multi-track recording",
      "Tabla & instrument mics",
      "Sound engineer all day",
    ],
    icon: "disc",
    isFeatured: true,
    sortOrder: 2,
  },
  {
    name: "Record + Mix + Master",
    slug: "record-mix-master",
    description:
      "Record your track, then we mix and master it to a professional standard for YouTube and streaming.",
    durationHours: 4,
    includes: ["Recording", "Professional mixing", "Mastering for streaming"],
    icon: "sliders",
    isFeatured: false,
    sortOrder: 3,
  },
  {
    name: "Music Video Shoot",
    slug: "music-video-shoot",
    description:
      "Shoot a music video for your shabad in our studio set with lighting, cameras and basic editing.",
    durationHours: 6,
    includes: ["Studio set & lighting", "Two-camera shoot", "Basic video edit"],
    icon: "video",
    isFeatured: false,
    sortOrder: 4,
  },
];

export const instrumentsSeed = [
  "Harmonium",
  "Tabla",
  "Dilruba",
  "Rabab",
  "Taus",
  "Sarangi",
  "Flute",
  "Keyboard",
  "Guitar",
  "Dholak",
  "Chimta",
].map((name, i) => ({ name, sortOrder: i + 1 }));

export const engineersSeed = [
  {
    name: "Harjot Singh",
    bio: "Lead sound engineer, 12 years recording Gurbani and live kirtan.",
  },
  {
    name: "Amandeep Kaur",
    bio: "Mixing & mastering engineer who specialises in acoustic and raag-based music.",
  },
];

export const addonsSeed = [
  {
    name: "Mixing",
    description: "Balance, EQ and effects on every track.",
    kind: "mixing" as const,
  },
  {
    name: "Mastering",
    description: "Loudness and polish for YouTube, Spotify and Apple Music.",
    kind: "mastering" as const,
  },
  {
    name: "Music Video Shoot",
    description: "Camera crew and lighting for a performance video.",
    kind: "video_shoot" as const,
  },
  {
    name: "Lyric Video / Gurmukhi Subtitles",
    description: "Shabad text with translation overlaid on your video.",
    kind: "other" as const,
  },
];
