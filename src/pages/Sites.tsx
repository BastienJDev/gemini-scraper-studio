import { useState } from "react";
import { MessageSquare, List } from "lucide-react";
import { SiteSelector } from "@/components/SiteSelector";
import { ChatInterface } from "@/components/ChatInterface";
import { ScrapedData } from "@/types/site";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const Sites = () => {
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const clearCategories = () => {
    setSelectedCategories([]);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        <AppSidebar 
          selectedCategories={selectedCategories}
          onCategoryToggle={toggleCategory}
          onClearCategories={clearCategories}
        />
        
        <main className="flex-1 flex flex-col bg-secondary/30">
          {/* Mobile Header */}
          <header className="md:hidden border-b border-border bg-card sticky top-0 z-10 p-3">
            <SidebarTrigger />
          </header>

          {/* Main Content */}
          <div className="flex-1 p-4">
            <div className="grid lg:grid-cols-5 gap-4 h-[calc(100vh-2rem)] md:h-[calc(100vh-2rem)]">
              {/* Left Panel - Site List */}
              <div className="lg:col-span-2 flex flex-col bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                    <List className="h-3.5 w-3.5 text-primary-foreground" />
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
              <div className="lg:col-span-3 flex flex-col bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                    <MessageSquare className="h-3.5 w-3.5 text-primary-foreground" />
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
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Sites;
