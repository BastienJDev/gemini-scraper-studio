import { useState, useMemo, useEffect } from "react";
import { Search, ChevronDown, ExternalLink, Loader2, Globe, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const CATEGORIES_LIST = [
  "DROIT",
  "FEDERATION",
  "Finance",
  "Generaliste",
  "PRESSE",
  "Sport",
  "Syndicat",
  "Autre",
];

const LOCAL_STORAGE_KEY = "scrapai_custom_sites";

// Normalize the raw data to a consistent format
const normalizeSites = (rawData: RawSite[]): Site[] => {
  return rawData.map((item) => {
    if (item.CATEGORIES && item.NAME && item.URL) {
      return {
        CATEGORIES: item.CATEGORIES.trim(),
        NAME: item.NAME,
        URL: item.URL,
      };
    }
    if (item.Column1 && item["Nom de la Source / Média"] && item["Lien Officiel (URL)"]) {
      return {
        CATEGORIES: item.Column1.trim(),
        NAME: item["Nom de la Source / Média"],
        URL: item["Lien Officiel (URL)"],
      };
    }
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
  const [customSites, setCustomSites] = useState<Site[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSite, setNewSite] = useState({ name: "", url: "", category: "Sport" });

  // Load custom sites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setCustomSites(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse custom sites:", e);
      }
    }
  }, []);

  // Save custom sites to localStorage
  const saveCustomSites = (sites: Site[]) => {
    setCustomSites(sites);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sites));
  };

  const handleAddSite = () => {
    if (!newSite.name.trim() || !newSite.url.trim()) {
      toast.error("Veuillez remplir le nom et l'URL");
      return;
    }

    let url = newSite.url.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const site: Site = {
      NAME: newSite.name.trim(),
      URL: url,
      CATEGORIES: newSite.category,
    };

    saveCustomSites([...customSites, site]);
    setNewSite({ name: "", url: "", category: "Sport" });
    setDialogOpen(false);
    toast.success(`"${site.NAME}" ajouté à la liste`);
  };

  const baseSites = useMemo(() => normalizeSites(sitesData as RawSite[]), []);
  
  // Merge base sites with custom sites
  const sites = useMemo(() => [...baseSites, ...customSites], [baseSites, customSites]);

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
    let url = site.URL.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
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
    if (cat.includes("droit")) return "bg-blue-100 text-blue-700 border-blue-200";
    if (cat.includes("sport")) return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (cat.includes("federation")) return "bg-purple-100 text-purple-700 border-purple-200";
    if (cat.includes("general")) return "bg-amber-100 text-amber-700 border-amber-200";
    if (cat.includes("agent")) return "bg-rose-100 text-rose-700 border-rose-200";
    if (cat.includes("media") || cat.includes("presse")) return "bg-cyan-100 text-cyan-700 border-cyan-200";
    return "bg-secondary text-secondary-foreground border-border";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search & Add */}
      <div className="p-4 border-b border-border">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un site..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-background border-border focus:border-primary"
            />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="outline" className="flex-shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card">
              <DialogHeader>
                <DialogTitle>Ajouter un site</DialogTitle>
                <DialogDescription>
                  Ajoutez un nouveau site à votre liste personnelle.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="site-name">Nom du site</Label>
                  <Input
                    id="site-name"
                    placeholder="Ex: L'Équipe"
                    value={newSite.name}
                    onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-url">URL</Label>
                  <Input
                    id="site-url"
                    placeholder="Ex: https://www.lequipe.fr"
                    value={newSite.url}
                    onChange={(e) => setNewSite({ ...newSite, url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-category">Catégorie</Label>
                  <Select
                    value={newSite.category}
                    onValueChange={(value) => setNewSite({ ...newSite, category: value })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Choisir une catégorie" />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      {CATEGORIES_LIST.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAddSite}>Ajouter</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {sites.length} sites • {Object.keys(sitesByCategory).length} catégories
          {customSites.length > 0 && (
            <span className="text-primary"> • {customSites.length} personnalisé{customSites.length > 1 ? "s" : ""}</span>
          )}
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
                <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors group">
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
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center flex-shrink-0">
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
                          className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
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
