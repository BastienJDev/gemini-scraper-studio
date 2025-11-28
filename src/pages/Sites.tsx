import { useState } from "react";
import { Zap, MessageSquare, Globe, List } from "lucide-react";
import { Link } from "react-router-dom";
import { SiteSelector } from "@/components/SiteSelector";
import { ChatInterface } from "@/components/ChatInterface";
import { ScrapedData } from "@/types/site";
import { Button } from "@/components/ui/button";

const Sites = () => {
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-dark">
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
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground hover:text-foreground">
                  <Globe className="h-3.5 w-3.5" />
                  URL Custom
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-primary" disabled>
                <List className="h-3.5 w-3.5" />
                Ma Liste
              </Button>
            </nav>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 rounded-md bg-primary/10 text-primary font-medium text-[10px]">
                Gemini 2.5 Flash
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid lg:grid-cols-5 gap-4 h-[calc(100vh-6rem)]">
          {/* Left Panel - Site List */}
          <div className="lg:col-span-2 flex flex-col bg-card/50 rounded-xl border border-border/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/30 flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center">
                <List className="h-3.5 w-3.5 text-accent" />
              </div>
              <div>
                <h2 className="font-medium text-foreground text-sm">Ma Liste de Sites</h2>
                <p className="text-[10px] text-muted-foreground">Sélectionnez un site à scraper</p>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <SiteSelector
                onScraped={setScrapedData}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </div>
          </div>

          {/* Right Panel - Chat */}
          <div className="lg:col-span-3 flex flex-col bg-card/50 rounded-xl border border-border/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/30 flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="font-medium text-foreground text-sm">Chat Gemini</h2>
                <p className="text-[10px] text-muted-foreground">
                  {scrapedData
                    ? `Contexte: ${scrapedData.siteName || scrapedData.title || "Site scrapé"}`
                    : "Sélectionnez un site à analyser"}
                </p>
              </div>
              {scrapedData && (
                <div className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-medium">
                  Contexte actif
                </div>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatInterface scrapedData={scrapedData} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Sites;
