import { Zap, List, MessageSquare, Globe, Filter, Settings, KeyRound, ExternalLink, ChevronDown, Briefcase, Newspaper } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const AUTO_LOGIN_SITES = [
  { id: "dalloz", name: "Dalloz", icon: "📚" },
  { id: "lamyline", name: "Lamyline", icon: "⚖️" },
  { id: "lexisnexis", name: "LexisNexis", icon: "📖" },
  { id: "cairn", name: "Cairn", icon: "📰" },
  { id: "generalis", name: "Généralis", icon: "📑" },
  { id: "ledoctrinal", name: "Le Doctrinal", icon: "📜" },
  { id: "droitdusport", name: "Droit du Sport", icon: "⚽" },
];

const CATEGORIES = [
  { id: "droit", label: "DROIT", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { id: "federation", label: "FEDERATION", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  { id: "finance", label: "Finance", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  { id: "generaliste", label: "Generaliste", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  { id: "presse", label: "PRESSE", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  { id: "sport", label: "Sport", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  { id: "syndicat", label: "Syndicat", color: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
];

const navItems = [
  { title: "Chat", url: "/", icon: MessageSquare },
  { title: "Ma Liste", url: "/sites", icon: List },
  { title: "Offres d'emploi", url: "/emploi", icon: Briefcase },
  { title: "Actualités", url: "/actualites", icon: Newspaper },
  { title: "Scraper Python", url: "/scraper-config", icon: Settings },
];

interface AppSidebarProps {
  selectedCategories: string[];
  onCategoryToggle: (categoryId: string) => void;
  onClearCategories: () => void;
}

export function AppSidebar({ 
  selectedCategories, 
  onCategoryToggle, 
  onClearCategories 
}: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const [autoLoginOpen, setAutoLoginOpen] = useState(false);

  const triggerAutoLogin = (siteId: string, siteName: string) => {
    const event = new CustomEvent("SCRAPAI_AUTO_LOGIN", {
      detail: { siteId },
    });
    window.dispatchEvent(event);
    
    toast.info(`Lancement de la connexion à ${siteName}...`, {
      description: "L'extension Chrome va ouvrir le site.",
    });
  };

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center glow-primary-sm flex-shrink-0">
            <Zap className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-base font-semibold text-sidebar-foreground">ScrapAI</h1>
              <p className="text-[10px] text-sidebar-foreground/60">Recherche sur vos sites</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground px-4">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
              <NavLink 
                    to={item.url} 
                    end 
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground/70"
                    activeClassName="bg-sidebar-primary/20 text-sidebar-primary font-medium"
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span className="text-sm">{item.title}</span>}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Auto Login */}
        {!collapsed && (
          <SidebarGroup className="mt-4">
            <Collapsible open={autoLoginOpen} onOpenChange={setAutoLoginOpen}>
              <CollapsibleTrigger className="w-full">
                <SidebarGroupLabel className="text-xs text-muted-foreground px-4 flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
                  <KeyRound className="h-3 w-3" />
                  Auto Login
                  <ChevronDown className={cn("h-3 w-3 ml-auto transition-transform", autoLoginOpen && "rotate-180")} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent className="px-2 mt-2">
                  <div className="space-y-1">
                    {AUTO_LOGIN_SITES.map((site) => (
                      <button
                        key={site.id}
                        onClick={() => triggerAutoLogin(site.id, site.name)}
                        className="flex items-center gap-2 w-full text-left hover:bg-sidebar-accent rounded-md p-2 transition-colors text-sm group text-sidebar-foreground/70 hover:text-sidebar-foreground"
                      >
                        <span>{site.icon}</span>
                        <span className="flex-1">{site.name}</span>
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 px-2">
                    Extension Chrome requise
                  </p>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}

        {/* Categories Filter */}
        {!collapsed && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-xs text-muted-foreground px-4 flex items-center gap-2">
              <Filter className="h-3 w-3" />
              Catégories
              {selectedCategories.length > 0 && (
                <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[10px] bg-primary/20 text-primary">
                  {selectedCategories.length}
                </Badge>
              )}
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-2 mt-2">
              <div className="space-y-1">
                {CATEGORIES.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-sidebar-accent rounded-md p-2 transition-colors"
                  >
                    <Checkbox
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={() => onCategoryToggle(category.id)}
                    />
                    <Badge variant="outline" className={cn("text-xs", category.color)}>
                      {category.label}
                    </Badge>
                  </label>
                ))}
              </div>
              {selectedCategories.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs mt-3 text-muted-foreground hover:text-foreground"
                  onClick={onClearCategories}
                >
                  Tout désélectionner
                </Button>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-sidebar-primary" />
            <span className="px-2 py-1 rounded-md bg-sidebar-primary/20 text-sidebar-primary font-medium text-[10px]">
              Gemini 2.5 Flash
            </span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
