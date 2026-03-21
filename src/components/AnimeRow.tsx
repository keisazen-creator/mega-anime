import { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AnimeCard from "./AnimeCard";
import type { AniListMedia } from "@/lib/anilist";

interface AnimeRowProps {
  title: string;
  emoji?: string;
  items: AniListMedia[];
  loading?: boolean;
  viewAllLink?: string;
}

const AnimeRow = ({ title, emoji, items, loading, viewAllLink }: AnimeRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="py-5">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
            {emoji && <span>{emoji}</span>}
            {title}
          </h2>
          <div className="flex items-center gap-2">
            {viewAllLink && (
              <Link
                to={viewAllLink}
                className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                View All →
              </Link>
            )}
            <button onClick={() => scroll("left")} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => scroll("right")} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[140px] sm:w-[160px] lg:w-[175px]">
                  <div className="aspect-[2/3] rounded-xl bg-secondary animate-pulse" />
                  <div className="mt-2 h-3 w-3/4 bg-secondary rounded animate-pulse" />
                </div>
              ))
            : items.map((item, i) => (
                <AnimeCard
                  key={item.id}
                  id={item.id}
                  title={item.title.english || item.title.romaji}
                  image={item.coverImage.large}
                  score={item.averageScore}
                  genres={item.genres}
                  year={item.seasonYear}
                  delay={i * 50}
                />
              ))}
        </div>
      </div>
    </section>
  );
};

export default AnimeRow;
