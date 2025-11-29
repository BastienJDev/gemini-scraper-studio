import { useState } from "react";
import { Newspaper } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const Actualites = () => {
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
          <header className="md:hidden border-b border-border bg-card sticky top-0 z-10 p-3">
            <SidebarTrigger />
          </header>
          
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 mx-auto glow-primary">
                <Newspaper className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-semibold text-foreground mb-2">Actualités</h1>
              <p className="text-muted-foreground">Page en construction</p>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Actualites;
