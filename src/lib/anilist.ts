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

// Helper to strip HTML from AniList descriptions
export function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

// Format score from 0-100 to X.X
export function formatScore(score: number | null): string {
  if (!score) return "N/A";
  return (score / 10).toFixed(1);
}
