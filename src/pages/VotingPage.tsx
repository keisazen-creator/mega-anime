import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Trophy, Vote, Crown, Timer, CheckCircle2, Loader2, Sparkles } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
  category_type: string;
  year: number;
}

interface Nominee {
  id: string;
  category_id: string;
  anime_id: number | null;
  anime_title: string;
  anime_image: string | null;
  character_name: string | null;
  vote_count: number;
}

interface UserVote {
  category_id: string;
  nominee_id: string;
}

const VotingPage = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);

  const now = new Date();
  const votingDay = new Date(now.getFullYear(), 4, 5); // May 5
  const isVotingOpen = now.getMonth() === 4 && now.getDate() === 5; // May is month 4 (0-indexed)
  const isBeforeVoting = now < votingDay;
  const daysUntil = isBeforeVoting ? Math.ceil((votingDay.getTime() - now.getTime()) / 86400000) : 0;

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    // Realtime subscription for live vote counts
    const channel = supabase
      .channel("voting-live")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "voting_nominees" }, (payload) => {
        setNominees((prev) =>
          prev.map((n) => (n.id === payload.new.id ? { ...n, vote_count: payload.new.vote_count } : n))
        );
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [catRes, nomRes] = await Promise.all([
      supabase.from("voting_categories").select("*").order("created_at"),
      supabase.from("voting_nominees").select("*").order("vote_count", { ascending: false }),
    ]);

    if (catRes.data) setCategories(catRes.data as Category[]);
    if (nomRes.data) setNominees(nomRes.data as Nominee[]);

    if (user) {
      const { data: votes } = await supabase
        .from("user_votes")
        .select("category_id, nominee_id")
        .eq("user_id", user.id);
      if (votes) setUserVotes(votes as UserVote[]);
    }
    setLoading(false);
  };

  const handleVote = async (categoryId: string, nomineeId: string) => {
    if (!user) { toast.error("Sign in to vote"); return; }
    if (!isVotingOpen) { toast.error("Voting opens on May 5th!"); return; }

    setVoting(nomineeId);
    const { error } = await supabase.rpc("cast_vote", {
      p_user_id: user.id,
      p_category_id: categoryId,
      p_nominee_id: nomineeId,
    });

    if (error) {
      toast.error("Failed to cast vote");
    } else {
      toast.success("Vote cast! 🎉");
      setUserVotes((prev) => {
        const filtered = prev.filter((v) => v.category_id !== categoryId);
        return [...filtered, { category_id: categoryId, nominee_id: nomineeId }];
      });
      // Reload nominees for updated counts
      const { data } = await supabase.from("voting_nominees").select("*").order("vote_count", { ascending: false });
      if (data) setNominees(data as Nominee[]);
    }
    setVoting(null);
  };

  const getUserVote = (categoryId: string) => userVotes.find((v) => v.category_id === categoryId)?.nominee_id;

  const getCategoryNominees = (categoryId: string) => {
    const catNominees = nominees.filter((n) => n.category_id === categoryId);
    const totalVotes = catNominees.reduce((acc, n) => acc + n.vote_count, 0);
    return catNominees.map((n) => ({ ...n, percentage: totalVotes > 0 ? (n.vote_count / totalVotes) * 100 : 0 }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16 max-w-[1000px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-4">
            <Trophy size={14} /> Annual Anime Awards
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
            🏆 OtakuCloud Awards 2026
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            The annual global anime voting event. Vote for your favorites across categories!
          </p>

          {/* Countdown / Status */}
          <div className="mt-6 inline-flex items-center gap-3 px-6 py-3 rounded-xl glass border border-border">
            {isVotingOpen ? (
              <>
                <Sparkles size={18} className="text-green-400 animate-pulse" />
                <span className="text-sm font-semibold text-green-400">Voting is LIVE! 🎉</span>
              </>
            ) : isBeforeVoting ? (
              <>
                <Timer size={18} className="text-primary" />
                <span className="text-sm text-foreground">
                  Voting opens in <span className="font-bold text-primary">{daysUntil} days</span> (May 5th)
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 size={18} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Voting has ended. See results below!</span>
              </>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-8">
          {categories.map((cat, catIdx) => {
            const catNominees = getCategoryNominees(cat.id);
            const userVote = getUserVote(cat.id);
            const maxVotes = Math.max(...catNominees.map((n) => n.vote_count), 1);

            return (
              <section
                key={cat.id}
                className="glass rounded-2xl border border-border overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${catIdx * 100}ms` }}
              >
                <div className="px-5 py-4 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Crown size={16} className="text-primary" />
                    <h2 className="font-display text-base font-bold text-foreground">{cat.name}</h2>
                  </div>
                  {cat.description && (
                    <p className="text-xs text-muted-foreground mt-1">{cat.description}</p>
                  )}
                </div>

                <div className="divide-y divide-border">
                  {catNominees.map((nom, i) => {
                    const isLeader = i === 0 && nom.vote_count > 0;
                    const isUserVote = userVote === nom.id;

                    return (
                      <div
                        key={nom.id}
                        className={`flex items-center gap-3 px-5 py-3 transition-colors relative ${
                          isUserVote ? "bg-primary/5" : "hover:bg-muted/30"
                        }`}
                      >
                        {/* Rank */}
                        <span className={`w-6 text-center text-xs font-bold ${
                          isLeader ? "text-yellow-400" : "text-muted-foreground"
                        }`}>
                          {isLeader ? "👑" : `#${i + 1}`}
                        </span>

                        {/* Image */}
                        {nom.anime_image && (
                          <img
                            src={nom.anime_image}
                            alt=""
                            className="w-10 h-14 rounded-lg object-cover flex-shrink-0"
                          />
                        )}

                        {/* Info + bar */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {nom.character_name || nom.anime_title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                  isLeader ? "bg-gradient-to-r from-yellow-500 to-amber-400" : "bg-primary/60"
                                }`}
                                style={{ width: `${nom.percentage}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium w-12 text-right">
                              {nom.vote_count} votes
                            </span>
                          </div>
                        </div>

                        {/* Vote button */}
                        <button
                          onClick={() => handleVote(cat.id, nom.id)}
                          disabled={voting === nom.id || (!isVotingOpen && isBeforeVoting)}
                          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                            isUserVote
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary border border-border text-foreground hover:bg-muted"
                          } disabled:opacity-50`}
                        >
                          {voting === nom.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : isUserVote ? (
                            <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Voted</span>
                          ) : (
                            <span className="flex items-center gap-1"><Vote size={12} /> Vote</span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Info footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            🗓 Voting happens every year on <span className="text-primary font-semibold">May 5th (05.05)</span>
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            Results are live and update in real-time. One vote per category.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VotingPage;
