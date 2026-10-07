export async function fetchSportmonks(endpoint: string, includes?: string) {
  const token = process.env.SPORTMONKS_API_TOKEN;
  if (!token) {
    console.error("SPORTMONKS_API_TOKEN is not defined");
    return null;
  }

  const separator = endpoint.includes("?") ? "&" : "?";
  let url = `https://api.sportmonks.com/v3/football/${endpoint}${separator}api_token=${token}`;
  
  if (includes) {
    url += `&include=${includes}`;
  }

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: {
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      console.error(`Sportmonks API error: ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    return data.data; // Sportmonks v3 wraps response in 'data'
  } catch (error) {
    console.error("Error fetching from Sportmonks:", error);
    return null;
  }
}

// 71 is Campeonato Brasileiro Série A in Sportmonks (often, but let's query upcoming fixtures broadly for a league or just generic)
// Since we don't have the exact league ID, let's fetch fixtures between dates, or just for the current date.
// A common endpoint for fixtures is fixtures/date/{date} or fixtures/between/{start}/{end}
export async function getUpcomingFixtures() {
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  const start = today.toISOString().split("T")[0];
  const end = nextWeek.toISOString().split("T")[0];

  // includes: participants (for teams)
  const data = await fetchSportmonks(`fixtures/between/${start}/${end}`, "participants");
  
  if (!data) return [];
  return data.slice(0, 10);
}

export async function getRecentResults() {
  const today = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(today.getDate() - 7);

  const end = today.toISOString().split("T")[0];
  const start = lastWeek.toISOString().split("T")[0];

  const data = await fetchSportmonks(`fixtures/between/${start}/${end}`, "participants,scores");
  
  if (!data) return [];
  // Filter finished matches or just return the latest
  return data.slice(0, 10);
}

export async function getTeamSquad(identifier: string | number) {
  // includes: squad.player
  if (typeof identifier === "string") {
    const data = await fetchSportmonks(`teams/search/${identifier}`, "squad.player.statistics.season,squad.player.statistics.details");
    return data && data.length > 0 ? data[0] : null;
  }
  const data = await fetchSportmonks(`teams/${identifier}`, "squad.player.statistics.season,squad.player.statistics.details");
  return data;
}

export async function getPlayerStats(identifier: string | number) {
  if (typeof identifier === "string") {
    const data = await fetchSportmonks(`players/search/${identifier}`, "statistics.season,statistics.details");
    return data && data.length > 0 ? data[0] : null;
  }
  const data = await fetchSportmonks(`players/${identifier}`, "statistics.season,statistics.details");
  return data;
}
