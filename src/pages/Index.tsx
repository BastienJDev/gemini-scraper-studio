import { useMemo, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { Search, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import sitesData from "@/data/sites.json";
import { MessageContent } from "@/components/MessageContent";

const Index = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [depth, setDepth] = useState<1 | 2 | 3>(1);
  const [geminiEnabled, setGeminiEnabled] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [resultText, setResultText] = useState("");

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

  const depthOptions = useMemo(
    () => [
      { id: 1 as const, label: "1 Base", description: "Page principale uniquement" },
      { id: 2 as const, label: "2 Annexes", description: "Inclut les pages liées" },
      { id: 3 as const, label: "3 Complet", description: "Explore toutes les pages détectées" },
    ],
    []
  );

  const categoryOptions = [
    { id: "droit", label: "Droit" },
    { id: "federation", label: "Fédération" },
    { id: "finance", label: "Finance" },
    { id: "generaliste", label: "Généraliste" },
    { id: "presse", label: "Presse" },
    { id: "sport", label: "Sport" },
    { id: "syndicat", label: "Syndicat" },
  ];

  const SCRAPE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape`;
  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

  const depthConfig = {
    1: { deep: false, maxPages: 1 },
    2: { deep: true, maxPages: 4 },
    3: { deep: true, maxPages: 12 },
  } as const;

  const cleanUrl = (url: string): string => url.split(" ")[0].split("(")[0].trim();

  const isValidUrl = (url: string): boolean => {
    if (!url || typeof url !== "string") return false;
    if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
    try {
      const parsed = new URL(url);
      return parsed.hostname.includes(".");
    } catch {
      return false;
    }
  };

  const getSitesForCategories = (): Array<{ name: string; url: string; category: string }> => {
    if (selectedCategories.length === 0) return [];
    const normalized = selectedCategories.map((c) => c.toLowerCase().trim());
    return sitesData
      .filter((site) => {
        const cat = site.CATEGORIES?.toLowerCase().trim();
        return normalized.some((c) => cat?.includes(c));
      })
      .map((site) => ({
        name: site.NAME,
        url: cleanUrl(site.URL),
        category: site.CATEGORIES,
      }))
      .filter((site) => isValidUrl(site.url));
  };

  const scrapeSite = async (site: { name: string; url: string }, level: 1 | 2 | 3) => {
    const cfg = depthConfig[level];
    const res = await fetch(SCRAPE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ url: site.url, deep: cfg.deep, maxPages: cfg.maxPages }),
    });
    const data = await res.json();
    if (data.success) {
      return {
        url: site.url,
        title: data.title || site.name,
        content: data.content || "",
        siteName: site.name,
        pages: data.pages || [],
      };
    }
    return null;
  };

  const buildOccurrences = (sites: any[], query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return "";
    const lines: string[] = [];
    sites.forEach((s) => {
      const pages = s.pages && s.pages.length > 0 ? s.pages : [{ url: s.url, title: s.title, content: s.content }];
      const siteLines: string[] = [];
      pages.forEach((p: any) => {
        if (!p.content) return;
        const contentLower = p.content.toLowerCase();
        const foundIndex = contentLower.indexOf(q);
        if (foundIndex === -1) return;

        // Extraire la phrase autour de l'occurrence (délimiteurs basiques)
        const separators = /[\\.\\?!]/g;
        let sentenceStart = 0;
        let sentenceEnd = p.content.length;
        let match;
        while ((match = separators.exec(p.content)) !== null) {
          if (match.index < foundIndex) {
            sentenceStart = match.index + 1;
          } else if (match.index > foundIndex && sentenceEnd === p.content.length) {
            sentenceEnd = match.index + 1;
            break;
          }
        }
        const sentence = p.content.substring(
          Math.max(0, sentenceStart - 10),
          Math.min(p.content.length, sentenceEnd + 10)
        );
        const cleaned = sentence
          .replace(/#+/g, "")
          .replace(/\\s+/g, " ")
          .replace(/\\s([,.!?;:])/g, "$1")
          .trim();
        const maxLen = 240;
        const snippet = cleaned.length > maxLen ? `${cleaned.slice(0, maxLen)}...` : cleaned;

        siteLines.push(`[${p.title || p.url}](${p.url}) — ${snippet}`);
      });
      if (siteLines.length > 0) {
        lines.push(`${s.siteName || s.title || s.url} :\n${siteLines.map((l) => `- ${l}`).join("\n")}`);
      }
    });
    return lines.join("\n\n");
  };

  const handleSearch = async () => {
    if (isSearching) return;
    if (!prompt.trim()) {
      toast.error("Ajoute un prompt pour cibler le scraping.");
      return;
    }
    const sites = getSitesForCategories();
    if (sites.length === 0) {
      toast.error("Sélectionnez au moins une catégorie.");
      return;
    }

    setIsSearching(true);
    setResultText("");
    toast.info("Scraping en cours...");

    const scrapedSites: any[] = [];
    for (const site of sites.slice(0, 8)) {
      try {
        const res = await scrapeSite(site, depth);
        if (res) scrapedSites.push(res);
      } catch {
        // ignore single failure
      }
    }

    if (scrapedSites.length === 0) {
      toast.error("Aucun site n'a pu être scrappé");
      setIsSearching(false);
      return;
    }

    if (!geminiEnabled) {
      const plain = buildOccurrences(scrapedSites, prompt);
      setResultText(
        plain
          ? `Occurences trouvées pour "${prompt}":\n\n${plain}`
          : `Aucune occurrence trouvée pour "${prompt}".`
      );
      toast.success(`${scrapedSites.length} site(s) scrappé(s)`);
      setIsSearching(false);
      return;
    }

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt || "Analyse les sites fournis" }],
          scrapedSites,
          categories: selectedCategories,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Réponse invalide");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
            }
          } catch {
            // ignore partial
          }
        }
      }

      setResultText(assistantContent || "Aucune réponse générée.");
      toast.success("Analyse Gemini terminée");
    } catch (error) {
      console.error("Chat error", error);
      toast.error("Erreur pendant l'analyse Gemini");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-b from-[#f4f8fd] via-[#eef3fb] to-[#e6eef9] flex w-full">
        <AppSidebar
          selectedCategories={selectedCategories}
          onCategoryToggle={toggleCategory}
          onClearCategories={clearCategories}
        />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-3xl mx-auto text-center space-y-8">
            <div className="space-y-3">
              <p className="text-3xl md:text-4xl font-bold text-[#1f67d2] tracking-tight">
                Bienvenue ENZO
              </p>
              <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-[#d8e2f3] rounded-full px-4 py-3 shadow-sm">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Faites votre prompt..."
                  className="border-0 shadow-none focus-visible:ring-0 text-base"
                />
              </div>
            </div>

            <Card className="bg-white/90 border-[#d8e2f3] shadow-lg rounded-3xl p-6 space-y-5 text-left">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-lg font-medium text-foreground">Profondeur d’analyse</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        {depthOptions.find((d) => d.id === depth)?.label || "Choisir"}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64">
                      {depthOptions.map((opt) => (
                        <DropdownMenuCheckboxItem
                          key={opt.id}
                          checked={depth === opt.id}
                          onCheckedChange={() => setDepth(opt.id)}
                          className={`flex flex-col items-start py-3 px-3 rounded-lg ${
                            depth === opt.id ? "bg-[#e8f0ff] text-[#1f67d2]" : ""
                          }`}
                        >
                          <div className="text-base font-semibold">{opt.label}</div>
                          <div className="text-sm text-muted-foreground">{opt.description}</div>
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-medium text-foreground">Catégories</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        {selectedCategories.length > 0
                          ? `${selectedCategories.length} sélectionnée${selectedCategories.length > 1 ? "s" : ""}`
                          : "Sélectionnez des catégories..."}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      {categoryOptions.map((cat) => (
                        <DropdownMenuCheckboxItem
                          key={cat.id}
                          checked={selectedCategories.includes(cat.id)}
                          onCheckedChange={() => toggleCategory(cat.id)}
                          onSelect={(e) => e.preventDefault()} // keep menu open for multi-select
                        >
                          {cat.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((cat) => {
                    const meta = categoryOptions.find((c) => c.id === cat);
                    return (
                      <Button
                        key={cat}
                        variant="ghost"
                        size="sm"
                        className="bg-[#eef3fb] text-[#1f67d2] hover:bg-[#dce8fa]"
                        onClick={() => toggleCategory(cat)}
                      >
                        {meta?.label || cat}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-foreground">Reformuler via Gemini</span>
                <Switch checked={geminiEnabled} onCheckedChange={setGeminiEnabled} />
              </div>

              <Button
                className="w-full bg-[#1f67d2] hover:bg-[#1651a5] text-white text-base py-5 rounded-2xl mt-2"
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? "Recherche..." : "Rechercher"}
              </Button>
            </Card>

            {resultText && (
              <Card className="bg-white/90 border-[#d8e2f3] shadow rounded-2xl p-4 text-left">
                <MessageContent content={resultText} />
              </Card>
            )}

            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span>À propos</span>
              <span>Services</span>
              <span>Contact</span>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
