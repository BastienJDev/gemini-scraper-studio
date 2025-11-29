import { Zap, List, MessageSquare, Globe, Filter, Play, Settings, KeyRound, ExternalLink, ChevronDown } from "lucide-react";
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
  { id: "droit", label: "DROIT", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "federation", label: "FEDERATION", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { id: "finance", label: "Finance", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { id: "generaliste", label: "Generaliste", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { id: "presse", label: "PRESSE", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  { id: "sport", label: "Sport", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { id: "syndicat", label: "Syndicat", color: "bg-rose-100 text-rose-700 border-rose-200" },
];

const navItems = [
  { title: "Chat", url: "/", icon: MessageSquare },
  { title: "Ma Liste", url: "/sites", icon: List },
  { title: "Auto-Login", url: "/playwright", icon: Play },
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
    <Sidebar className="border-r border-border bg-card">
      {/* Header */}
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center glow-primary-sm flex-shrink-0">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-base font-semibold text-foreground">ScrapAI</h1>
              <p className="text-[10px] text-muted-foreground">Recherche sur vos sites</p>
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
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
                    activeClassName="bg-primary/10 text-primary font-medium"
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
                        className="flex items-center gap-2 w-full text-left hover:bg-secondary rounded-md p-2 transition-colors text-sm group text-muted-foreground hover:text-foreground"
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
                    className="flex items-center gap-2 cursor-pointer hover:bg-secondary rounded-md p-2 transition-colors"
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
      <SidebarFooter className="border-t border-border p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span className="px-2 py-1 rounded-md bg-primary/10 text-primary font-medium text-[10px]">
              Gemini 2.5 Flash
            </span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
