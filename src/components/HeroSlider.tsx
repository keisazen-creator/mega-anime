import { useState, useEffect, useCallback } from "react";
import { Play, Plus, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { type AniListMedia, stripHtml, formatScore } from "@/lib/anilist";

interface HeroSliderProps {
  items: AniListMedia[];
}

const HeroSlider = ({ items }: HeroSliderProps) => {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((p) => (p + 1) % items.length), [items.length]);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + items.length) % items.length), [items.length]);

  useEffect(() => {
    if (items.length === 0) return;
    const interval = setInterval(next, 7000);
    return () => clearInterval(interval);
  }, [next, items.length]);

  if (items.length === 0) return null;
  const slide = items[current];
  const banner = slide.bannerImage || slide.coverImage.extraLarge;

  return (
    <div className="relative w-full h-[75vh] sm:h-[80vh] overflow-hidden">
      {/* Background images */}
      {items.map((item, i) => (
        <div
          key={item.id}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <img
            src={item.bannerImage || item.coverImage.extraLarge}
            alt={item.title.english || item.title.romaji}
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-transparent" />

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background/60 flex items-center justify-center text-foreground hover:bg-background/80 transition-colors active:scale-95"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background/60 flex items-center justify-center text-foreground hover:bg-background/80 transition-colors active:scale-95"
      >
        <ChevronRight size={20} />
      </button>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-8 pt-20">
        <div className="max-w-[1400px] mx-auto" key={slide.id}>
          {/* Meta line */}
          <div className="flex items-center gap-3 mb-2 animate-fade-in-up text-xs text-muted-foreground" style={{ animationDelay: "0ms" }}>
            <span className="flex items-center gap-1 text-yellow-400 font-semibold">
              ★ {formatScore(slide.averageScore)}
            </span>
            {slide.seasonYear && <span>{slide.seasonYear}</span>}
            {slide.episodes && <span>{slide.episodes} eps</span>}
            {slide.duration && <span>{slide.duration} min</span>}
          </div>

          {/* Title */}
          <h1
            className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 animate-fade-in-up leading-[1.1]"
            style={{ animationDelay: "80ms" }}
          >
            {slide.title.english || slide.title.romaji}
          </h1>

          {/* Genres */}
          <div className="flex flex-wrap gap-2 mb-3 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
            {slide.genres.slice(0, 4).map((g) => (
              <span key={g} className="text-xs px-2.5 py-0.5 rounded-full border border-primary/40 text-primary">
                {g}
              </span>
            ))}
          </div>

          {/* Description */}
          <p
            className="text-sm text-muted-foreground mb-5 max-w-lg animate-fade-in-up line-clamp-3"
            style={{ animationDelay: "160ms" }}
          >
            {stripHtml(slide.description)}
          </p>

          {/* Buttons */}
          <div className="flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: "220ms" }}>
            <Link
              to={`/anime/${slide.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-accent text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity active:scale-[0.97]"
            >
              <Play size={16} fill="currentColor" />
              Watch Now
            </Link>
            <Link
              to={`/anime/${slide.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg glass border border-white/10 text-foreground font-medium text-sm hover:bg-white/10 transition-colors active:scale-[0.97]"
            >
              <Plus size={16} />
              My List
            </Link>
            <Link
              to={`/anime/${slide.id}`}
              className="w-9 h-9 rounded-full glass border border-white/10 flex items-center justify-center text-foreground hover:bg-white/10 transition-colors active:scale-95"
            >
              <Info size={16} />
            </Link>
          </div>

          {/* Dots */}
          <div className="flex items-center gap-1.5 mt-6">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === current ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSlider;
