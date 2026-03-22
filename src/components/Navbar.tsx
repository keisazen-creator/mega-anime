import { Link, useNavigate } from "react-router-dom";
import { Search, Menu, X, User, Heart, Settings } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery("");
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center animate-pulse-glow">
              <span className="font-display font-bold text-primary-foreground text-sm">O</span>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link to="/search" className="hover:text-foreground transition-colors">Browse</Link>
            <Link to="/seasonal" className="hover:text-foreground transition-colors">Seasonal</Link>
            <Link to="/watchlist" className="hover:text-foreground transition-colors">My List</Link>
          </div>

          <div className="flex items-center gap-2">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2 animate-fade-in">
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search anime..."
                  className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-40 sm:w-56"
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
                  <X size={18} />
                </button>
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors p-2">
                <Search size={20} />
              </button>
            )}

            <Link
              to="/watchlist"
              className="hidden md:flex text-muted-foreground hover:text-foreground transition-colors p-2"
            >
              <Heart size={18} />
            </Link>

            <Link
              to={user ? "/profile" : "/login"}
              className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors"
            >
              <User size={16} />
            </Link>

            <button
              className="md:hidden text-muted-foreground hover:text-foreground p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden glass border-t border-white/5 animate-fade-in">
          <div className="px-4 py-4 flex flex-col gap-3">
            {[
              { to: "/", label: "Home" },
              { to: "/search", label: "Browse" },
              { to: "/watchlist", label: "My List" },
              { to: "/settings", label: "Settings" },
              { to: user ? "/profile" : "/login", label: user ? "Profile" : "Sign In" },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
