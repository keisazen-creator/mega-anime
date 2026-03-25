import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { getWatchlist, removeFromWatchlist } from "@/lib/watchlist";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Loader2, Star, Trash2, Eye, BookmarkPlus, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface FavoriteItem {
  id: string;
  anime_id: number;
  anime_title: string;
  anime_image: string | null;
  anime_genres: string[] | null;
  anime_rating: number | null;
  anime_year: number | null;
  watch_status: string;
}

const TABS = [
  { value: "all", label: "All", icon: Heart },
  { value: "watching", label: "Watching", icon: Eye },
  { value: "plan_to_watch", label: "Plan to Watch", icon: BookmarkPlus },
  { value: "completed", label: "Completed", icon: CheckCircle },
];

const WatchlistPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    getWatchlist(user.id)
      .then(({ data }) => setItems((data as FavoriteItem[]) || []))
      .finally(() => setLoading(false));
  }, [user]);

  const handleRemove = async (animeId: number) => {
    if (!user) return;
    const { error } = await removeFromWatchlist(user.id, animeId);
    if (!error) {
      setItems((prev) => prev.filter((i) => i.anime_id !== animeId));
      toast.success("Removed from watchlist");
    }
  };

  const handleStatusChange = async (animeId: number, status: string) => {
    if (!user) return;
    await supabase
      .from("favorites")
      .update({ watch_status: status })
      .eq("user_id", user.id)
      .eq("anime_id", animeId);
    setItems((prev) =>
      prev.map((i) => (i.anime_id === animeId ? { ...i, watch_status: status } : i))
    );
    toast.success("Status updated");
  };

  const filtered = tab === "all" ? items : items.filter((i) => i.watch_status === tab);
  const counts = {
    all: items.length,
    watching: items.filter((i) => i.watch_status === "watching").length,
    plan_to_watch: items.filter((i) => i.watch_status === "plan_to_watch").length,
    completed: items.filter((i) => i.watch_status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-4">My Watchlist</h1>

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
        ) : (
          <>
            {/* Status Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
              {TABS.map((t) => {
                const Icon = t.icon;
                const count = counts[t.value as keyof typeof counts];
                return (
                  <button
                    key={t.value}
                    onClick={() => setTab(t.value)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      tab === t.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon size={12} />
                    {t.label}
                    <span className="ml-1 opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Heart className="text-muted-foreground mb-4" size={48} />
                <p className="text-muted-foreground mb-1">No anime in this category</p>
                <p className="text-xs text-muted-foreground">Browse anime and add them to your list.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filtered.map((item, i) => (
                  <div
                    key={item.id}
                    className="group animate-fade-in-up relative"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <Link to={`/anime/${item.anime_id}`}>
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
                        {/* Remove button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemove(item.anime_id);
                          }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/70 flex items-center justify-center text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all z-10"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                      <p className="mt-2 text-xs sm:text-sm text-foreground font-medium line-clamp-2 group-hover:text-primary transition-colors">{item.anime_title}</p>
                    </Link>

                    {/* Status selector */}
                    <div className="flex gap-1 mt-1.5">
                      {[
                        { v: "watching", icon: Eye, tip: "Watching" },
                        { v: "plan_to_watch", icon: BookmarkPlus, tip: "Plan to Watch" },
                        { v: "completed", icon: CheckCircle, tip: "Completed" },
                      ].map((s) => {
                        const SIcon = s.icon;
                        return (
                          <button
                            key={s.v}
                            onClick={() => handleStatusChange(item.anime_id, s.v)}
                            title={s.tip}
                            className={`p-1 rounded-md transition-all ${
                              item.watch_status === s.v
                                ? "bg-primary/20 text-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                            }`}
                          >
                            <SIcon size={12} />
                          </button>
                        );
                      })}
                    </div>

                    {(item.anime_genres || item.anime_year) && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                        {item.anime_genres?.slice(0, 2).join(" • ")}{item.anime_genres && item.anime_year ? " • " : ""}{item.anime_year || ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WatchlistPage;
