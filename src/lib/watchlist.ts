import { supabase } from "@/integrations/supabase/client";
import type { AniListMedia } from "@/lib/anilist";

export async function addToWatchlist(userId: string, anime: AniListMedia) {
  const { error } = await supabase.from("favorites").upsert({
    user_id: userId,
    anime_id: anime.id,
    anime_title: anime.title.english || anime.title.romaji,
    anime_image: anime.coverImage.large,
    anime_genres: anime.genres,
    anime_rating: anime.averageScore ? anime.averageScore / 10 : null,
    anime_year: anime.seasonYear,
  }, { onConflict: "user_id,anime_id" });
  return { error };
}

export async function removeFromWatchlist(userId: string, animeId: number) {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("anime_id", animeId);
  return { error };
}

export async function getWatchlist(userId: string) {
  const { data, error } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function isInWatchlist(userId: string, animeId: number) {
  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("anime_id", animeId)
    .maybeSingle();
  return !!data;
}

// Continue Watching - localStorage based
export interface ContinueWatchingItem {
  animeId: number;
  animeTitle: string;
  animeImage: string;
  episode: number;
  imdbId: string;
  timestamp: number;
}

const CW_KEY = "otaku_continue_watching";

export function getContinueWatching(): ContinueWatchingItem[] {
  try {
    const raw = localStorage.getItem(CW_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveContinueWatching(item: ContinueWatchingItem) {
  const list = getContinueWatching().filter((i) => i.animeId !== item.animeId);
  list.unshift({ ...item, timestamp: Date.now() });
  localStorage.setItem(CW_KEY, JSON.stringify(list.slice(0, 20)));
}

export function removeContinueWatching(animeId: number) {
  const list = getContinueWatching().filter((i) => i.animeId !== animeId);
  localStorage.setItem(CW_KEY, JSON.stringify(list));
}
