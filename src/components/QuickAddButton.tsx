import { useState, useEffect } from "react";
import { Plus, Check, BookmarkPlus, Eye, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from "@/lib/watchlist";
import { logActivity } from "@/lib/social";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AniListMedia } from "@/lib/anilist";

interface QuickAddButtonProps {
  anime: {
    id: number;
    title: { romaji: string; english: string | null };
    coverImage: { large: string };
    genres: string[];
    averageScore: number | null;
    seasonYear: number | null;
  };
}

const STATUS_OPTIONS = [
  { value: "watching", label: "Watching", icon: Eye },
  { value: "plan_to_watch", label: "Plan to Watch", icon: BookmarkPlus },
  { value: "completed", label: "Completed", icon: CheckCircle },
];

const QuickAddButton = ({ anime }: QuickAddButtonProps) => {
  const { user } = useAuth();
  const [inList, setInList] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (user) {
      isInWatchlist(user.id, anime.id).then(setInList);
    }
  }, [user, anime.id]);

  const handleAdd = async (status: string) => {
    if (!user) {
      toast.error("Sign in to add to watchlist");
      setShowMenu(false);
      return;
    }

    if (inList) {
      const { error } = await removeFromWatchlist(user.id, anime.id);
      if (!error) {
        setInList(false);
        toast.success("Removed from watchlist");
      }
    } else {
      const { error } = await addToWatchlist(user.id, anime as AniListMedia);
      if (!error) {
        // Update status
        await supabase
          .from("favorites")
          .update({ watch_status: status })
          .eq("user_id", user.id)
          .eq("anime_id", anime.id);
        setInList(true);
        const label = STATUS_OPTIONS.find((s) => s.value === status)?.label || status;
        toast.success(`Added as "${label}"`);
        logActivity(user.id, `added_${status}`, anime.id, anime.title.english || anime.title.romaji, anime.coverImage.large);
      }
    }
    setShowMenu(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inList) {
      handleAdd("plan_to_watch"); // toggles remove
    } else {
      setShowMenu((v) => !v);
    }
  };

  const handleMenuClick = (e: React.MouseEvent, status: string) => {
    e.preventDefault();
    e.stopPropagation();
    handleAdd(status);
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
          inList
            ? "bg-primary text-primary-foreground"
            : "bg-background/60 text-foreground opacity-0 group-hover:opacity-100 hover:bg-primary/80"
        }`}
      >
        {inList ? <Check size={12} /> : <Plus size={12} />}
      </button>

      {showMenu && (
        <div
          className="absolute right-0 top-8 z-50 w-36 rounded-lg bg-background border border-border shadow-xl py-1 animate-fade-in-up"
          onMouseLeave={() => setShowMenu(false)}
        >
          {STATUS_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={(e) => handleMenuClick(e, opt.value)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors"
              >
                <Icon size={12} className="text-primary" />
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuickAddButton;
