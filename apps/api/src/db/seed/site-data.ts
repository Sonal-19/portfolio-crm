import type { InsertSiteSettings } from "$/db/schema";

export const siteSettingsSeed: InsertSiteSettings = {
  id: 1,
  artistName: "Bhai Gurpreet Singh Ji Shimla Wale",
  tagline: "Gurbani Kirtan · Raagi · Seva through Sangeet",
  bio: [
    "**Bhai Gurpreet Singh Ji Shimla Wale** is a Gurbani kirtan artist whose voice has carried the shabad to sangat across Punjab and around the world. His jukebox *Best Of Bhai Gurpreet Singh Shimla Wale – Non Stop Kirtan* has crossed **66 lakh views**, and releases like *Satgur Tumre Kaaj Saware*, *Aukhi Ghadi Na Dekhan Deyi* and the album *Narayan* are played in homes and gurdwaras every day.",
    "",
    "Rooted in the raag tradition and trained in harmonium and classical vocal, Bhai Sahib sees kirtan as seva: sharing Guru Sahib's bani in a way that brings calm, strength and chardi kala to every listener.",
    "",
    "Alongside his kirtan, he runs a professional recording studio at Ghanta Ghar, Ludhiana, open free of cost to raagis, kirtani jathas and talented young artists who deserve to be heard.",
  ].join("\n"),
  heroImagePath: "/uploads/brand/portrait-placeholder.svg",
  aboutImagePath: "/uploads/brand/about-placeholder.svg",
  studioGallery: [
    {
      imagePath: "/uploads/studio/studio-console.jpg",
      title: "Mixing & mastering suite",
      description:
        "Multi-channel analog console, studio monitors & acoustic diffuser panels.",
      icon: "sliders",
    },
    {
      imagePath: "/uploads/studio/mic-booth.jpg",
      title: "Acoustically treated vocal booth",
      description:
        "Gold studio condenser microphones, wooden slats & dedicated monitoring.",
      icon: "mic",
    },
    {
      imagePath: "/uploads/studio/video-shoot.jpg",
      title: "Music-video set & lighting",
      description:
        "4K cinema multi-cam setup, softbox lighting & performance staging.",
      icon: "video",
    },
  ],
  heroTrackUrl: "https://www.youtube.com/watch?v=bFoQyydNFLw",
  heroTrackTitle: "Satgur Tumre Kaaj Saware",
  heroTrackSubtitle: "66 Lakh+ views",
  studioIntro:
    "Book a professional recording session at our state-of-the-art studio. Choose from preset packages or build your own — select instruments, duration, sound engineer, mixing, and mastering. Recording and music-video shoots are completely free for every talented artist: this studio is seva.",
  studioAddress: "Near Ghanta Ghar Chowk, Ludhiana, Punjab 141008",
  mapEmbedUrl:
    "https://www.google.com/maps?q=Ghanta+Ghar+Chowk+Ludhiana&output=embed",
  phone: "+91 98765 43210",
  whatsappNumber: "919876543210",
  email: "contact@shimlawale.com",
  facebookUrl: "https://www.facebook.com/shimlawaleofficial/",
  instagramUrl: "https://www.instagram.com/shimlawaleofficial/",
  youtubeUrl: "https://www.youtube.com/shimlawale",
  xUrl: "https://x.com/gsshimlawale",
  spotifyUrl:
    "https://open.spotify.com/search/Bhai%20Gurpreet%20Singh%20Shimla%20Wale",
  appleMusicUrl:
    "https://music.apple.com/in/search?term=Bhai%20Gurpreet%20Singh%20Shimla%20Wale",
  whatsappChannelUrl: "https://whatsapp.com/channel/",
  stats: {
    followers: "94K+",
    views: "66 Lakh+",
    years: "20+",
    albums: "25+",
  },
};
