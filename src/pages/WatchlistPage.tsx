import Navbar from "@/components/Navbar";
import { Heart } from "lucide-react";

const WatchlistPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8">
          My Watchlist
        </h1>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart className="text-muted-foreground mb-4" size={48} />
          <p className="text-muted-foreground mb-2">Your watchlist is empty</p>
          <p className="text-xs text-muted-foreground">
            Add anime to your list to keep track of what you want to watch.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WatchlistPage;
