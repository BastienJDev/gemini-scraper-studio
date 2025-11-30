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
  { title: "Sites juridiques", url: "/playwright", icon: CheckCircle2 },
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
    <Sidebar className="border-r-0 bg-gradient-to-b from-[#1c2c5a] via-[#18264f] to-[#101b3a] text-white shadow-[8px_0_24px_rgba(0,0,0,0.35)]">
      {/* Header */}
      <SidebarHeader className="p-5 border-b border-white/15">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shadow-[0_8px_18px_rgba(0,0,0,0.3)] backdrop-blur-sm animate-[pulse_6s_ease-in-out_infinite]">
            <Zap className="h-5 w-5 text-white drop-shadow" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-xs uppercase text-white/70 tracking-[0.08em]">Ton Cabinet</p>
              <h1 className="text-lg font-semibold text-white drop-shadow-sm">Enzo P.</h1>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin px-1">
        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-[0.08em] text-slate-400 px-4 mt-4">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
              <NavLink 
                    to={item.url} 
                    end 
                    className={cn(
                      "group relative flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/85 rounded-lg transition-all duration-300 hover:text-white hover:bg-white/10 hover:translate-x-1",
                      location.pathname === item.url && "text-white bg-white/10 shadow-[0_10px_30px_rgba(104,99,246,0.25)]",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2 h-9 w-1 rounded-r-full bg-gradient-to-b from-[#9ea7ff] to-[#7087ff] opacity-0 transition-all duration-300 group-hover:opacity-80 group-hover:w-1.5",
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

        {/* Auto Login */}
        {!collapsed && (
          <SidebarGroup className="mt-6">
            <Collapsible open={autoLoginOpen} onOpenChange={setAutoLoginOpen}>
              <CollapsibleTrigger className="w-full">
                <SidebarGroupLabel className="text-[11px] uppercase tracking-[0.08em] text-white/70 px-4 flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
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
                        onClick={() => triggerAutoLogin(site)}
                        className="flex items-center gap-2 w-full text-left rounded-md p-2 transition-all duration-300 text-sm group text-white/80 hover:text-white hover:bg-white/10 hover:translate-x-1"
                      >
                        <span className="text-lg">{site.icon}</span>
                        <span className="flex-1">{site.name}</span>
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-70 transition-opacity duration-200" />
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/70 mt-2 px-2">
                    Extension Chrome requise
                  </p>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}

        {/* Categories Filter */}
        {!collapsed && (
          <SidebarGroup className="mt-6">
            <Collapsible open={categoriesOpen} onOpenChange={setCategoriesOpen}>
              <CollapsibleTrigger className="w-full">
                <SidebarGroupLabel className="text-[11px] uppercase tracking-[0.08em] text-white/70 px-4 flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                  <Filter className="h-3 w-3" />
                  Catégories
                  {selectedCategories.length > 0 && (
                    <Badge variant="secondary" className="ml-auto mr-2 h-5 px-1.5 text-[10px] bg-white/10 text-white border border-white/20 shadow-[0_6px_20px_rgba(0,0,0,0.25)]">
                      {selectedCategories.length}
                    </Badge>
                  )}
                  <ChevronDown className={cn("h-3 w-3 ml-auto transition-transform", categoriesOpen && "rotate-180")} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent className="px-2 mt-2">
                  <div className="space-y-1">
                    {CATEGORIES.map((category) => (
                      <label
                        key={category.id}
                        className="flex items-center gap-2 cursor-pointer rounded-md p-2 transition-all duration-300 hover:bg-white/10 hover:translate-x-1"
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
                      className="w-full text-xs mt-3 text-white/80 hover:text-white hover:bg-white/10"
                      onClick={onClearCategories}
                    >
                      Tout désélectionner
                    </Button>
                  )}
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}
      </SidebarContent>

    </Sidebar>
  );
}
