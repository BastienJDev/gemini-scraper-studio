import { useState } from "react";
import { Globe, Loader2, CheckCircle2, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ScrapedData } from "@/types/site";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "droit", label: "DROIT", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { id: "federation", label: "FEDERATION", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { id: "finance", label: "Finance", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { id: "generaliste", label: "Generaliste", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { id: "presse", label: "PRESSE", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  { id: "sport", label: "Sport", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { id: "syndicat", label: "Syndicat", color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
];

interface ScraperHeaderProps {
  onScraped: (data: ScrapedData) => void;
  scrapedData: ScrapedData | null;
  onClearScraped: () => void;
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

export const ScraperHeader = ({
  onScraped,
  scrapedData,
  onClearScraped,
  selectedCategories,
  onCategoriesChange,
}: ScraperHeaderProps) => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleScrape = async () => {
    if (!url.trim()) {
      toast.error("Veuillez entrer une URL");
      return;
    }

    try {
      new URL(url);
    } catch {
      toast.error("URL invalide");
      return;
    }

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

      onScraped(data);
      setUrl("");
      toast.success("Page scrapée avec succès!");
    } catch (error) {
      console.error("Scrape error:", error);
      toast.error("Erreur lors du scraping");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== categoryId));
    } else {
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  };

  return (
    <div className="border-b border-border/30 bg-card/50 px-4 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        {/* URL Input */}
        <div className="flex gap-2 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="https://exemple.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScrape()}
              className="pl-10 bg-secondary/50 border-border/50 focus:border-primary/50 h-9 text-sm"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={handleScrape}
            disabled={isLoading || !url.trim()}
            size="sm"
            className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Scraper"}
          </Button>
        </div>

        {/* Category Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Filter className="h-3.5 w-3.5" />
              Catégories
              {selectedCategories.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  {selectedCategories.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="end">
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Filtrer par catégorie</p>
              <div className="space-y-2">
                {CATEGORIES.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-secondary/30 rounded-md p-1.5 -mx-1.5"
                  >
                    <Checkbox
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={() => toggleCategory(category.id)}
                    />
                    <Badge variant="outline" className={cn("text-xs", category.color)}>
                      {category.label}
                    </Badge>
                  </label>
                ))}
              </div>
              {selectedCategories.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => onCategoriesChange([])}
                >
                  Tout désélectionner
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Active scraped content indicator */}
        {scrapedData && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 animate-fade-in">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-primary font-medium truncate max-w-[200px]">
              {scrapedData.siteName || scrapedData.title || "Site scrapé"}
            </span>
            <button
              onClick={onClearScraped}
              className="p-0.5 rounded hover:bg-primary/20 transition-colors"
            >
              <X className="h-3 w-3 text-primary" />
            </button>
          </div>
        )}
      </div>

      {/* Selected categories display */}
      {selectedCategories.length > 0 && (
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Catégories actives:</span>
          {selectedCategories.map((catId) => {
            const cat = CATEGORIES.find((c) => c.id === catId);
            return cat ? (
              <Badge key={catId} variant="outline" className={cn("text-[10px]", cat.color)}>
                {cat.label}
              </Badge>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};
