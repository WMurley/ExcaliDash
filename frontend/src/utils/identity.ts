export interface UserIdentity {
  id: string;
  name: string;
  initials: string;
  color: string;
}

const TRANSFORMERS = [
  { name: "Optimus Prime", initials: "OP" },
  { name: "Megatron", initials: "ME" },
  { name: "Starscream", initials: "ST" },
  { name: "Bumblebee", initials: "BB" },
  { name: "Ultra Magnus", initials: "UM" },
  { name: "Shockwave", initials: "SH" },
  { name: "Soundwave", initials: "SW" },
  { name: "Ironhide", initials: "IR" },
  { name: "Ratchet", initials: "RA" },
  { name: "Prowl", initials: "PR" },
  { name: "Jazz", initials: "JA" },
  { name: "Hot Rod", initials: "HR" },
  { name: "Alpha Trion", initials: "AT" },
  { name: "Wheeljack", initials: "WH" },
  { name: "Sideswipe", initials: "SI" },
  { name: "Sunstreaker", initials: "SU" },
  { name: "Inferno", initials: "IN" },
  { name: "Grapple", initials: "GR" },
  { name: "Blaster", initials: "BL" },
  { name: "Perceptor", initials: "PE" },
  { name: "Trailbreaker", initials: "TR" },
  { name: "Cosmos", initials: "CO" },
  { name: "Warpath", initials: "WA" },
  { name: "Powerglide", initials: "PO" },
  { name: "Arcee", initials: "AR" },
  { name: "Springer", initials: "SP" },
  { name: "Kup", initials: "KU" },
  { name: "Blurr", initials: "BU" },
  { name: "Grimlock", initials: "GL" },
  { name: "Swoop", initials: "WO" },
  { name: "Skywarp", initials: "SK" },
  { name: "Thundercracker", initials: "TH" },
  { name: "Ramjet", initials: "AM" },
  { name: "Cyclonus", initials: "CY" },
  { name: "Scourge", initials: "SC" },
  { name: "Galvatron", initials: "GA" },
  { name: "Astrotrain", initials: "AS" },
  { name: "Blitzwing", initials: "BZ" },
  { name: "Rumble", initials: "RU" },
  { name: "Frenzy", initials: "FR" },
  { name: "Laserbeak", initials: "LA" },
  { name: "Ravage", initials: "RV" },
  { name: "Unicron", initials: "UN" },
  { name: "Devastator", initials: "DE" },
  { name: "Menasor", initials: "MN" },
  { name: "Bruticus", initials: "BR" },
  { name: "Motormaster", initials: "MO" },
  { name: "Scrapper", initials: "CR" },
  { name: "Mixmaster", initials: "MA" },
  { name: "Bonecrusher", initials: "BO" },
  { name: "Hook", initials: "HO" },
  { name: "Vortex", initials: "VO" },
  { name: "Swindle", initials: "WI" },
];

const COLORS = [
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#f59e0b", // amber-500
  "#84cc16", // lime-500
  "#22c55e", // green-500
  "#10b981", // emerald-500
  "#14b8a6", // teal-500
  "#06b6d4", // cyan-500
  "#0ea5e9", // sky-500
  "#3b82f6", // blue-500
  "#6366f1", // indigo-500
  "#8b5cf6", // violet-500
  "#a855f7", // purple-500
  "#d946ef", // fuchsia-500
  "#ec4899", // pink-500
  "#f43f5e", // rose-500
];

export const getUserIdentity = (): UserIdentity => {
  const stored = localStorage.getItem("excalidash-user-id");
  if (stored) {
    return JSON.parse(stored);
  }

  const randomTransformer =
    TRANSFORMERS[Math.floor(Math.random() * TRANSFORMERS.length)];
  const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];

  const identity: UserIdentity = {
    id: crypto.randomUUID(),
    name: randomTransformer.name,
    initials: randomTransformer.initials,
    color: randomColor,
  };

  localStorage.setItem("excalidash-user-id", JSON.stringify(identity));
  return identity;
};
