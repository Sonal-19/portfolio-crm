import type { InsertSiteSettings } from "$/db/schema";

export const siteSettingsSeed: InsertSiteSettings = {
  id: 1,
  artistName: "Bhai Gurpreet Singh Ji Shimla Wale",
  tagline: "Gurbani Kirtan · 30+ Years of Seva · Chairman, Amritvela Trust",
  bio: [
    "**Bhai Gurpreet Singh Ji Shimla Wale** has been performing Gurbani Kirtan for **more than 30 years**. He leads a professional kirtani jatha that travels across India for samagams, gurpurabs, Amritvela programs and family functions. His jukebox *Best Of Bhai Gurpreet Singh Shimla Wale – Non Stop Kirtan* has crossed **66 lakh views**, and releases like *Satgur Tumre Kaaj Saware*, *Aukhi Ghadi Na Dekhan Deyi* and the album *Narayan* are played in homes and gurdwaras every day.",
    "",
    "He is the **Chairman of the Amritvela Trust**, which organises Gurbani Kirtan, Amritvela Simran and humanitarian programs. Under his leadership the Trust was recognised by the **World Book of Records, London** for a 43-day Prabhat Pheri and Silent (headphone) Kirtan, held every morning from 3:00 to 5:00 AM during the Guru Nanak Jayanti celebrations in Ulhasnagar.",
    "",
    "Rooted in the raag tradition, Bhai Sahib sees kirtan as seva: sharing Guru Sahib's bani in a way that brings calm, strength and chardi kala to every listener.",
  ].join("\n"),
  heroImagePath: "/uploads/brand/profile-transparent.webp",
  aboutImagePath: "/uploads/brand/about-placeholder.svg",
  gallery: [
    {
      imagePath: "/uploads/studio/studio-console.jpg",
      title: "Mixing & mastering suite",
      description:
        "Sangat joins Naam Simran in the early hours, 3:00 to 5:00 AM.",
      icon: "khanda",
    },
    {
      imagePath: "/uploads/studio/mic-booth.jpg",
      title: "Acoustically treated vocal booth",
      description:
        "The full jatha with harmonium, tabla and a professional sound setup.",
      icon: "harmonium",
    },
    {
      imagePath: "/uploads/studio/video-shoot.jpg",
      title: "Music-video set & lighting",
      description:
        "World-record Prabhat Pheri with wireless headphones for the sangat.",
      icon: "headphones",
    },
  ],
  heroTrackUrl: "https://www.youtube.com/watch?v=bFoQyydNFLw",
  heroTrackTitle: "Satgur Tumre Kaaj Saware",
  heroTrackSubtitle: "66 Lakh+ views",
  kirtanIntro:
    "Invite Bhai Gurpreet Singh Ji and his professional kirtani jatha to your gurdwara, home or function. We perform at Sukhmani Sahib and Akhand Path bhogs, Anand Karaj, gurpurabs, Amritvela Simran programs and Silent Kirtan, anywhere in India. Share your details and our team will call you to plan the program.",
  address: "Amritvela Trust, Near Ghanta Ghar Chowk, Ludhiana, Punjab 141008",
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
    years: "30+",
    albums: "25+",
  },
};
