import type { Profile, Moment } from "./types";

const stockPhoto = (seed: string) =>
  `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=900&q=80`;

export const MOCK_PROFILES: Profile[] = [
  {
    id: "p_aria",
    name: "Aria",
    age: 27,
    pronouns: "she/her",
    orientation: "queer",
    city: "Brooklyn",
    distanceKm: 3,
    intent: "long-term",
    headline: "Bookstore loiterer · Negroni enthusiast",
    bio: "Architect by day, ceramicist by weekend. Looking for someone to lose track of time with at the Met.",
    job: "Architect @ SO-IL",
    school: "Cooper Union",
    height_in: 67,
    weight_lb: 130,
    race: "White",
    zodiac: "libra",
    languages: ["English", "Italian"],
    vibes: ["creative", "artsy", "intellectual", "foodie"],
    interests: ["pottery", "modernist novels", "natural wine", "biking the bridge", "Criterion movies"],
    prompts: [
      { q: "The way to win me over is", a: "Tell me your favorite building and exactly why." },
      { q: "Most spontaneous thing I've done", a: "Bought a one-way ticket to Lisbon for a pastel de nata." },
      { q: "Two truths and a lie", a: "I've met Zaha Hadid · I can't ride a bike · I cried at Dune Part Two." }
    ],
    media: [
      { kind: "photo", url: stockPhoto("photo-1524504388940-b1c1722653e1?dpr=2"), aiVerified: true },
      { kind: "photo", url: stockPhoto("photo-1517841905240-472988babdf9?dpr=2") },
      { kind: "voice", url: "voice://aria-1", transcript: "Hi! It's Aria — looking for a partner in slowness.", durationSec: 9 },
      { kind: "photo", url: stockPhoto("photo-1531123897727-8f129e1688ce?dpr=2") }
    ],
    verified: true,
    premium: true,
    personality: { open: 0.9, warm: 0.7, driven: 0.75, playful: 0.6, grounded: 0.65 },
    dealbreakers: ["smoking"],
    lastActive: "2026-05-05T22:14:00Z"
  },
  {
    id: "p_kai",
    name: "Kai",
    age: 30,
    pronouns: "he/him",
    orientation: "straight",
    city: "Williamsburg",
    distanceKm: 5,
    intent: "long-term",
    headline: "Climber · Synth nerd · Bad cook (improving)",
    bio: "Software at a small AI lab. Will absolutely take you to a sound bath and a hardcore show in the same week.",
    job: "ML engineer",
    school: "MIT",
    height_in: 72,
    weight_lb: 174,
    race: "Asian",
    zodiac: "scorpio",
    languages: ["English", "Mandarin"],
    vibes: ["techy", "athletic", "musical", "creative"],
    interests: ["bouldering", "modular synths", "ramen", "ambient music", "long walks"],
    prompts: [
      { q: "My simple pleasures", a: "Espresso, a clean terminal, and a warm hand to hold." },
      { q: "I'll fall for you if", a: "You can sit in silence with me and not make it weird." },
      { q: "Greenflag I bring", a: "I will never out-text you. We are equals here." }
    ],
    media: [
      { kind: "photo", url: stockPhoto("photo-1492288991661-058aa541ff43?dpr=2"), aiVerified: true },
      { kind: "video", url: "video://kai-1", poster: stockPhoto("photo-1500648767791-00dcc994a43e?dpr=2") },
      { kind: "photo", url: stockPhoto("photo-1488161628813-04466f872be2?dpr=2") }
    ],
    verified: true,
    premium: false,
    personality: { open: 0.7, warm: 0.6, driven: 0.85, playful: 0.55, grounded: 0.8 },
    lastActive: "2026-05-06T06:02:00Z"
  },
  {
    id: "p_noor",
    name: "Noor",
    age: 26,
    pronouns: "they/them",
    orientation: "queer",
    city: "Bushwick",
    distanceKm: 6,
    intent: "open-to-anything",
    headline: "DJ · Plant parent · Reformed perfectionist",
    bio: "I make playlists like love letters. Looking for someone who texts back and dances badly.",
    job: "Creative director",
    school: "Parsons",
    weight_lb: 141,
    race: "Middle Eastern",
    zodiac: "aquarius",
    languages: ["English", "Arabic", "French"],
    vibes: ["musical", "creative", "artsy", "party"],
    interests: ["club nights", "monstera babies", "thrifting", "tarot for fun", "matcha"],
    prompts: [
      { q: "On Sunday morning you'll find me", a: "On a slow walk with iced oat lattes." },
      { q: "Unreasonably attached to", a: "The exact 124 BPM." },
      { q: "I'll know it's love when", a: "You make me a playlist before I ask." }
    ],
    media: [
      { kind: "photo", url: stockPhoto("photo-1534528741775-53994a69daeb?dpr=2"), aiVerified: true },
      { kind: "photo", url: stockPhoto("photo-1502823403499-6ccfcf4fb453?dpr=2") },
      { kind: "voice", url: "voice://noor-1", transcript: "Hey, it's Noor — let's get bored together.", durationSec: 7 }
    ],
    verified: true,
    premium: true,
    personality: { open: 0.95, warm: 0.75, driven: 0.6, playful: 0.85, grounded: 0.45 },
    lastActive: "2026-05-06T05:11:00Z"
  },
  {
    id: "p_sasha",
    name: "Sasha",
    age: 29,
    pronouns: "she/her",
    orientation: "bisexual",
    city: "Manhattan",
    distanceKm: 8,
    intent: "long-term",
    headline: "ER doctor · Marathoner · Soft heart",
    bio: "I work nights so I value real plans. Bring snacks and a strong opinion about a movie.",
    job: "ER physician",
    school: "Columbia",
    height_in: 66,
    weight_lb: 134,
    race: "White",
    zodiac: "capricorn",
    languages: ["English", "Russian"],
    vibes: ["athletic", "ambitious", "intellectual", "chill"],
    interests: ["running", "true crime pods", "spicy food", "weekend hikes"],
    prompts: [
      { q: "A non-negotiable", a: "Kindness to waiters." },
      { q: "Best Sunday", a: "10K + bagel + nap + a niche documentary." },
      { q: "I'm weirdly good at", a: "Reading rooms within 8 seconds." }
    ],
    media: [
      { kind: "photo", url: stockPhoto("photo-1517365830460-955ce3ccd263?dpr=2"), aiVerified: true },
      { kind: "photo", url: stockPhoto("photo-1487412720507-e7ab37603c6f?dpr=2") },
      { kind: "photo", url: stockPhoto("photo-1505932049984-db21cb31d11f?dpr=2") }
    ],
    verified: true,
    premium: false,
    personality: { open: 0.65, warm: 0.8, driven: 0.95, playful: 0.5, grounded: 0.85 },
    dealbreakers: ["dishonesty"],
    lastActive: "2026-05-06T02:30:00Z"
  },
  {
    id: "p_juno",
    name: "Juno",
    age: 25,
    pronouns: "she/they",
    orientation: "pansexual",
    city: "Greenpoint",
    distanceKm: 4,
    intent: "short-term",
    headline: "Designer · Skater · Chronic over-orderer",
    bio: "Soft launching the idea of being in love. Will absolutely split a tasting menu with you.",
    job: "Product designer",
    school: "RISD",
    weight_lb: 123,
    race: "Asian",
    zodiac: "gemini",
    languages: ["English", "Korean"],
    vibes: ["creative", "artsy", "foodie", "party"],
    interests: ["skateboarding", "pho", "weird typography", "sample sales"],
    prompts: [
      { q: "Together we could", a: "Ride the J train to nowhere and find a new pizza." },
      { q: "Most controversial opinion", a: "Pineapple on pizza, but specifically jalapeño + pineapple." },
      { q: "Worst first date", a: "He brought his mom. Twice." }
    ],
    media: [
      { kind: "photo", url: stockPhoto("photo-1488426862026-3ee34a7d66df?dpr=2"), aiVerified: true },
      { kind: "photo", url: stockPhoto("photo-1539571696357-5a69c17a67c6?dpr=2") },
      { kind: "video", url: "video://juno-1", poster: stockPhoto("photo-1494790108377-be9c29b29330?dpr=2") }
    ],
    verified: false,
    premium: false,
    personality: { open: 0.85, warm: 0.7, driven: 0.5, playful: 0.95, grounded: 0.4 },
    lastActive: "2026-05-06T07:01:00Z"
  },
  {
    id: "p_marcus",
    name: "Marcus",
    age: 32,
    pronouns: "he/him",
    orientation: "straight",
    city: "Park Slope",
    distanceKm: 9,
    intent: "marriage",
    headline: "Dad-to-be-someday · Grill captain · Trail runner",
    bio: "I want the real thing. Looking for a partner I can build a quiet, big life with.",
    job: "Civil engineer",
    school: "NYU",
    height_in: 74,
    weight_lb: 194,
    race: "Latino",
    zodiac: "taurus",
    languages: ["English", "Spanish"],
    vibes: ["ambitious", "outdoorsy", "athletic", "homebody"],
    interests: ["smoked brisket", "trail running", "novels", "weekend home projects"],
    prompts: [
      { q: "I take pride in", a: "Showing up early and meaning what I say." },
      { q: "What I'm working on", a: "Less screen time, more dinner parties." },
      { q: "If we got coffee I'd ask", a: "What's the last thing that made you laugh until you cried?" }
    ],
    media: [
      { kind: "photo", url: stockPhoto("photo-1500648767791-00dcc994a43e?dpr=2"), aiVerified: true },
      { kind: "photo", url: stockPhoto("photo-1506794778202-cad84cf45f1d?dpr=2") }
    ],
    verified: true,
    premium: true,
    personality: { open: 0.55, warm: 0.85, driven: 0.9, playful: 0.5, grounded: 0.95 },
    lastActive: "2026-05-05T19:50:00Z"
  },
  {
    id: "p_iris",
    name: "Iris",
    age: 28,
    pronouns: "she/her",
    orientation: "lesbian",
    city: "Long Island City",
    distanceKm: 11,
    intent: "long-term",
    headline: "Filmmaker · Bookworm · Sober since '23",
    bio: "I make documentaries about messy women. Looking for a steady soft place. Tea over wine.",
    job: "Documentary filmmaker",
    school: "NYU Tisch",
    weight_lb: 126,
    race: "White",
    zodiac: "cancer",
    languages: ["English"],
    vibes: ["creative", "bookish", "intellectual", "chill"],
    interests: ["arthouse cinema", "ceramics", "long letters", "dogs in costumes"],
    prompts: [
      { q: "Fact about me you wouldn't guess", a: "I won a state spelling bee with 'logorrhea'." },
      { q: "I'm looking for", a: "Slow growing, deep roots. No games." },
      { q: "I'll bring snacks if", a: "You bring the playlist." }
    ],
    media: [
      { kind: "photo", url: stockPhoto("photo-1463453091185-61582044d556?dpr=2"), aiVerified: true },
      { kind: "photo", url: stockPhoto("photo-1438761681033-6461ffad8d80?dpr=2") },
      { kind: "voice", url: "voice://iris-1", transcript: "Hi I'm Iris. I tell stories for a living.", durationSec: 11 }
    ],
    verified: true,
    premium: false,
    personality: { open: 0.8, warm: 0.9, driven: 0.7, playful: 0.55, grounded: 0.85 },
    lastActive: "2026-05-06T03:42:00Z"
  },
  {
    id: "p_devon",
    name: "Devon",
    age: 31,
    pronouns: "he/they",
    orientation: "gay",
    city: "Hell's Kitchen",
    distanceKm: 12,
    intent: "open-to-anything",
    headline: "Pastry chef · Drag-show enthusiast · Collector of strange teas",
    bio: "I bake things and feed strangers. Take me to a karaoke bar and I'll give you my whole bit.",
    job: "Head pastry chef",
    school: "ICE",
    height_in: 70,
    weight_lb: 168,
    race: "Black",
    zodiac: "leo",
    languages: ["English", "French"],
    vibes: ["foodie", "musical", "artsy", "party"],
    interests: ["sourdough", "showtunes", "ferments", "neon"],
    prompts: [
      { q: "I geek out on", a: "Hydration ratios and Carly Rae lore." },
      { q: "Two truths and a lie", a: "I trained at École Lenôtre · I once dated a magician · I can sing the entire Hamilton score." },
      { q: "If I could re-live one night", a: "Front row, Robyn, MSG, 2024." }
    ],
    media: [
      { kind: "photo", url: stockPhoto("photo-1519085360753-af0119f7cbe7?dpr=2"), aiVerified: true },
      { kind: "photo", url: stockPhoto("photo-1521119989659-a83eee488004?dpr=2") }
    ],
    verified: true,
    premium: true,
    personality: { open: 0.9, warm: 0.95, driven: 0.7, playful: 0.95, grounded: 0.55 },
    lastActive: "2026-05-06T01:17:00Z"
  }
];

export const MOCK_MOMENTS: Moment[] = [
  {
    id: "m1",
    authorId: "p_aria",
    caption: "First firing of the season — natural ash glaze, a little wonky, very loved.",
    imageUrl: stockPhoto("photo-1493106641515-6b5631de4bb9?dpr=2"),
    createdAt: "2026-05-06T01:00:00Z",
    likes: 24
  },
  {
    id: "m2",
    authorId: "p_noor",
    caption: "Set list at Mood Ring tomorrow. Two new edits, one cursed mashup.",
    imageUrl: stockPhoto("photo-1485579149621-3123dd979885?dpr=2"),
    createdAt: "2026-05-05T20:11:00Z",
    likes: 47
  },
  {
    id: "m3",
    authorId: "p_devon",
    caption: "Strawberry yuzu galette. The crust is the love language.",
    imageUrl: stockPhoto("photo-1495147466023-ac5c588e2e94?dpr=2"),
    createdAt: "2026-05-05T15:42:00Z",
    likes: 89
  },
  {
    id: "m4",
    authorId: "p_kai",
    caption: "New patch — three oscillators chasing each other. Sleep optional.",
    imageUrl: stockPhoto("photo-1511671782779-c97d3d27a1d4?dpr=2"),
    createdAt: "2026-05-05T11:00:00Z",
    likes: 18
  }
];
