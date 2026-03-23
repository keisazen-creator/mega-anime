import { useState, useEffect, useCallback } from "react";
import { Bell, X, Clock, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { getContinueWatching } from "@/lib/watchlist";
import { getAiringSchedule, type AniListMedia } from "@/lib/anilist";

interface Notification {
  id: string;
  animeId: number;
  title: string;
  image: string;
  message: string;
  timestamp: number;
  read: boolean;
}

const NOTIF_KEY = "otaku_notifications";
const NOTIF_CHECK_KEY = "otaku_notif_last_check";

function getStoredNotifications(): Notification[] {
  try {
    return JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]");
  } catch { return []; }
}

function storeNotifications(notifs: Notification[]) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs.slice(0, 50)));
}

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>(getStoredNotifications());
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const checkForNewEpisodes = useCallback(async () => {
    const lastCheck = parseInt(localStorage.getItem(NOTIF_CHECK_KEY) || "0");
    const now = Date.now();
    // Only check every 30 minutes
    if (now - lastCheck < 30 * 60 * 1000) return;
    localStorage.setItem(NOTIF_CHECK_KEY, String(now));

    try {
      const watching = getContinueWatching();
      if (watching.length === 0) return;

      const watchingIds = new Set(watching.map((w) => w.animeId));
      const airing = await getAiringSchedule(50);

      const existing = getStoredNotifications();
      const existingIds = new Set(existing.map((n) => n.id));
      const newNotifs: Notification[] = [];

      airing.forEach((anime: AniListMedia) => {
        if (!watchingIds.has(anime.id)) return;
        const nae = anime.nextAiringEpisode as any;
        if (!nae) return;

        const notifId = `${anime.id}-ep${nae.episode}`;
        if (existingIds.has(notifId)) return;

        // Only notify if airing within next 24h
        if (nae.timeUntilAiring > 86400) return;

        const hours = Math.floor(nae.timeUntilAiring / 3600);
        const mins = Math.floor((nae.timeUntilAiring % 3600) / 60);
        const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

        newNotifs.push({
          id: notifId,
          animeId: anime.id,
          title: anime.title.english || anime.title.romaji,
          image: anime.coverImage.large,
          message: `Episode ${nae.episode} airing in ${timeStr}`,
          timestamp: now,
          read: false,
        });
      });

      if (newNotifs.length > 0) {
        const all = [...newNotifs, ...existing];
        storeNotifications(all);
        setNotifications(all);
      }
    } catch { /* silent fail */ }
  }, []);

  useEffect(() => {
    checkForNewEpisodes();
    const interval = setInterval(checkForNewEpisodes, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkForNewEpisodes]);

  const markAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    storeNotifications(updated);
    setNotifications(updated);
  };

  const removeNotif = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    storeNotifications(updated);
    setNotifications(updated);
  };

  const clearAll = () => {
    storeNotifications([]);
    setNotifications([]);
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) markAllRead(); }}
        className="relative text-muted-foreground hover:text-foreground transition-colors p-2"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 max-h-96 glass rounded-xl border border-border z-50 overflow-hidden animate-fade-in shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold text-foreground">Notifications</span>
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-[10px] text-muted-foreground hover:text-destructive transition-colors">
                  Clear all
                </button>
              )}
            </div>
            <div className="overflow-y-auto max-h-72">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell size={24} className="mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground">No notifications yet</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    Watch anime to get episode alerts!
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group border-b border-border/50 last:border-0">
                    <Link to={`/anime/${n.animeId}`} onClick={() => setOpen(false)} className="w-10 h-14 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                      <img src={n.image} alt="" className="w-full h-full object-cover" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/anime/${n.animeId}`} onClick={() => setOpen(false)} className="text-xs font-medium text-foreground line-clamp-1 hover:text-primary transition-colors">
                        {n.title}
                      </Link>
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock size={8} /> {n.message}
                      </p>
                    </div>
                    <button
                      onClick={() => removeNotif(n.id)}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all p-1"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
