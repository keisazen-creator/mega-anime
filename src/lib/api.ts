const KOGEMI_URL = "https://kogemi-api-3.onrender.com";

export interface StreamResult {
  primary: string;
  backup: string;
}

export interface ImdbResult {
  imdb: string;
  tmdb: number;
  type?: string;
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

// Use our edge function for anime-specific IMDB lookup (filters by animation genre)
export async function getImdbId(title: string): Promise<ImdbResult> {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const url = projectId
    ? `https://${projectId}.supabase.co/functions/v1/anime-imdb?title=${encodeURIComponent(title)}`
    : `${KOGEMI_URL}/imdb?title=${encodeURIComponent(title)}`;
  
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error("IMDB fetch failed");
  return res.json();
}

export async function getStreamLinks(imdbId: string, season = 1, episode = 1): Promise<StreamResult> {
  const res = await fetchWithTimeout(
    `${KOGEMI_URL}/stream?imdb=${encodeURIComponent(imdbId)}&season=${season}&ep=${episode}`
  );
  if (!res.ok) throw new Error("Stream fetch failed");
  return res.json();
}
