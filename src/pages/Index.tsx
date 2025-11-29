import { useState } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

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
