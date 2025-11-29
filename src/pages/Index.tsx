import { useState } from "react";
import { Menu } from "lucide-react";
import { ChatInterface } from "@/components/ChatInterface";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const Index = () => {
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
      <div className="min-h-screen bg-gradient-dark flex w-full">
        <AppSidebar 
          selectedCategories={selectedCategories}
          onCategoryToggle={toggleCategory}
          onClearCategories={clearCategories}
        />
        
        <main className="flex-1 flex flex-col">
          {/* Mobile Header */}
          <header className="md:hidden border-b border-border/30 bg-card/30 backdrop-blur-sm sticky top-0 z-10 p-3">
            <SidebarTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SidebarTrigger>
          </header>
          
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
