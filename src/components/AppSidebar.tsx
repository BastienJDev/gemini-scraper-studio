import { Zap, List, MessageSquare, Globe, Filter, Play, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

const CATEGORIES = [
  { id: "droit", label: "DROIT", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { id: "federation", label: "FEDERATION", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { id: "finance", label: "Finance", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { id: "generaliste", label: "Generaliste", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { id: "presse", label: "PRESSE", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  { id: "sport", label: "Sport", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { id: "syndicat", label: "Syndicat", color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
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

  return (
    <Sidebar className="border-r border-border/30">
      {/* Header */}
      <SidebarHeader className="border-b border-border/30 p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center glow-primary-sm flex-shrink-0">
            <Zap className="h-4 w-4 text-primary" />
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
                    className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-secondary/50 transition-colors"
                    activeClassName="bg-primary/10 text-primary border-l-2 border-primary"
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span className="text-sm">{item.title}</span>}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

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
                    className="flex items-center gap-2 cursor-pointer hover:bg-secondary/30 rounded-md p-2 transition-colors"
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
      <SidebarFooter className="border-t border-border/30 p-4">
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
