export type ChampionLevel = "Level1" | "Level2" | "Level3" | "Level4" | "Level5";

interface ChampionInfo {
  title: string;
  minXp: number;
  globalInviteCap: number; 
}

export const championLevels: Record<ChampionLevel, ChampionInfo> = {
  Level1: { title: "Champion", minXp: 0, globalInviteCap: 0 },
  Level2: { title: "Skilled Champion", minXp: 100, globalInviteCap: 5 },
  Level3: { title: "Active Champion", minXp: 500, globalInviteCap: 7 },
  Level4: { title: "Champion Master", minXp: 700, globalInviteCap: 10 },
  Level5: { title: "Champion Grandmaster", minXp: 1000, globalInviteCap: 15 },
};

export function getChampionLevel(xp: number): ChampionLevel {
  const levels = Object.entries(championLevels) as [ChampionLevel, ChampionInfo][];
  return levels.reverse().find(([_, info]) => xp >= info.minXp)?.[0] ?? "Level1";
}

export function getNextLevelInfo(xp: number): { nextTitle: string | null; xpNeeded: number | null } {
  const level = getChampionLevel(xp);
  const levels = Object.values(championLevels);

  const current = levels.find(l => l.title === championLevels[level].title)!;
  const next = levels.find(l => l.minXp > current.minXp);

  if (!next) return { nextTitle: null, xpNeeded: null };
  return {
    nextTitle: next.title,
    xpNeeded: next.minXp - xp,
  };
}

export const deciXPtoXP = (deciXP: number | bigint): number => {
  return (Number(deciXP) / 10);
};

export function getMaxReferralsForLevel(level: ChampionLevel): number {
  return championLevels[level].globalInviteCap;
}

export function getChampionTitle(level: ChampionLevel): string {
  return championLevels[level].title;
}