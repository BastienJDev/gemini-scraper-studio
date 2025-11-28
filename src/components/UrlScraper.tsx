import { useState } from "react";
import { Globe, Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ScrapedData {
  title: string;
  description: string;
  content: string;
  url: string;
}

interface UrlScraperProps {
  onScraped: (data: ScrapedData) => void;
  scrapedData: ScrapedData | null;
}

export const UrlScraper = ({ onScraped, scrapedData }: UrlScraperProps) => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="https://exemple.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScrape()}
            className="pl-10 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 h-11"
            disabled={isLoading}
          />
        </div>
        <Button 
          onClick={handleScrape} 
          disabled={isLoading || !url.trim()}
          className="h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary-sm"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Scraper"
          )}
        </Button>
      </div>

      {scrapedData && (
        <div className="animate-fade-in bg-gradient-card rounded-lg border border-border/50 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground truncate">
                {scrapedData.title || "Sans titre"}
              </h3>
              {scrapedData.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {scrapedData.description}
                </p>
              )}
              <a 
                href={scrapedData.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
              >
                <ExternalLink className="h-3 w-3" />
                {scrapedData.url}
              </a>
            </div>
          </div>
          <div className="pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
              {scrapedData.content.length.toLocaleString()} caractères extraits
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
