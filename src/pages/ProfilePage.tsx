import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Mail } from "lucide-react";
import { toast } from "sonner";

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 max-w-md mx-auto px-4">
        <div className="glass rounded-2xl p-6 border border-white/5 animate-fade-in-up">
          <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto mb-4">
            <span className="font-display text-2xl font-bold text-primary">
              {user.email?.[0]?.toUpperCase() || "U"}
            </span>
          </div>

          <h1 className="font-display text-lg font-bold text-foreground text-center mb-1">Profile</h1>

          <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground mb-6">
            <Mail size={14} />
            {user.email}
          </div>

          <button
            onClick={handleSignOut}
            className="w-full py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2 active:scale-[0.97]"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
