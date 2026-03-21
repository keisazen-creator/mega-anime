import { Link } from "react-router-dom";

const moods = [
  { emoji: "😂", label: "Feel Good", genre: "Comedy" },
  { emoji: "💔", label: "Cry Session", genre: "Drama" },
  { emoji: "⚔️", label: "Adrenaline Rush", genre: "Action" },
  { emoji: "🔮", label: "Mind Bending", genre: "Psychological" },
  { emoji: "💕", label: "Romantic Vibes", genre: "Romance" },
  { emoji: "👻", label: "Get Spooked", genre: "Horror" },
];

const MoodPicker = () => (
  <section className="py-8">
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="font-display text-base sm:text-lg font-semibold text-foreground mb-4">
        🎯 What's Your Mood?
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
        {moods.map((mood, i) => (
          <Link
            key={mood.genre}
            to={`/search?q=${encodeURIComponent(mood.genre)}&genre=true`}
            className="glass glass-hover rounded-xl p-3 sm:p-4 text-center group animate-fade-in-up active:scale-[0.97] transition-all"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="text-2xl sm:text-3xl mb-1 group-hover:scale-110 transition-transform">
              {mood.emoji}
            </div>
            <p className="text-[10px] sm:text-xs font-medium text-foreground">{mood.label}</p>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default MoodPicker;
