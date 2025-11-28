import { useState } from "react";
import { Zap, Globe, MessageSquare } from "lucide-react";
import { UrlScraper } from "@/components/UrlScraper";
import { ChatInterface } from "@/components/ChatInterface";

interface ScrapedData {
  title: string;
  description: string;
  content: string;
  url: string;
}

const Index = () => {
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center glow-primary-sm">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">ScrapAI</h1>
                <p className="text-xs text-muted-foreground">Scrape & Prompt avec Gemini</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
                Gemini 2.5 Flash
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
          {/* Left Panel - Scraper */}
          <div className="flex flex-col bg-card/50 rounded-2xl border border-border/30 overflow-hidden">
            <div className="px-5 py-4 border-b border-border/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                <Globe className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h2 className="font-medium text-foreground">Web Scraper</h2>
                <p className="text-xs text-muted-foreground">Extraire le contenu d'une page</p>
              </div>
            </div>
            <div className="p-5 flex-1 overflow-y-auto scrollbar-thin">
              <UrlScraper onScraped={setScrapedData} scrapedData={scrapedData} />
              
              {scrapedData && (
                <div className="mt-6 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground">Contenu extrait</h3>
                    <span className="text-xs text-muted-foreground">
                      Scroll pour voir plus
                    </span>
                  </div>
                  <div className="bg-secondary/30 rounded-lg border border-border/30 p-4 max-h-[calc(100vh-28rem)] overflow-y-auto scrollbar-thin">
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                      {scrapedData.content.substring(0, 5000)}
                      {scrapedData.content.length > 5000 && (
                        <span className="text-primary">
                          {"\n\n"}... et {(scrapedData.content.length - 5000).toLocaleString()} caractères de plus
                        </span>
                      )}
                    </pre>
                  </div>
                </div>
              )}

              {!scrapedData && (
                <div className="mt-12 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-card border border-border/30 flex items-center justify-center mx-auto mb-4">
                    <Globe className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-foreground font-medium mb-2">Aucune page scrapée</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Entrez une URL pour extraire son contenu et l'analyser avec Gemini
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Chat */}
          <div className="flex flex-col bg-card/50 rounded-2xl border border-border/30 overflow-hidden">
            <div className="px-5 py-4 border-b border-border/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-medium text-foreground">Chat Gemini</h2>
                <p className="text-xs text-muted-foreground">
                  {scrapedData ? "Posez vos questions sur le contenu" : "En attente de contenu"}
                </p>
              </div>
              {scrapedData && (
                <div className="ml-auto px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
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

export default Index;
