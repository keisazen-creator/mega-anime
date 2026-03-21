import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSlider from "@/components/HeroSlider";
import AnimeRow from "@/components/AnimeRow";
import { searchAnime, type AnimeSearchResult } from "@/lib/api";

const sections = [
  { title: "Trending Now", query: "popular" },
  { title: "Action & Adventure", query: "action" },
  { title: "Top Rated", query: "top rated anime" },
  { title: "Fantasy Worlds", query: "fantasy" },
  { title: "Romance", query: "romance anime" },
];

const Index = () => {
  const [data, setData] = useState<Record<string, AnimeSearchResult[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    sections.forEach(({ title, query }) => {
      setLoading((p) => ({ ...p, [title]: true }));
      searchAnime(query)
        .then((results) => setData((p) => ({ ...p, [title]: results })))
        .catch(() => setData((p) => ({ ...p, [title]: [] })))
        .finally(() => setLoading((p) => ({ ...p, [title]: false })));
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSlider />
      <div className="relative z-10 -mt-16">
        {sections.map((section) => (
          <AnimeRow
            key={section.title}
            title={section.title}
            items={data[section.title] || []}
            loading={loading[section.title]}
          />
        ))}
      </div>
      <footer className="py-12 text-center text-xs text-muted-foreground">
        OtakuCloud © {new Date().getFullYear()} — Powered by Kogemi API
      </footer>
    </div>
  );
};

export default Index;
