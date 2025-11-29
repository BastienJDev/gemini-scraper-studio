import { PlaywrightLogin } from "@/components/PlaywrightLogin";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const Playwright = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-dark flex w-full">
        <AppSidebar 
          selectedCategories={[]}
          onCategoryToggle={() => {}}
          onClearCategories={() => {}}
        />
        
        <main className="flex-1 flex flex-col">
          {/* Mobile Header */}
          <header className="md:hidden border-b border-border/30 bg-card/30 backdrop-blur-sm sticky top-0 z-10 p-3">
            <SidebarTrigger />
          </header>
          
          {/* Playwright Interface */}
          <div className="flex-1 flex items-center justify-center p-6">
            <PlaywrightLogin />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Playwright;
