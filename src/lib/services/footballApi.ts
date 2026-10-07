export interface FootballTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export interface StandingTableEntry {
  position: number;
  team: FootballTeam;
  playedGames: number;
  form: string;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface Match {
  id: number;
  utcDate: string;
  status: string;
  matchday: number;
  homeTeam: FootballTeam;
  awayTeam: FootballTeam;
  score: {
    winner: string | null;
    duration: string;
    fullTime: { home: number | null; away: number | null };
  };
}

const API_URL = "https://api.football-data.org/v4";

async function fetchFootballData<T>(endpoint: string): Promise<T> {
  const token = process.env.FOOTBALL_DATA_API_TOKEN;
  
  if (!token) {
    throw new Error("FOOTBALL_DATA_API_TOKEN is not configured.");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "X-Auth-Token": token,
    },
    // Cache for 60 seconds to avoid hitting rate limits
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Football API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getBrasileiraoStandings(): Promise<StandingTableEntry[]> {
  try {
    const data = await fetchFootballData<{ standings: { type: string; table: StandingTableEntry[] }[] }>("/competitions/BSA/standings");
    const totalStanding = data.standings.find(s => s.type === "TOTAL");
    return totalStanding ? totalStanding.table : [];
  } catch (error) {
    console.error("Failed to fetch Brasileirao standings:", error);
    return [];
  }
}

export async function getUpcomingMatches(limit: number = 5): Promise<Match[]> {
  try {
    const data = await fetchFootballData<{ matches: Match[] }>("/competitions/BSA/matches?status=SCHEDULED");
    return data.matches.slice(0, limit);
  } catch (error) {
    console.error("Failed to fetch upcoming matches:", error);
    return [];
  }
}

export async function getPastMatches(limit: number = 5): Promise<Match[]> {
  try {
    // Busca os últimos jogos finalizados
    const data = await fetchFootballData<{ matches: Match[] }>("/competitions/BSA/matches?status=FINISHED");
    // Ordena do mais recente para o mais antigo (reverse)
    const sortedMatches = data.matches.sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime());
    return sortedMatches.slice(0, limit);
  } catch (error) {
    console.error("Failed to fetch past matches:", error);
    return [];
  }
}

export interface Player {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  position: string;
  shirtNumber: number | null;
  lastUpdated: string;
}

export interface Scorer {
  player: Player;
  team: FootballTeam;
  playedMatches: number;
  goals: number;
  assists: number | null;
  penalties: number | null;
}

export async function getBrasileiraoScorers(limit: number = 10): Promise<Scorer[]> {
  try {
    const data = await fetchFootballData<{ scorers: Scorer[] }>(`/competitions/BSA/scorers?limit=${limit}`);
    return data.scorers;
  } catch (error) {
    console.error("Failed to fetch Brasileirao scorers:", error);
    return [];
  }
}
