import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Sparkles, Trash2, Filter, Globe, Download, FileText, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import sitesData from "@/data/sites.json";
import { exportToPDF, exportToWord } from "@/utils/exportDocument";
import { MessageContent } from "@/components/MessageContent";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ScrapedPage {
  url: string;
  title: string;
  content: string;
}

interface ScrapedSite {
  url: string;
  title: string;
  content: string;
  siteName?: string;
  pages?: ScrapedPage[]; // Individual pages with exact URLs
}

interface ChatInterfaceProps {
  selectedCategories?: string[];
  onCategoryToggle?: (categoryId: string) => void;
  onClearCategories?: () => void;
  scrapedData?: ScrapedSite | null;
}

const CATEGORIES = [
  { id: "droit", label: "Droit", color: "bg-blue-500/20 text-blue-700 border-blue-500/30" },
  { id: "federation", label: "Fédération", color: "bg-purple-500/20 text-purple-700 border-purple-500/30" },
  { id: "finance", label: "Finance", color: "bg-amber-500/20 text-amber-700 border-amber-500/30" },
  { id: "generaliste", label: "Généraliste", color: "bg-orange-500/20 text-orange-700 border-orange-500/30" },
  { id: "presse", label: "Presse", color: "bg-cyan-500/20 text-cyan-700 border-cyan-500/30" },
  { id: "sport", label: "Sport", color: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30" },
  { id: "syndicat", label: "Syndicat", color: "bg-rose-500/20 text-rose-700 border-rose-500/30" },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const SCRAPE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape`;

export const ChatInterface = ({ selectedCategories = [], onCategoryToggle, onClearCategories, scrapedData }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scrapingProgress, setScrapingProgress] = useState<{ current: number; total: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const clearChat = () => {
    setMessages([]);
  };

  // Validate URL format
  const isValidUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    
    // Must start with http:// or https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
    
    // Remove any extra text after URL (like "(site mentionné)")
    const cleanedUrl = url.split(' ')[0].split('(')[0].trim();
    
    try {
      const parsed = new URL(cleanedUrl);
      const hostname = parsed.hostname;
      
      // Must have a valid hostname with at least one dot
      if (!hostname.includes('.')) return false;
      
      // Get the TLD (last part after the last dot)
      const parts = hostname.split('.');
      const tld = parts[parts.length - 1];
      
      // TLD must be between 2 and 6 characters (e.g., .fr, .com, .museum)
      // This filters out invalid hostnames like "www.cohengresser"
      if (tld.length < 2 || tld.length > 6) return false;
      
      // If starts with www, must have at least 3 parts (www.domain.tld)
      if (parts[0] === 'www' && parts.length < 3) return false;
      
      // Hostname must be longer than 4 chars (e.g., "a.co")
      if (hostname.length < 4) return false;
      
      return true;
    } catch {
      return false;
    }
  };

  // Clean URL by removing extra text
  const cleanUrl = (url: string): string => {
    return url.split(' ')[0].split('(')[0].trim();
  };

  // Get sites from selected categories
  const getSitesForCategories = (): Array<{ name: string; url: string; category: string }> => {
    if (selectedCategories.length === 0) return [];
    
    const normalizedCategories = selectedCategories.map(c => c.toLowerCase().trim());
    
    return sitesData
      .filter(site => {
        const siteCategory = site.CATEGORIES?.toLowerCase().trim();
        return normalizedCategories.some(cat => siteCategory?.includes(cat));
      })
      .map(site => ({
        name: site.NAME,
        url: cleanUrl(site.URL),
        category: site.CATEGORIES
      }))
      .filter(site => isValidUrl(site.url));
  };

  // Scrape a single site with deep crawling
  const scrapeSite = async (site: { name: string; url: string }): Promise<ScrapedSite | null> => {
    try {
      const response = await fetch(SCRAPE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ url: site.url, deep: true }),
      });

      const data = await response.json();
      
      // Check for success in the response data
      if (!data.success) {
        return null;
      }

      console.log(`Scraped ${site.name}: ${data.pagesScraped || 1} pages, ${data.content?.length || 0} chars`);

      return {
        url: site.url,
        title: data.title || site.name,
        content: data.content || "",
        siteName: site.name,
        pages: data.pages || [], // Individual pages with exact URLs
      };
    } catch (error) {
      return null;
    }
  };

  // Scrape all sites from categories (no limit)
  const scrapeAllSites = async (): Promise<ScrapedSite[]> => {
    const sites = getSitesForCategories();
    
    if (sites.length === 0) return [];

    setScrapingProgress({ current: 0, total: sites.length });
    const scrapedSites: ScrapedSite[] = [];

    // Scrape in batches of 5 for performance
    for (let i = 0; i < sites.length; i += 5) {
      const batch = sites.slice(i, i + 5);
      const results = await Promise.all(batch.map(site => scrapeSite(site)));
      
      results.forEach(result => {
        if (result) scrapedSites.push(result);
      });
      
      setScrapingProgress({ current: Math.min(i + 5, sites.length), total: sites.length });
    }

    setScrapingProgress(null);
    return scrapedSites;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      // First, scrape all sites from selected categories OR use provided scraped data
      let scrapedSites: ScrapedSite[] = [];
      
      console.log("[ChatInterface] Selected categories:", selectedCategories);
      console.log("[ChatInterface] Sites for categories:", getSitesForCategories().length);
      
      if (scrapedData) {
        // Use the single scraped site from Sites page
        scrapedSites = [scrapedData];
        console.log("[ChatInterface] Using provided scrapedData");
      } else if (selectedCategories.length > 0) {
        toast.info("Analyse des sites en cours...");
        scrapedSites = await scrapeAllSites();
        console.log("[ChatInterface] Scraped sites count:", scrapedSites.length);
        console.log("[ChatInterface] Total content length:", scrapedSites.reduce((acc, s) => acc + (s.content?.length || 0), 0));
        if (scrapedSites.length > 0) {
          toast.success(`${scrapedSites.length} sites analysés`);
        }
      } else {
        console.log("[ChatInterface] No categories selected, no scraping");
      }

      console.log("[ChatInterface] Sending to chat API:", {
        messagesCount: messages.length + 1,
        scrapedSitesCount: scrapedSites.length,
        categoriesCount: selectedCategories.length,
        categories: selectedCategories,
      });

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          scrapedSites, // Array of scraped sites with URLs
          categories: selectedCategories,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

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
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantContent,
                };
                return newMessages;
              });
            }
          } catch {
            // Partial JSON
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'envoi");
      if (!assistantContent) {
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
      setScrapingProgress(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sitesCount = getSitesForCategories().length;
  const hasContext = selectedCategories.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header with context info */}
      {messages.length > 0 && (
        <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between gap-2 flex-wrap rounded-t-xl m-4 mb-0">
          <div className="flex items-center gap-2 flex-wrap">
            {selectedCategories.length > 0 && (
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3 text-primary" />
                <span className="text-xs text-muted-foreground">
                  {sitesCount} site{sitesCount > 1 ? "s" : ""} dans {selectedCategories.length} catégorie{selectedCategories.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="text-xs text-muted-foreground hover:text-foreground h-7"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Effacer
          </Button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 glow-primary">
                <Sparkles className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">
                {hasContext ? "Prêt à rechercher" : "Bienvenue sur ScrapAI"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                {selectedCategories.length > 0
                  ? `${sitesCount} sites seront analysés puis Gemini fera un résumé avec les sources exactes`
                  : "Sélectionnez des catégories pour cibler votre recherche"}
              </p>
              
              {!hasContext && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5" />
                    Utilisez le filtre "Catégories" dans la barre du haut
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">Sport</Badge>
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">Droit</Badge>
                    <Badge variant="outline" className="bg-cyan-100 text-cyan-700 border-cyan-200">Presse</Badge>
                    <span className="text-muted-foreground">...</span>
                  </div>
                </div>
              )}

              {hasContext && (
                <div className="grid gap-2 text-sm text-muted-foreground">
                  <p>💡 Exemples de questions :</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="outline" className="cursor-default">
                      Quelles actualités importantes ?
                    </Badge>
                    <Badge variant="outline" className="cursor-default">
                      Résume les dernières infos
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-3 animate-fade-in",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground border border-border shadow-sm"
                  )}
                >
                <div className="text-sm">
                    {message.content ? (
                      <MessageContent content={message.content} />
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {scrapingProgress 
                          ? `Analyse des sites (${scrapingProgress.current}/${scrapingProgress.total})...`
                          : "Recherche en cours..."
                        }
                      </span>
                    )}
                  </div>
                  {/* Export buttons for assistant messages with content */}
                  {message.role === "assistant" && message.content && (
                    <div className="mt-3 pt-3 border-t border-border flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Exporter
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem
                            onClick={async () => {
                              try {
                                await exportToPDF(message.content, "Rapport ScrapAI");
                                toast.success("PDF exporté avec succès");
                              } catch (e) {
                                toast.error("Erreur lors de l'export PDF");
                              }
                            }}
                          >
                            <FileText className="h-4 w-4 mr-2 text-red-500" />
                            Exporter en PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={async () => {
                              try {
                                await exportToWord(message.content, "Rapport ScrapAI");
                                toast.success("Document Word exporté avec succès");
                              } catch (e) {
                                toast.error("Erreur lors de l'export Word");
                              }
                            }}
                          >
                            <FileIcon className="h-4 w-4 mr-2 text-blue-500" />
                            Exporter en Word
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="h-4 w-4 text-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 bg-card">
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Category filter above prompt */}
          {onCategoryToggle && (
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              {CATEGORIES.map((category) => (
                <Badge
                  key={category.id}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all text-xs",
                    selectedCategories.includes(category.id)
                      ? category.color + " ring-1 ring-offset-1"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                  onClick={() => onCategoryToggle(category.id)}
                >
                  {category.label}
                </Badge>
              ))}
              {selectedCategories.length > 0 && onClearCategories && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-muted-foreground hover:text-foreground px-2"
                  onClick={onClearCategories}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Tout effacer
                </Button>
              )}
            </div>
          )}
          
          <div className="flex gap-3 items-end">
            <Textarea
              placeholder={
                selectedCategories.length > 0
                  ? `Posez votre question (${sitesCount} sites seront analysés)...`
                  : "Sélectionnez des catégories pour commencer..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[48px] max-h-32 resize-none bg-background border-border focus:border-primary focus:ring-primary/20"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="h-[48px] w-[48px] bg-primary text-primary-foreground hover:bg-primary/90 glow-primary-sm flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
