import { useState } from "react";
import { List } from "lucide-react";
import { SiteSelector } from "@/components/SiteSelector";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const Sites = () => {
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
          <div className="flex-1 p-6 overflow-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-primary-sm">
                  <List className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-foreground">Ma Liste de Sites</h1>
                  <p className="text-muted-foreground text-sm">Gérez vos sites à scraper</p>
                </div>
              </div>
            </div>

            {/* Site List */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <SiteSelector
                onScraped={() => {}}
                isLoading={false}
                setIsLoading={() => {}}
              />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Sites;
