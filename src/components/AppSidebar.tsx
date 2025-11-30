import { 
  Zap, 
  List, 
  Filter, 
  KeyRound, 
  ExternalLink, 
  ChevronDown, 
  Briefcase, 
  Newspaper, 
  FileText,
  LayoutDashboard,
  CheckCircle2,
  BookOpenText,
} from "lucide-react";
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
  { 
    id: "dalloz", 
    name: "Dalloz", 
    icon: "📚",
    startUrl: "https://catalogue-bu.u-bourgogne.fr/discovery/dbsearch?vid=33UB_INST:33UB_INST&lang=fr",
  },
  { 
    id: "lamyline", 
    name: "Lamyline", 
    icon: "⚖️",
    startUrl: "https://catalogue-bu.u-bourgogne.fr/discovery/dbsearch?vid=33UB_INST:33UB_INST&lang=fr",
  },
  { 
    id: "lexisnexis", 
    name: "LexisNexis", 
    icon: "📖",
    startUrl: "https://catalogue-bu.u-bourgogne.fr/discovery/search?vid=33UB_INST:33UB_INST&lang=fr",
  },
  { 
    id: "cairn", 
    name: "Cairn", 
    icon: "📰",
    startUrl: "https://catalogue-bu.u-bourgogne.fr/discovery/dbsearch?vid=33UB_INST:33UB_INST&lang=fr",
  },
  { 
    id: "generalis", 
    name: "Généralis", 
    icon: "📑",
    startUrl: "https://catalogue-bu.u-bourgogne.fr/discovery/dbsearch?vid=33UB_INST:33UB_INST&lang=fr",
  },
  { 
    id: "ledoctrinal", 
    name: "Le Doctrinal", 
    icon: "📜",
    startUrl: "https://catalogue-bu.u-bourgogne.fr/discovery/dbsearch?vid=33UB_INST:33UB_INST&lang=fr",
  },
  { 
    id: "droitdusport", 
    name: "Droit du Sport", 
    icon: "⚽",
    startUrl: "http://droitdusport.com/",
  },
];

const CATEGORIES = [
  { id: "droit", label: "Droit", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { id: "federation", label: "Fédération", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  { id: "finance", label: "Finance", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  { id: "generaliste", label: "Généraliste", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  { id: "presse", label: "Presse", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  { id: "sport", label: "Sport", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  { id: "syndicat", label: "Syndicat", color: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
];

const navItems = [
  { title: "Accueil", url: "/", icon: LayoutDashboard },
  { title: "Actualités", url: "/actualites", icon: Newspaper },
  { title: "Offres d'emploi", url: "/emploi", icon: Briefcase },
  { title: "Gestion des sites", url: "/sites", icon: List },
  { title: "PDF", url: "/bibliotheque", icon: BookOpenText },
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
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const topNavItems = navItems.slice(0, 3);
  const bottomNavItems = navItems.slice(3);

  const triggerAutoLogin = (site: (typeof AUTO_LOGIN_SITES)[number]) => {
    const { id, name, startUrl } = site;
    const event = new CustomEvent("SCRAPAI_AUTO_LOGIN", {
      detail: { 
        siteId: id, 
        startUrl,
        userOpened: Boolean(startUrl),
      },
    });
    window.dispatchEvent(event);

    if (startUrl) {
      const newTab = window.open(startUrl, "_blank", "noopener,noreferrer");
      if (!newTab) {
        toast.error("Impossible d'ouvrir la nouvelle fenêtre, vérifie le bloqueur de pop-ups.");
        return;
      }
    }
    
    toast.info(`Lancement de la connexion à ${name}...`, {
      description: "Une nouvelle fenêtre s'ouvre et l'extension Chrome prend le relais.",
    });
  };

  return (
    <Sidebar className="border-r-0 bg-gradient-to-b from-[#d3ebff] via-[#9fccff] to-[#6da9ff] text-white shadow-[8px_0_24px_rgba(0,0,0,0.28)]">
      {/* Header */}
      <SidebarHeader className="p-5 border-b border-white/15">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shadow-[0_8px_18px_rgba(0,0,0,0.3)] backdrop-blur-sm animate-[pulse_6s_ease-in-out_infinite]">
            <Zap className="h-5 w-5 text-white drop-shadow" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-xs uppercase text-white/75 tracking-[0.08em]">Ton Cabinet</p>
              <h1 className="text-lg font-semibold text-white drop-shadow-sm">Enzo P.</h1>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin px-1">
        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-[0.08em] text-white/80 px-4 mt-4">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {topNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
              <NavLink 
                    to={item.url} 
                    end 
                    className={cn(
                      "group relative flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/90 rounded-lg transition-all duration-300 hover:text-white hover:bg-white/15 hover:translate-x-1",
                      location.pathname === item.url && "text-white bg-white/15 shadow-[0_10px_30px_rgba(79,151,247,0.35)]",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2 h-9 w-1 rounded-r-full bg-gradient-to-b from-[#b8e1ff] to-[#7cb4ff] opacity-0 transition-all duration-300 group-hover:opacity-90 group-hover:w-1.5",
                        location.pathname === item.url && "opacity-100 w-1.5",
                      )}
                    />
                    <item.icon className="h-4 w-4 flex-shrink-0 text-white/80 transition-all duration-300 group-hover:scale-110 drop-shadow-sm" />
                    {!collapsed && <span className="text-sm">{item.title}</span>}
                  </NavLink>
                </SidebarMenuItem>
              ))}

              {/* Sites juridiques dropdown with Auto Login */}
              <SidebarMenuItem>
                <Collapsible open={autoLoginOpen} onOpenChange={setAutoLoginOpen}>
                  <CollapsibleTrigger asChild>
                    <NavLink
                      to="/playwright"
                      end
                      className={cn(
                        "group relative flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/90 rounded-lg transition-all duration-300 hover:text-white hover:bg-white/15 hover:translate-x-1",
                        location.pathname === "/playwright" && "text-white bg-white/15 shadow-[0_10px_30px_rgba(79,151,247,0.35)]",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute left-0 top-1/2 -translate-y-1/2 h-9 w-1 rounded-r-full bg-gradient-to-b from-[#b8e1ff] to-[#7cb4ff] opacity-0 transition-all duration-300 group-hover:opacity-90 group-hover:w-1.5",
                          location.pathname === "/playwright" && "opacity-100 w-1.5",
                        )}
                      />
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-white/80 transition-all duration-300 group-hover:scale-110 drop-shadow-sm" />
                      {!collapsed && <span className="text-sm flex-1 text-left">Sites juridiques</span>}
                      {!collapsed && (
                        <ChevronDown className={cn("h-3 w-3 transition-transform", autoLoginOpen && "rotate-180")} />
                      )}
                    </NavLink>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 space-y-1 px-3 pb-2">
                      {AUTO_LOGIN_SITES.map((site) => (
                        <button
                          key={site.id}
                          onClick={() => triggerAutoLogin(site)}
                          className="flex items-center gap-2 w-full text-left rounded-md p-2 transition-all duration-300 text-sm group text-white/85 hover:text-white hover:bg-white/12 hover:translate-x-1"
                        >
                          <span className="text-lg">{site.icon}</span>
                          <span className="flex-1">{site.name}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-70 transition-opacity duration-200" />
                        </button>
                      ))}
                      <p className="text-[10px] text-white/70 px-2 pt-1">Extension Chrome requise</p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              {bottomNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
              <NavLink 
                    to={item.url} 
                    end 
                    className={cn(
                      "group relative flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/90 rounded-lg transition-all duration-300 hover:text-white hover:bg-white/15 hover:translate-x-1",
                      location.pathname === item.url && "text-white bg-white/15 shadow-[0_10px_30px_rgba(79,151,247,0.35)]",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2 h-9 w-1 rounded-r-full bg-gradient-to-b from-[#b8e1ff] to-[#7cb4ff] opacity-0 transition-all duration-300 group-hover:opacity-90 group-hover:w-1.5",
                        location.pathname === item.url && "opacity-100 w-1.5",
                      )}
                    />
                    <item.icon className="h-4 w-4 flex-shrink-0 text-white/80 transition-all duration-300 group-hover:scale-110 drop-shadow-sm" />
                    {!collapsed && <span className="text-sm">{item.title}</span>}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

    </Sidebar>
  );
}
