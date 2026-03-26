import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import {
  getAnimeDNA,
  getAnimeByVA,
  getAnimeByStaff,
  getAnimeByStudio,
  stripHtml,
  formatScore,
  type AnimeDNAData,
  type AniListCharacterEdge,
  type AniListStaffEdge,
} from "@/lib/anilist";
import { Loader2, ArrowLeft, Dna, Users, Mic, Palette, Film, Building2, Tag, Link2, ChevronDown, ChevronUp, Star, Sparkles } from "lucide-react";

// Connection strength
function connectionLabel(strength: number): { label: string; color: string } {
  if (strength >= 3) return { label: "Strong", color: "text-green-400 bg-green-500/20 border-green-500/30" };
  if (strength >= 2) return { label: "Medium", color: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30" };
  return { label: "Weak", color: "text-blue-400 bg-blue-500/20 border-blue-500/30" };
}

// VA expandable card
const VACard = ({ edge, currentAnimeId }: { edge: AniListCharacterEdge; currentAnimeId: number }) => {
  const [expanded, setExpanded] = useState(false);
  const [otherAnime, setOtherAnime] = useState<{ id: number; title: string; image: string; role: string; characterName: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const va = edge.voiceActors[0];
  if (!va) return null;

  const handleExpand = async () => {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (otherAnime.length > 0) return;
    setLoading(true);
    try {
      const data = await getAnimeByVA(va.id, 10);
      setOtherAnime(data.filter((a) => a.id !== currentAnimeId));
    } catch { setOtherAnime([]); }
    setLoading(false);
  };

  return (
    <div className="glass rounded-xl border border-border overflow-hidden animate-fade-in-up">
      <button onClick={handleExpand} className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary flex-shrink-0">
          <img src={va.image.medium} alt={va.name.full} className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{va.name.full}</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">as</span>
            <span className="text-xs text-primary">{edge.node.name.full}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold ${edge.role === "MAIN" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
              {edge.role}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <img src={edge.node.image.medium} alt="" className="w-8 h-8 rounded-lg object-cover" />
          {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground mt-2 mb-2">Also appears in:</p>
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-primary" /></div>
          ) : otherAnime.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No other anime found</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {otherAnime.map((a) => (
                <Link key={a.id} to={`/anime/${a.id}`} className="flex-shrink-0 w-20 group">
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-secondary">
                    <img src={a.image} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                  </div>
                  <p className="mt-1 text-[10px] text-foreground line-clamp-2 group-hover:text-primary transition-colors">{a.title}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Staff card
const StaffCard = ({ edge, currentAnimeId }: { edge: AniListStaffEdge; currentAnimeId: number }) => {
  const [expanded, setExpanded] = useState(false);
  const [works, setWorks] = useState<{ id: number; title: string; image: string; role: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleExpand = async () => {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (works.length > 0) return;
    setLoading(true);
    try {
      const data = await getAnimeByStaff(edge.node.id, 10);
      setWorks(data.filter((a) => a.id !== currentAnimeId));
    } catch { setWorks([]); }
    setLoading(false);
  };

  return (
    <div className="glass rounded-xl border border-border overflow-hidden animate-fade-in-up">
      <button onClick={handleExpand} className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary flex-shrink-0">
          <img src={edge.node.image.medium} alt={edge.node.name.full} className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{edge.node.name.full}</p>
          <p className="text-[10px] text-muted-foreground">{edge.role}</p>
        </div>
        {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground mt-2 mb-2">Other works:</p>
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-primary" /></div>
          ) : works.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No other works found</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {works.map((a) => (
                <Link key={a.id} to={`/anime/${a.id}`} className="flex-shrink-0 w-20 group">
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-secondary">
                    <img src={a.image} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                  </div>
                  <p className="mt-1 text-[10px] text-foreground line-clamp-2 group-hover:text-primary transition-colors">{a.title}</p>
                  <p className="text-[9px] text-muted-foreground line-clamp-1">{a.role}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AnimeDNAPage = () => {
  const { id } = useParams<{ id: string }>();
  const animeId = parseInt(id || "0", 10);
  const navigate = useNavigate();

  const [dna, setDna] = useState<AnimeDNAData | null>(null);
  const [studioAnime, setStudioAnime] = useState<{ id: number; title: string; image: string; score: number | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"cast" | "staff" | "connections">("cast");

  useEffect(() => {
    if (!animeId) return;
    setLoading(true);
    getAnimeDNA(animeId)
      .then((data) => {
        setDna(data);
        // Fetch studio anime
        const mainStudio = data.studios.nodes.find((s) => s.isAnimationStudio) || data.studios.nodes[0];
        if (mainStudio) {
          getAnimeByStudio(mainStudio.id, 12)
            .then((sa) => setStudioAnime(sa.filter((a) => a.id !== animeId)))
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [animeId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center pt-32 gap-3">
          <Dna size={32} className="text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Analyzing DNA...</p>
        </div>
      </div>
    );
  }

  if (!dna) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="text-center pt-32 text-muted-foreground">Anime not found</div>
      </div>
    );
  }

  const title = dna.title.english || dna.title.romaji;
  const mainStudio = dna.studios.nodes.find((s) => s.isAnimationStudio) || dna.studios.nodes[0];
  const mainCharacters = dna.characters.edges.filter((e) => e.role === "MAIN");
  const supportCharacters = dna.characters.edges.filter((e) => e.role === "SUPPORTING");
  const directors = dna.staff.edges.filter((e) => e.role.toLowerCase().includes("director"));
  const otherStaff = dna.staff.edges.filter((e) => !e.role.toLowerCase().includes("director"));

  // Connection stats
  const totalVAs = dna.characters.edges.filter((e) => e.voiceActors.length > 0).length;
  const totalStaff = dna.staff.edges.length;
  const totalRelations = dna.relations.edges.length;
  const connectionCount = totalVAs + totalStaff + totalRelations + dna.studios.nodes.length;

  // Tags grouped by category
  const tagsByCategory: Record<string, { name: string; rank: number }[]> = {};
  (dna.tags || []).forEach((t) => {
    if (!tagsByCategory[t.category]) tagsByCategory[t.category] = [];
    tagsByCategory[t.category].push({ name: t.name, rank: t.rank });
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <div className="relative w-full h-[35vh]">
        <img
          src={dna.bannerImage || dna.coverImage.extraLarge}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 -mt-28 relative z-10 pb-16">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-5 mb-8">
          <div className="w-36 sm:w-44 flex-shrink-0">
            <img src={dna.coverImage.extraLarge || dna.coverImage.large} alt={title} className="w-full rounded-xl shadow-2xl" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Dna size={20} className="text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">AnimeDNA</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">{title}</h1>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <div className="glass rounded-lg p-2.5 text-center border border-border">
                <p className="text-lg font-bold text-primary">{connectionCount}</p>
                <p className="text-[10px] text-muted-foreground">Connections</p>
              </div>
              <div className="glass rounded-lg p-2.5 text-center border border-border">
                <p className="text-lg font-bold text-foreground">{totalVAs}</p>
                <p className="text-[10px] text-muted-foreground">Voice Actors</p>
              </div>
              <div className="glass rounded-lg p-2.5 text-center border border-border">
                <p className="text-lg font-bold text-foreground">{totalStaff}</p>
                <p className="text-[10px] text-muted-foreground">Staff</p>
              </div>
              <div className="glass rounded-lg p-2.5 text-center border border-border">
                <p className="text-lg font-bold text-foreground">{dna.studios.nodes.length}</p>
                <p className="text-[10px] text-muted-foreground">Studios</p>
              </div>
            </div>

            {/* Studios */}
            <div className="flex flex-wrap gap-2 mb-3">
              {dna.studios.nodes.map((s) => (
                <span key={s.id} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg glass border border-border">
                  <Building2 size={12} className="text-primary" />
                  {s.name}
                  {s.isAnimationStudio && <span className="text-[9px] text-primary font-bold">MAIN</span>}
                </span>
              ))}
            </div>

            {/* Genres + Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {dna.genres.map((g) => (
                <Link key={g} to={`/search?q=${encodeURIComponent(g)}&genre=true`} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 hover:bg-primary/25 transition-colors">
                  {g}
                </Link>
              ))}
            </div>

            {/* Source + Format */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {dna.source && <span className="flex items-center gap-1"><Tag size={10} /> Source: {dna.source.replace(/_/g, " ")}</span>}
              {dna.format && <span className="flex items-center gap-1"><Film size={10} /> {dna.format}</span>}
              {dna.averageScore && <span className="flex items-center gap-1 text-yellow-400"><Star size={10} fill="currentColor" /> {formatScore(dna.averageScore)}</span>}
            </div>

            <Link to={`/anime/${animeId}`} className="inline-flex items-center gap-2 mt-3 text-xs text-primary hover:underline">
              <Film size={12} /> View anime page →
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 glass rounded-xl border border-border p-1">
          {([
            { key: "cast", label: "Cast & VAs", icon: Mic },
            { key: "staff", label: "Staff", icon: Palette },
            { key: "connections", label: "Connections", icon: Link2 },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Cast Tab */}
        {activeTab === "cast" && (
          <div className="space-y-6 animate-fade-in">
            {mainCharacters.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Sparkles size={14} className="text-primary" /> Main Cast
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mainCharacters.map((edge, i) => (
                    <VACard key={edge.node.id + "-" + i} edge={edge} currentAnimeId={animeId} />
                  ))}
                </div>
              </div>
            )}
            {supportCharacters.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Users size={14} className="text-muted-foreground" /> Supporting Cast
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {supportCharacters.map((edge, i) => (
                    <VACard key={edge.node.id + "-" + i} edge={edge} currentAnimeId={animeId} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Staff Tab */}
        {activeTab === "staff" && (
          <div className="space-y-6 animate-fade-in">
            {directors.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Film size={14} className="text-primary" /> Direction
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {directors.map((edge, i) => (
                    <StaffCard key={edge.node.id + "-" + i} edge={edge} currentAnimeId={animeId} />
                  ))}
                </div>
              </div>
            )}
            {otherStaff.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Palette size={14} className="text-muted-foreground" /> Production Staff
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {otherStaff.map((edge, i) => (
                    <StaffCard key={edge.node.id + "-" + i} edge={edge} currentAnimeId={animeId} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Connections Tab */}
        {activeTab === "connections" && (
          <div className="space-y-8 animate-fade-in">
            {/* Related anime */}
            {dna.relations.edges.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Link2 size={14} className="text-primary" /> Direct Relations
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {dna.relations.edges.map((rel) => {
                    const strength = rel.relationType === "SEQUEL" || rel.relationType === "PREQUEL" ? 3 : rel.relationType === "SIDE_STORY" || rel.relationType === "PARENT" ? 2 : 1;
                    const conn = connectionLabel(strength);
                    return (
                      <Link key={rel.node.id} to={`/anime/${rel.node.id}`} className="group animate-fade-in-up">
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-secondary">
                          <img src={rel.node.coverImage.large} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                          <div className="absolute top-1.5 left-1.5">
                            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${conn.color}`}>
                              {rel.relationType.replace(/_/g, " ")}
                            </span>
                          </div>
                          {rel.node.averageScore && (
                            <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 bg-background/80 backdrop-blur-sm rounded px-1 py-0.5 text-[10px] text-yellow-400">
                              <Star size={8} fill="currentColor" /> {formatScore(rel.node.averageScore)}
                            </div>
                          )}
                        </div>
                        <p className="mt-1.5 text-[10px] font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                          {rel.node.title.english || rel.node.title.romaji}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Same studio */}
            {studioAnime.length > 0 && mainStudio && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Building2 size={14} className="text-primary" /> More from {mainStudio.name}
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {studioAnime.slice(0, 12).map((a) => (
                    <Link key={a.id} to={`/anime/${a.id}`} className="group animate-fade-in-up">
                      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-secondary">
                        <img src={a.image} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        {a.score && (
                          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 bg-background/80 backdrop-blur-sm rounded px-1 py-0.5 text-[10px] text-yellow-400">
                            <Star size={8} fill="currentColor" /> {formatScore(a.score)}
                          </div>
                        )}
                      </div>
                      <p className="mt-1.5 text-[10px] font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">{a.title}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Tags / Themes */}
            {Object.keys(tagsByCategory).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Tag size={14} className="text-primary" /> Themes & Tags
                </h3>
                <div className="space-y-3">
                  {Object.entries(tagsByCategory).slice(0, 5).map(([category, tags]) => (
                    <div key={category}>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">{category}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {tags.sort((a, b) => b.rank - a.rank).slice(0, 8).map((t) => (
                          <span
                            key={t.name}
                            className="text-[10px] px-2 py-1 rounded-lg glass border border-border text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {t.name} <span className="text-primary font-bold">{t.rank}%</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimeDNAPage;
