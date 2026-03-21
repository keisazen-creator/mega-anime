import { useState, useEffect } from "react";
import { Play, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import heroBanner1 from "@/assets/hero-banner-1.jpg";
import heroBanner2 from "@/assets/hero-banner-2.jpg";
import heroBanner3 from "@/assets/hero-banner-3.jpg";

const slides = [
  {
    image: heroBanner1,
    title: "Attack on Titan",
    description: "Humanity fights for survival against giant humanoid creatures in a post-apocalyptic world surrounded by enormous walls.",
    rating: "9.0",
    year: "2013",
    searchTitle: "Attack on Titan",
  },
  {
    image: heroBanner2,
    title: "Demon Slayer",
    description: "A young boy becomes a demon slayer after his family is slaughtered and his sister is turned into a demon.",
    rating: "8.7",
    year: "2019",
    searchTitle: "Demon Slayer",
  },
  {
    image: heroBanner3,
    title: "Neon Genesis Evangelion",
    description: "Teenagers pilot giant mechs to fight mysterious beings called Angels threatening to end humanity.",
    rating: "8.5",
    year: "1995",
    searchTitle: "Neon Genesis Evangelion",
  },
];

const HeroSlider = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const slide = slides[current];

  return (
    <div className="relative w-full h-[70vh] sm:h-[80vh] overflow-hidden">
      {/* Background */}
      {slides.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <img
            src={s.image}
            alt={s.title}
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12 lg:p-16 max-w-[1400px] mx-auto">
        <div className="max-w-xl" key={current}>
          <div className="flex items-center gap-3 mb-3 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
              ★ {slide.rating}
            </span>
            <span className="text-xs text-muted-foreground">{slide.year}</span>
          </div>

          <h1
            className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-3 animate-fade-in-up leading-[1.1]"
            style={{ animationDelay: "80ms" }}
          >
            {slide.title}
          </h1>

          <p
            className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md animate-fade-in-up line-clamp-3"
            style={{ animationDelay: "160ms" }}
          >
            {slide.description}
          </p>

          <div
            className="flex items-center gap-3 animate-fade-in-up"
            style={{ animationDelay: "240ms" }}
          >
            <Link
              to={`/anime/${encodeURIComponent(slide.searchTitle)}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-accent text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity active:scale-[0.97]"
            >
              <Play size={16} fill="currentColor" />
              Watch Now
            </Link>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg glass glass-hover text-foreground font-medium text-sm active:scale-[0.97]">
              <Plus size={16} />
              My List
            </button>
          </div>
        </div>

        {/* Dots */}
        <div className="flex items-center gap-2 mt-8">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === current ? "w-8 bg-primary" : "w-4 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroSlider;
