import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ScrapedData } from "@/types/site";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  scrapedData: ScrapedData | null;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export const ChatInterface = ({ scrapedData }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clear messages when scraped data changes
  useEffect(() => {
    if (scrapedData) {
      setMessages([]);
    }
  }, [scrapedData?.url]);

  const clearChat = () => {
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          scrapedContent: scrapedData,
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
            // Partial JSON, continue
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
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with clear button */}
      {messages.length > 0 && (
        <div className="px-4 py-2 border-b border-border/30 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Effacer
          </Button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-card border border-border/50 flex items-center justify-center mb-3">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">
              {scrapedData ? "Prêt à analyser" : "En attente"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {scrapedData
                ? `Posez une question sur "${scrapedData.siteName || scrapedData.title || scrapedData.url}"`
                : "Sélectionnez un site à scraper"}
            </p>
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
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 text-foreground border border-border/30"
                )}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content || (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Réflexion...
                    </span>
                  )}
                </p>
              </div>
              {message.role === "user" && (
                <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="h-3.5 w-3.5 text-foreground" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/30 p-3 bg-card/50">
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder={
              scrapedData
                ? "Posez une question sur le contenu..."
                : "Scrapez d'abord un site..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[44px] max-h-28 resize-none bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="h-[44px] w-[44px] bg-primary text-primary-foreground hover:bg-primary/90 glow-primary-sm flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
