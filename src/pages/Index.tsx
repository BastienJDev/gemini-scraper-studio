import { useState } from "react";
import { Zap, List, MessageSquare, FileText } from "lucide-react";
import { UrlScraper } from "@/components/UrlScraper";
import { SiteSelector } from "@/components/SiteSelector";
import { ChatInterface } from "@/components/ChatInterface";
import { ScrapedData } from "@/types/site";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

const Index = () => {
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
            <Tabs defaultValue="list" className="flex flex-col h-full">
              <div className="px-3 pt-3 pb-0">
                <TabsList className="grid w-full grid-cols-2 h-9 bg-secondary/50">
                  <TabsTrigger value="list" className="text-xs gap-1.5">
                    <List className="h-3.5 w-3.5" />
                    Sites ({Math.round(170)})
                  </TabsTrigger>
                  <TabsTrigger value="custom" className="text-xs gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    URL Custom
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="list" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
                <SiteSelector
                  onScraped={setScrapedData}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                />
              </TabsContent>

              <TabsContent value="custom" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
                <div className="flex flex-col h-full">
                  <UrlScraper
                    onScraped={setScrapedData}
                    scrapedData={scrapedData}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                  />
                  
                  {scrapedData && (
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-foreground">Aperçu du contenu</h3>
                        <div className="bg-secondary/30 rounded-lg border border-border/30 p-3">
                          <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                            {scrapedData.content.substring(0, 3000)}
                            {scrapedData.content.length > 3000 && (
                              <span className="text-primary">
                                {"\n\n"}... +{(scrapedData.content.length - 3000).toLocaleString()} caractères
                              </span>
                            )}
                          </pre>
                        </div>
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </TabsContent>
            </Tabs>
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

export default Index;
