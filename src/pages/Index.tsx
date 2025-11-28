import { useState } from "react";
import { Zap, Globe, List } from "lucide-react";
import { Link } from "react-router-dom";
import { ScraperHeader } from "@/components/ScraperHeader";
import { ChatInterface } from "@/components/ChatInterface";
import { ScrapedData } from "@/types/site";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const clearScrapedData = () => {
    setScrapedData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex flex-col">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center glow-primary-sm">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-foreground">ScrapAI</h1>
                <p className="text-[10px] text-muted-foreground">Scrape & Prompt</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-primary" disabled>
                <Globe className="h-3.5 w-3.5" />
                Scraper
              </Button>
              <Link to="/sites">
                <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground hover:text-foreground">
                  <List className="h-3.5 w-3.5" />
                  Ma Liste
                </Button>
              </Link>
            </nav>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 rounded-md bg-primary/10 text-primary font-medium text-[10px]">
                Gemini 2.5 Flash
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Scraper Header */}
      <ScraperHeader
        onScraped={setScrapedData}
        scrapedData={scrapedData}
        onClearScraped={clearScrapedData}
        selectedCategories={selectedCategories}
        onCategoriesChange={setSelectedCategories}
      />

      {/* Full Screen Chat */}
      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
        <ChatInterface scrapedData={scrapedData} selectedCategories={selectedCategories} />
      </main>
    </div>
  );
};

export default Index;
