import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";

const genres = [
  { name: "Action", color: "from-red-600/20 to-red-900/10" },
  { name: "Adventure", color: "from-amber-600/20 to-amber-900/10" },
  { name: "Fantasy", color: "from-purple-600/20 to-purple-900/10" },
  { name: "Romance", color: "from-pink-600/20 to-pink-900/10" },
  { name: "Comedy", color: "from-yellow-600/20 to-yellow-900/10" },
  { name: "Horror", color: "from-gray-600/20 to-gray-900/10" },
  { name: "Sci-Fi", color: "from-cyan-600/20 to-cyan-900/10" },
  { name: "Slice of Life", color: "from-green-600/20 to-green-900/10" },
  { name: "Isekai", color: "from-indigo-600/20 to-indigo-900/10" },
  { name: "Mecha", color: "from-orange-600/20 to-orange-900/10" },
  { name: "Sports", color: "from-emerald-600/20 to-emerald-900/10" },
  { name: "Thriller", color: "from-rose-600/20 to-rose-900/10" },
];

const GenresPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8">
          Genres
        </h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {genres.map((genre, i) => (
            <Link
              key={genre.name}
              to={`/search?q=${encodeURIComponent(genre.name + " anime")}`}
              className="group relative rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-all duration-300 active:scale-[0.97] animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={`bg-gradient-to-br ${genre.color} p-6 sm:p-8`}>
                <span className="font-display font-semibold text-foreground text-lg group-hover:text-primary transition-colors">
                  {genre.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GenresPage;
