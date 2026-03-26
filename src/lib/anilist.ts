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

async function queryAniList(query: string, variables: Record<string, unknown>, retries = 3): Promise<unknown> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(ANILIST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
      });
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("Retry-After") || "2", 10);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }
      if (!res.ok) {
        if (attempt < retries - 1) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        throw new Error(`AniList query failed: ${res.status}`);
      }
      const data = await res.json();
      if (data?.errors) {
        console.warn("AniList errors:", data.errors);
        if (data.data) return data.data;
        if (attempt < retries - 1) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        throw new Error("AniList returned errors");
      }
      return data?.data;
    } catch (err) {
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("AniList query failed after retries");
}

// Extended query for AnimeDNA - characters, staff, studios
export interface AniListCharacterEdge {
  role: string;
  node: { id: number; name: { full: string }; image: { medium: string } };
  voiceActors: { id: number; name: { full: string }; image: { medium: string }; languageV2: string }[];
}

export interface AniListStaffEdge {
  role: string;
  node: { id: number; name: { full: string }; image: { medium: string } };
}

export interface AniListStudioNode {
  id: number;
  name: string;
  isAnimationStudio: boolean;
}

export interface AnimeDNAData {
  id: number;
  title: { romaji: string; english: string | null };
  coverImage: { large: string; extraLarge: string };
  bannerImage: string | null;
  description: string | null;
  genres: string[];
  tags: { name: string; rank: number; category: string }[];
  averageScore: number | null;
  popularity: number | null;
  episodes: number | null;
  seasonYear: number | null;
  status: string | null;
  format: string | null;
  source: string | null;
  studios: { nodes: AniListStudioNode[] };
  characters: { edges: AniListCharacterEdge[] };
  staff: { edges: AniListStaffEdge[] };
  relations: { edges: { relationType: string; node: { id: number; title: { romaji: string; english: string | null }; coverImage: { large: string }; format: string | null; averageScore: number | null } }[] };
}

export async function getAnimeDNA(id: number): Promise<AnimeDNAData> {
  const data = (await queryAniList(
    `query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title { romaji english }
        coverImage { large extraLarge }
        bannerImage
        description(asHtml: false)
        genres
        tags { name rank category }
        averageScore
        popularity
        episodes
        seasonYear
        status
        format
        source
        studios { nodes { id name isAnimationStudio } }
        characters(sort: ROLE, perPage: 25) {
          edges {
            role
            node { id name { full } image { medium } }
            voiceActors(language: JAPANESE) { id name { full } image { medium } languageV2 }
          }
        }
        staff(perPage: 20) {
          edges {
            role
            node { id name { full } image { medium } }
          }
        }
        relations {
          edges {
            relationType
            node {
              id
              title { romaji english }
              coverImage { large }
              format
              averageScore
            }
          }
        }
      }
    }`,
    { id }
  )) as { Media: AnimeDNAData };
  return data.Media;
}

// Get other anime by a voice actor
export async function getAnimeByVA(vaId: number, perPage = 8): Promise<{ id: number; title: string; image: string; role: string; characterName: string }[]> {
  const data = (await queryAniList(
    `query ($id: Int, $perPage: Int) {
      Staff(id: $id) {
        characters(perPage: $perPage, sort: FAVOURITES_DESC) {
          edges {
            role
            node { name { full } }
            media { id title { english romaji } coverImage { large } }
          }
        }
      }
    }`,
    { id: vaId, perPage }
  )) as any;
  const edges = data?.Staff?.characters?.edges || [];
  return edges.flatMap((e: any) =>
    (e.media || []).map((m: any) => ({
      id: m.id,
      title: m.title.english || m.title.romaji,
      image: m.coverImage.large,
      role: e.role,
      characterName: e.node?.name?.full || "",
    }))
  ).slice(0, perPage);
}

// Get other anime by a staff member
export async function getAnimeByStaff(staffId: number, perPage = 8): Promise<{ id: number; title: string; image: string; role: string }[]> {
  const data = (await queryAniList(
    `query ($id: Int, $perPage: Int) {
      Staff(id: $id) {
        staffMedia(perPage: $perPage, sort: POPULARITY_DESC, type: ANIME) {
          edges {
            staffRole
            node { id title { english romaji } coverImage { large } }
          }
        }
      }
    }`,
    { id: staffId, perPage }
  )) as any;
  const edges = data?.Staff?.staffMedia?.edges || [];
  return edges.map((e: any) => ({
    id: e.node.id,
    title: e.node.title.english || e.node.title.romaji,
    image: e.node.coverImage.large,
    role: e.staffRole || "",
  }));
}

// Get anime by studio
export async function getAnimeByStudio(studioId: number, perPage = 12): Promise<{ id: number; title: string; image: string; score: number | null }[]> {
  const data = (await queryAniList(
    `query ($id: Int, $perPage: Int) {
      Studio(id: $id) {
        media(perPage: $perPage, sort: POPULARITY_DESC, isMain: true) {
          nodes { id title { english romaji } coverImage { large } averageScore }
        }
      }
    }`,
    { id: studioId, perPage }
  )) as any;
  const nodes = data?.Studio?.media?.nodes || [];
  return nodes.map((n: any) => ({
    id: n.id,
    title: n.title.english || n.title.romaji,
    image: n.coverImage.large,
    score: n.averageScore,
  }));
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

export interface AdvancedSearchParams {
  query?: string;
  genres?: string[];
  year?: number;
  season?: "WINTER" | "SPRING" | "SUMMER" | "FALL";
  status?: "FINISHED" | "RELEASING" | "NOT_YET_RELEASED" | "CANCELLED";
  format?: "TV" | "TV_SHORT" | "MOVIE" | "SPECIAL" | "OVA" | "ONA" | "MUSIC";
  sort?: string;
  minScore?: number;
  perPage?: number;
  page?: number;
}

export async function advancedSearch(params: AdvancedSearchParams): Promise<AniListMedia[]> {
  const {
    query, genres, year, season, status, format,
    sort = "POPULARITY_DESC", minScore, perPage = 30, page = 1
  } = params;

  const variables: Record<string, unknown> = { page, perPage, sort: [sort] };
  const varDefs: string[] = ["$page: Int", "$perPage: Int", "$sort: [MediaSort]"];
  const filters: string[] = ["type: ANIME", "isAdult: false", "sort: $sort"];

  if (query) { variables.search = query; varDefs.push("$search: String"); filters.push("search: $search"); }
  if (genres && genres.length) { variables.genres = genres; varDefs.push("$genres: [String]"); filters.push("genre_in: $genres"); }
  if (year) { variables.year = year; varDefs.push("$year: Int"); filters.push("seasonYear: $year"); }
  if (season) { variables.season = season; varDefs.push("$season: MediaSeason"); filters.push("season: $season"); }
  if (status) { variables.status = status; varDefs.push("$status: MediaStatus"); filters.push("status: $status"); }
  if (format) { variables.format = format; varDefs.push("$format: MediaFormat"); filters.push("format: $format"); }
  if (minScore) { variables.minScore = minScore; varDefs.push("$minScore: Int"); filters.push("averageScore_greater: $minScore"); }

  const gql = `query (${varDefs.join(", ")}) {
    Page(page: $page, perPage: $perPage) {
      media(${filters.join(", ")}) { ${MEDIA_FIELDS} }
    }
  }`;

  const data = (await queryAniList(gql, variables)) as { Page: { media: AniListMedia[] } };
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

export async function getRelatedSeasons(animeId: number): Promise<{ id: number; title: string; relationType: string; format: string | null; status: string | null; coverImage: string; seasonYear: number | null }[]> {
  const data = (await queryAniList(
    `query ($id: Int) {
      Media(id: $id, type: ANIME) {
        relations {
          edges {
            relationType
            node {
              id
              title { english romaji }
              format
              status
              seasonYear
              coverImage { large }
            }
          }
        }
      }
    }`,
    { id: animeId }
  )) as any;
  
  const edges = data?.Media?.relations?.edges || [];
  return edges
    .filter((e: any) => ["SEQUEL", "PREQUEL", "PARENT", "SIDE_STORY", "ALTERNATIVE"].includes(e.relationType) && e.node)
    .map((e: any) => ({
      id: e.node.id,
      title: e.node.title.english || e.node.title.romaji,
      relationType: e.relationType,
      format: e.node.format,
      status: e.node.status,
      coverImage: e.node.coverImage.large,
      seasonYear: e.node.seasonYear,
    }));
}

// Smart recommendations based on user's favorite genres
export async function getSmartRecommendations(genres: string[], excludeIds: number[] = [], perPage = 20): Promise<AniListMedia[]> {
  if (genres.length === 0) return [];
  const topGenres = genres.slice(0, 3);
  const data = (await queryAniList(
    `query ($genres: [String], $perPage: Int) {
      Page(perPage: $perPage) {
        media(type: ANIME, genre_in: $genres, sort: SCORE_DESC, isAdult: false, averageScore_greater: 70) { ${MEDIA_FIELDS} }
      }
    }`,
    { genres: topGenres, perPage: perPage + excludeIds.length }
  )) as { Page: { media: AniListMedia[] } };
  return data.Page.media.filter((m) => !excludeIds.includes(m.id)).slice(0, perPage);
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
