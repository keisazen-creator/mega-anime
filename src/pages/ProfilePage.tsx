import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Mail, Camera, Loader2, Settings } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null }>({
    display_name: null,
    avatar_url: null,
  });
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile(data as any);
          setDisplayName((data as any).display_name || "");
        }
      });
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = data.publicUrl + `?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("user_id", user.id);
    setProfile((p) => ({ ...p, avatar_url: avatarUrl }));
    toast.success("Avatar updated!");
    setUploading(false);
  };

  const handleNameSave = async () => {
    if (!user || !displayName.trim()) return;
    await supabase.from("profiles").update({ display_name: displayName.trim() }).eq("user_id", user.id);
    setProfile((p) => ({ ...p, display_name: displayName.trim() }));
    toast.success("Name updated!");
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
          {/* Avatar */}
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-2xl font-bold text-primary">
                  {user.email?.[0]?.toUpperCase() || "U"}
                </span>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-80 transition-opacity active:scale-95"
            >
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          <h1 className="font-display text-lg font-bold text-foreground text-center mb-1">Profile</h1>

          {/* Display name */}
          <div className="mb-4">
            <label className="text-xs text-muted-foreground mb-1 block">Display Name</label>
            <div className="flex gap-2">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={handleNameSave}
                className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium active:scale-[0.97]"
              >
                Save
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground mb-6">
            <Mail size={14} />
            {user.email}
          </div>

          <div className="space-y-2">
            <Link
              to="/settings"
              className="w-full py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2 active:scale-[0.97]"
            >
              <Settings size={14} />
              Settings
            </Link>

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
    </div>
  );
};

export default ProfilePage;
