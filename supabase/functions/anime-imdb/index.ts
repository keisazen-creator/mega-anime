import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TMDB_KEY = "fdc7143eae0ef3d73d0484e1fb87056c";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const title = url.searchParams.get("title");
    
    if (!title) {
      return new Response(JSON.stringify({ error: "Missing title" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clean the title for better matching
    const cleanTitle = title.split(":")[0].replace(/season \d+/i, "").trim();

    // Strategy 1: Search TMDB TV with animation genre filter (genre_id 16 = Animation)
    const tvAnimRes = await fetch(
      `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_KEY}&query=${encodeURIComponent(cleanTitle)}`
    );
    const tvAnimData = await tvAnimRes.json();
    
    // Filter for animation genre (16) and prefer Japanese origin
    const animationResults = (tvAnimData.results || []).filter((r: any) => 
      r.genre_ids?.includes(16)
    );

    // Try to find best anime match from animation results
    let best = animationResults.find((r: any) =>
      r.name?.toLowerCase().includes(cleanTitle.toLowerCase()) ||
      r.original_name?.toLowerCase().includes(cleanTitle.toLowerCase())
    ) || animationResults[0];

    // Strategy 2: If no animation result, try searching as movie (for anime films)
    if (!best) {
      const movieRes = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(cleanTitle)}`
      );
      const movieData = await movieRes.json();
      const animMovies = (movieData.results || []).filter((r: any) =>
        r.genre_ids?.includes(16)
      );
      best = animMovies[0];
      
      if (best) {
        // Get movie external IDs
        const detailRes = await fetch(
          `https://api.themoviedb.org/3/movie/${best.id}?api_key=${TMDB_KEY}&append_to_response=external_ids`
        );
        const detailData = await detailRes.json();
        const imdb = detailData?.external_ids?.imdb_id;
        
        if (imdb) {
          return new Response(JSON.stringify({ imdb, tmdb: best.id, type: "movie" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    if (!best) {
      // Strategy 3: Fall back to any TV result but warn
      best = tvAnimData.results?.[0];
    }

    if (!best) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get TV external IDs
    const detailRes = await fetch(
      `https://api.themoviedb.org/3/tv/${best.id}?api_key=${TMDB_KEY}&append_to_response=external_ids`
    );
    const detailData = await detailRes.json();
    const imdb = detailData?.external_ids?.imdb_id;

    if (!imdb) {
      return new Response(JSON.stringify({ error: "No IMDB ID found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ imdb, tmdb: best.id, type: "tv" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
