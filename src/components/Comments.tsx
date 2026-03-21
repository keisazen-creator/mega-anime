import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle, Send, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  user_id: string;
  anime_id: number;
  content: string;
  created_at: string;
  profiles?: { display_name: string | null; avatar_url: string | null } | null;
}

const Comments = ({ animeId }: { animeId: number }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles(display_name, avatar_url)")
      .eq("anime_id", animeId)
      .order("created_at", { ascending: false })
      .limit(50);
    setComments((data as Comment[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [animeId]);

  const handlePost = async () => {
    if (!user) {
      toast.error("Sign in to comment");
      return;
    }
    if (!text.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("comments").insert({
      user_id: user.id,
      anime_id: animeId,
      content: text.trim(),
    });
    if (error) {
      toast.error("Failed to post comment");
    } else {
      setText("");
      fetchComments();
    }
    setPosting(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("comments").delete().eq("id", id);
    setComments((prev) => prev.filter((c) => c.id !== id));
    toast.success("Comment deleted");
  };

  return (
    <section className="mt-10">
      <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <MessageCircle size={20} />
        Comments ({comments.length})
      </h2>

      {/* Post box */}
      <div className="glass rounded-xl p-4 mb-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? "Share your thoughts..." : "Sign in to comment"}
          disabled={!user}
          rows={2}
          className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handlePost();
            }
          }}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handlePost}
            disabled={!text.trim() || posting || !user}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40 active:scale-[0.97] transition-all"
          >
            {posting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            Post
          </button>
        </div>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-muted-foreground" size={20} />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-3">
          {comments.map((c, i) => {
            const profile = c.profiles;
            const initial = profile?.display_name?.[0]?.toUpperCase() || "U";
            return (
              <div
                key={c.id}
                className="glass rounded-xl p-3 animate-fade-in-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-primary">{initial}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-foreground">
                        {profile?.display_name || "Anonymous"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{c.content}</p>
                  </div>
                  {user?.id === c.user_id && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1 flex-shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default Comments;
