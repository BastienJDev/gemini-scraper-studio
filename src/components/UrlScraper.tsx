import { useState } from "react";
import { Globe, Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ScrapedData } from "@/types/site";

interface UrlScraperProps {
  onScraped: (data: ScrapedData) => void;
  scrapedData: ScrapedData | null;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const UrlScraper = ({ onScraped, scrapedData, isLoading, setIsLoading }: UrlScraperProps) => {
  const [url, setUrl] = useState("");

  const handleScrape = async () => {
    if (!url.trim()) {
      toast.error("Veuillez entrer une URL");
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      toast.error("URL invalide");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('scrape', {
        body: { url }
      });

      if (error) {
        console.error('Scrape error:', error);
        toast.error("Erreur lors du scraping");
        return;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      onScraped(data);
      toast.success("Page scrapée avec succès!");
    } catch (error) {
      console.error('Scrape error:', error);
      toast.error("Erreur lors du scraping");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border-b border-border/30">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="https://exemple.com ou URL personnalisée"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScrape()}
            className="pl-10 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 h-10 text-sm"
            disabled={isLoading}
          />
        </div>
        <Button 
          onClick={handleScrape} 
          disabled={isLoading || !url.trim()}
          className="h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Scraper"
          )}
        </Button>
      </div>

      {scrapedData && (
        <div className="animate-fade-in bg-gradient-card rounded-lg border border-primary/30 p-3 space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground text-sm truncate">
                {scrapedData.siteName || scrapedData.title || "Sans titre"}
              </h3>
              {scrapedData.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {scrapedData.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                <a 
                  href={scrapedData.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Ouvrir
                </a>
                <span className="text-xs text-muted-foreground">
                  • {scrapedData.content.length.toLocaleString()} caractères
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
