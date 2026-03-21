const BASE_URL = "https://kogemi-api-3.onrender.com";

export interface AnimeSearchResult {
  id: number;
  title: { romaji: string; english: string | null };
  coverImage: { large: string };
}

export interface AnimeInfo {
  title: string;
  episodes: number;
  status: string;
  year: number;
}

export interface ImdbResult {
  imdb: string;
  tmdb: number;
}

export interface StreamResult {
  primary: string;
  backup: string;
}

async function fetchWithTimeout(url: string, timeout = 15000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

export async function searchAnime(query: string): Promise<AnimeSearchResult[]> {
  const res = await fetchWithTimeout(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export async function getAnimeInfo(title: string): Promise<AnimeInfo> {
  const res = await fetchWithTimeout(`${BASE_URL}/anime-info?title=${encodeURIComponent(title)}`);
  if (!res.ok) throw new Error("Info fetch failed");
  return res.json();
}

export async function getImdbId(title: string): Promise<ImdbResult> {
  const res = await fetchWithTimeout(`${BASE_URL}/imdb?title=${encodeURIComponent(title)}`);
  if (!res.ok) throw new Error("IMDB fetch failed");
  return res.json();
}

export async function getStreamLinks(imdbId: string, season = 1, episode = 1): Promise<StreamResult> {
  const res = await fetchWithTimeout(
    `${BASE_URL}/stream?imdb=${encodeURIComponent(imdbId)}&season=${season}&ep=${episode}`
  );
  if (!res.ok) throw new Error("Stream fetch failed");
  return res.json();
}
