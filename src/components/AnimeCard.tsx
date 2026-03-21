import { Link } from "react-router-dom";
import { Play } from "lucide-react";

interface AnimeCardProps {
  title: string;
  image: string;
  id?: number;
  delay?: number;
}

const AnimeCard = ({ title, image, delay = 0 }: AnimeCardProps) => {
  return (
    <Link
      to={`/anime/${encodeURIComponent(title)}`}
      className="group relative flex-shrink-0 w-[140px] sm:w-[160px] lg:w-[180px] animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-secondary">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center glow-accent-sm">
            <Play size={18} fill="currentColor" className="text-primary-foreground ml-0.5" />
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs sm:text-sm text-foreground font-medium line-clamp-2 group-hover:text-primary transition-colors">
        {title}
      </p>
    </Link>
  );
};

export default AnimeCard;
