// AniList GraphQL API integration

const ANILIST_URL = "https://graphql.anilist.co";

export interface AniListMedia {
  id: number;
  title: { romaji: string; english: string | null };
  coverImage: { large: string; extraLarge: string };
  bannerImage: string | null;
  description: string | null;
  genres: string[];
  averageScore: number | null;
  episodes: number | null;
  duration: number | null;
  seasonYear: number | null;
  status: string | null;
  studios: { nodes: { name: string }[] } | null;
  format: string | null;
  nextAiringEpisode: { episode: number } | null;
}

const MEDIA_FIELDS = `
  id
  title { romaji english }
  coverImage { large extraLarge }
  bannerImage
  description(asHtml: false)
  genres
  averageScore
  episodes
  duration
  seasonYear
  status
  studios(isMain: true) { nodes { name } }
  format
  nextAiringEpisode { episode }
`;

async function queryAniList(query: string, variables: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error("AniList query failed");
  const data = await res.json();
  return data?.data;
}

export async function getTrending(page = 1, perPage = 20): Promise<AniListMedia[]> {
  const data = (await queryAniList(
    `query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: TRENDING_DESC, isAdult: false) { ${MEDIA_FIELDS} }
      }
    }`,
    { page, perPage }
  )) as { Page: { media: AniListMedia[] } };
  return data.Page.media;
}

export async function getPopular(page = 1, perPage = 20): Promise<AniListMedia[]> {
  const data = (await queryAniList(
    `query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) { ${MEDIA_FIELDS} }
      }
    }`,
    { page, perPage }
  )) as { Page: { media: AniListMedia[] } };
  return data.Page.media;
}

export async function getTopRated(page = 1, perPage = 20): Promise<AniListMedia[]> {
  const data = (await queryAniList(
    `query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: SCORE_DESC, isAdult: false) { ${MEDIA_FIELDS} }
      }
    }`,
    { page, perPage }
  )) as { Page: { media: AniListMedia[] } };
  return data.Page.media;
}

export async function getNewReleases(page = 1, perPage = 20): Promise<AniListMedia[]> {
  const currentYear = new Date().getFullYear();
  const data = (await queryAniList(
    `query ($page: Int, $perPage: Int, $year: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: START_DATE_DESC, seasonYear: $year, isAdult: false) { ${MEDIA_FIELDS} }
      }
    }`,
    { page, perPage, year: currentYear }
  )) as { Page: { media: AniListMedia[] } };
  return data.Page.media;
}

export async function searchAniList(query: string, perPage = 20): Promise<AniListMedia[]> {
  const data = (await queryAniList(
    `query ($search: String, $perPage: Int) {
      Page(perPage: $perPage) {
        media(search: $search, type: ANIME, isAdult: false) { ${MEDIA_FIELDS} }
      }
    }`,
    { search: query, perPage }
  )) as { Page: { media: AniListMedia[] } };
  return data.Page.media;
}

export async function getAnimeById(id: number): Promise<AniListMedia> {
  const data = (await queryAniList(
    `query ($id: Int) {
      Media(id: $id, type: ANIME) { ${MEDIA_FIELDS} }
    }`,
    { id }
  )) as { Media: AniListMedia };
  return data.Media;
}

export async function getByGenre(genre: string, perPage = 20): Promise<AniListMedia[]> {
  const data = (await queryAniList(
    `query ($genre: String, $perPage: Int) {
      Page(perPage: $perPage) {
        media(type: ANIME, genre: $genre, sort: POPULARITY_DESC, isAdult: false) { ${MEDIA_FIELDS} }
      }
    }`,
    { genre, perPage }
  )) as { Page: { media: AniListMedia[] } };
  return data.Page.media;
}

// Get recommendations for an anime by its genres
export async function getRecommendations(genres: string[], excludeId: number, perPage = 12): Promise<AniListMedia[]> {
  // Use the first genre for recommendations
  const genre = genres[0];
  if (!genre) return [];
  const data = (await queryAniList(
    `query ($genre: String, $perPage: Int) {
      Page(perPage: $perPage) {
        media(type: ANIME, genre: $genre, sort: POPULARITY_DESC, isAdult: false) { ${MEDIA_FIELDS} }
      }
    }`,
    { genre, perPage: perPage + 1 }
  )) as { Page: { media: AniListMedia[] } };
  return data.Page.media.filter((m) => m.id !== excludeId).slice(0, perPage);
}

// Extended media fields with airing schedule
export interface AniListMediaExtended extends AniListMedia {
  nextAiringEpisode: { episode: number; airingAt: number; timeUntilAiring: number } | null;
  season: string | null;
}

const MEDIA_FIELDS_EXT = `
  ${MEDIA_FIELDS}
  season
  nextAiringEpisode { episode airingAt timeUntilAiring }
`;

// Seasonal anime
export async function getSeasonalAnime(
  season: "WINTER" | "SPRING" | "SUMMER" | "FALL",
  year: number,
  page = 1,
  perPage = 20
): Promise<AniListMedia[]> {
  const data = (await queryAniList(
    `query ($season: MediaSeason, $year: Int, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, season: $season, seasonYear: $year, sort: POPULARITY_DESC, isAdult: false) { ${MEDIA_FIELDS} }
      }
    }`,
    { season, year, page, perPage }
  )) as { Page: { media: AniListMedia[] } };
  return data.Page.media;
}

// Random anime
export async function getRandomAnime(): Promise<AniListMedia> {
  const randomPage = Math.floor(Math.random() * 100) + 1;
  const data = (await queryAniList(
    `query ($page: Int) {
      Page(page: $page, perPage: 1) {
        media(type: ANIME, sort: POPULARITY_DESC, isAdult: false, averageScore_greater: 60) { ${MEDIA_FIELDS} }
      }
    }`,
    { page: randomPage }
  )) as { Page: { media: AniListMedia[] } };
  return data.Page.media[0];
}

// Airing schedule (currently airing anime)
export async function getAiringSchedule(perPage = 12): Promise<AniListMedia[]> {
  const data = (await queryAniList(
    `query ($perPage: Int) {
      Page(perPage: $perPage) {
        media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC, isAdult: false) {
          ${MEDIA_FIELDS}
          nextAiringEpisode { episode airingAt timeUntilAiring }
        }
      }
    }`,
    { perPage }
  )) as { Page: { media: AniListMedia[] } };
  return data.Page.media;
}

export function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

export function formatScore(score: number | null): string {
  if (!score) return "N/A";
  return (score / 10).toFixed(1);
}

export function getCurrentSeason(): { season: "WINTER" | "SPRING" | "SUMMER" | "FALL"; year: number } {
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  if (month <= 3) return { season: "WINTER", year };
  if (month <= 6) return { season: "SPRING", year };
  if (month <= 9) return { season: "SUMMER", year };
  return { season: "FALL", year };
}
