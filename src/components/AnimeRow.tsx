import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AnimeCard from "./AnimeCard";
import type { AnimeSearchResult } from "@/lib/api";

interface AnimeRowProps {
  title: string;
  items: AnimeSearchResult[];
  loading?: boolean;
}

const AnimeRow = ({ title, items, loading }: AnimeRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-6">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground">
            {title}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => scroll("left")}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2"
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[140px] sm:w-[160px] lg:w-[180px]"
                >
                  <div className="aspect-[2/3] rounded-lg bg-secondary animate-pulse" />
                  <div className="mt-2 h-3 w-3/4 bg-secondary rounded animate-pulse" />
                </div>
              ))
            : items.map((item, i) => (
                <AnimeCard
                  key={item.id}
                  title={item.title.english || item.title.romaji}
                  image={item.coverImage.large}
                  id={item.id}
                  delay={i * 60}
                />
              ))}
        </div>
      </div>
    </section>
  );
};

export default AnimeRow;
