import { useState, useMemo } from "react";
import { Search, ChevronDown, ExternalLink, Loader2, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Site, ScrapedData } from "@/types/site";
import sitesData from "@/data/sites.json";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RawSite {
  CATEGORIES?: string;
  NAME?: string;
  URL?: string;
  Column1?: string;
  "Nom de la Source / Média"?: string;
  "Lien Officiel (URL)"?: string;
}

interface SiteSelectorProps {
  onScraped: (data: ScrapedData) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

// Normalize the raw data to a consistent format
const normalizeSites = (rawData: RawSite[]): Site[] => {
  return rawData.map((item) => {
    // Handle the first format (CATEGORIES, NAME, URL)
    if (item.CATEGORIES && item.NAME && item.URL) {
      return {
        CATEGORIES: item.CATEGORIES.trim(),
        NAME: item.NAME,
        URL: item.URL,
      };
    }
    // Handle the second format (Column1, Nom de la Source / Média, Lien Officiel (URL))
    if (item.Column1 && item["Nom de la Source / Média"] && item["Lien Officiel (URL)"]) {
      return {
        CATEGORIES: item.Column1.trim(),
        NAME: item["Nom de la Source / Média"],
        URL: item["Lien Officiel (URL)"],
      };
    }
    // Fallback
    return {
      CATEGORIES: "Autre",
      NAME: item.NAME || item["Nom de la Source / Média"] || "Unknown",
      URL: item.URL || item["Lien Officiel (URL)"] || "",
    };
  }).filter(site => site.URL && site.URL.length > 0);
};

export const SiteSelector = ({ onScraped, isLoading, setIsLoading }: SiteSelectorProps) => {
  const [search, setSearch] = useState("");
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(["Sport"]));

  const sites = useMemo(() => normalizeSites(sitesData as RawSite[]), []);

  // Group sites by category
  const sitesByCategory = useMemo(() => {
    const grouped: Record<string, Site[]> = {};
    sites.forEach((site) => {
      const category = site.CATEGORIES;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(site);
    });
    return grouped;
  }, [sites]);

  // Filter sites by search
  const filteredSitesByCategory = useMemo(() => {
    if (!search.trim()) return sitesByCategory;

    const searchLower = search.toLowerCase();
    const filtered: Record<string, Site[]> = {};

    Object.entries(sitesByCategory).forEach(([category, categorySites]) => {
      const matchedSites = categorySites.filter(
        (site) =>
          site.NAME.toLowerCase().includes(searchLower) ||
          site.URL.toLowerCase().includes(searchLower) ||
          category.toLowerCase().includes(searchLower)
      );
      if (matchedSites.length > 0) {
        filtered[category] = matchedSites;
      }
    });

    return filtered;
  }, [sitesByCategory, search]);

  const categories = Object.keys(filteredSitesByCategory).sort();

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleScrape = async (site: Site) => {
    // Clean URL if needed
    let url = site.URL.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    // Remove any trailing notes in parentheses
    url = url.split(" ")[0].split("(")[0].trim();

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("scrape", {
        body: { url },
      });

      if (error) {
        console.error("Scrape error:", error);
        toast.error("Erreur lors du scraping");
        return;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      onScraped({
        ...data,
        siteName: site.NAME,
      });
      toast.success(`"${site.NAME}" scrapé avec succès!`);
    } catch (error) {
      console.error("Scrape error:", error);
      toast.error("Erreur lors du scraping");
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (category: string): string => {
    const cat = category.toLowerCase();
    if (cat.includes("droit")) return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    if (cat.includes("sport")) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (cat.includes("federation")) return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    if (cat.includes("general")) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    if (cat.includes("agent")) return "bg-rose-500/20 text-rose-400 border-rose-500/30";
    if (cat.includes("media") || cat.includes("presse")) return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
    return "bg-secondary text-secondary-foreground border-border";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-border/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un site..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary/50 border-border/50 focus:border-primary/50"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {sites.length} sites • {Object.keys(sitesByCategory).length} catégories
        </p>
      </div>

      {/* Categories */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {categories.map((category) => (
            <Collapsible
              key={category}
              open={openCategories.has(category)}
              onOpenChange={() => toggleCategory(category)}
            >
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors group">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-medium", getCategoryColor(category))}
                    >
                      {category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ({filteredSitesByCategory[category].length})
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      openCategories.has(category) && "rotate-180"
                    )}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pl-2 pr-1 pb-2 space-y-1">
                  {filteredSitesByCategory[category].map((site, index) => (
                    <div
                      key={`${site.URL}-${index}`}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/30 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-md bg-secondary/50 flex items-center justify-center flex-shrink-0">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {site.NAME}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {site.URL.replace(/https?:\/\//, "").split("/")[0]}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={site.URL.startsWith("http") ? site.URL : `https://${site.URL}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => handleScrape(site)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Scraper"
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
