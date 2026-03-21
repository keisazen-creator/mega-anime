import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { getWatchlist } from "@/lib/watchlist";
import { Heart, Loader2, Star } from "lucide-react";

interface FavoriteItem {
  id: string;
  anime_id: number;
  anime_title: string;
  anime_image: string | null;
  anime_genres: string[] | null;
  anime_rating: number | null;
  anime_year: number | null;
}

const WatchlistPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    getWatchlist(user.id)
      .then(({ data }) => setItems((data as FavoriteItem[]) || []))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-6">My Watchlist</h1>

        {!user ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Heart className="text-muted-foreground mb-4" size={48} />
            <p className="text-muted-foreground mb-3">Sign in to save your watchlist</p>
            <Link to="/login" className="px-5 py-2 rounded-lg bg-gradient-accent text-primary-foreground text-sm font-medium">
              Sign In
            </Link>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Heart className="text-muted-foreground mb-4" size={48} />
            <p className="text-muted-foreground mb-1">Your watchlist is empty</p>
            <p className="text-xs text-muted-foreground">Browse anime and add them to your list.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
            {items.map((item, i) => (
              <Link
                key={item.id}
                to={`/anime/${item.anime_id}`}
                className="group animate-fade-in-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-secondary">
                  {item.anime_image && (
                    <img src={item.anime_image} alt={item.anime_title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  )}
                  {item.anime_rating && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-xs font-semibold text-yellow-400">
                      <Star size={10} fill="currentColor" />
                      {item.anime_rating.toFixed(1)}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs sm:text-sm text-foreground font-medium line-clamp-2 group-hover:text-primary transition-colors">{item.anime_title}</p>
                {(item.anime_genres || item.anime_year) && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                    {item.anime_genres?.slice(0, 2).join(" • ")}{item.anime_genres && item.anime_year ? " • " : ""}{item.anime_year || ""}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchlistPage;
