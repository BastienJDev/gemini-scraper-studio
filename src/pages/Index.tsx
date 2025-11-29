import { useState } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AutoLoginButtons } from "@/components/AutoLoginButtons";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, KeyRound } from "lucide-react";

const Index = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [autoLoginOpen, setAutoLoginOpen] = useState(false);

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
      <div className="min-h-screen bg-gradient-dark flex w-full">
        <AppSidebar 
          selectedCategories={selectedCategories}
          onCategoryToggle={toggleCategory}
          onClearCategories={clearCategories}
        />
        
        <main className="flex-1 flex flex-col">
          {/* Mobile Header */}
          <header className="md:hidden border-b border-border/30 bg-card/30 backdrop-blur-sm sticky top-0 z-10 p-3">
            <SidebarTrigger />
          </header>
          
          {/* AutoLogin Section */}
          <div className="border-b border-border/30 bg-card/20 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto w-full px-4 py-2">
              <Collapsible open={autoLoginOpen} onOpenChange={setAutoLoginOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-between py-1">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    <span>AutoLogin - Bases de données BU</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${autoLoginOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 pb-1">
                  <AutoLoginButtons />
                  <p className="text-xs text-muted-foreground mt-2">
                    Nécessite l'extension Chrome ScrapAI installée
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
          
          {/* Chat Interface */}
          <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
            <ChatInterface selectedCategories={selectedCategories} />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
