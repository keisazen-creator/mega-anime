import { useState, useEffect } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { followUser, unfollowUser, isFollowing } from "@/lib/social";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface FollowButtonProps {
  targetUserId: string;
}

const FollowButton = ({ targetUserId }: FollowButtonProps) => {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.id !== targetUserId) {
      isFollowing(user.id, targetUserId).then(setFollowing);
    }
  }, [user, targetUserId]);

  if (!user || user.id === targetUserId) return null;

  const handleToggle = async () => {
    setLoading(true);
    if (following) {
      const { error } = await unfollowUser(user.id, targetUserId);
      if (!error) {
        setFollowing(false);
        toast.success("Unfollowed");
      }
    } else {
      const { error } = await followUser(user.id, targetUserId);
      if (!error) {
        setFollowing(true);
        toast.success("Following!");
      }
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.97] ${
        following
          ? "bg-secondary text-foreground border border-border hover:bg-muted"
          : "bg-primary text-primary-foreground hover:opacity-90"
      }`}
    >
      {following ? <UserCheck size={12} /> : <UserPlus size={12} />}
      {following ? "Following" : "Follow"}
    </button>
  );
};

export default FollowButton;
