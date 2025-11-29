import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";

// Sites configuration matching the Chrome extension
const SITES = [
  { id: "dalloz", name: "Dalloz", icon: "📚" },
  { id: "lamyline", name: "Lamyline", icon: "⚖️" },
  { id: "lexisnexis", name: "LexisNexis", icon: "📖" },
  { id: "cairn", name: "Cairn", icon: "📰" },
  { id: "generalis", name: "Généralis", icon: "📑" },
  { id: "ledoctrinal", name: "Le Doctrinal", icon: "📜" },
];

export const AutoLoginButtons = () => {
  const triggerAutoLogin = (siteId: string, siteName: string) => {
    // Dispatch custom event for the Chrome extension to catch
    const event = new CustomEvent("SCRAPAI_AUTO_LOGIN", {
      detail: { siteId },
    });
    window.dispatchEvent(event);
    
    toast.info(`Lancement de la connexion à ${siteName}...`, {
      description: "L'extension Chrome va ouvrir le site et vous connecter automatiquement.",
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {SITES.map((site) => (
        <Button
          key={site.id}
          variant="outline"
          size="sm"
          onClick={() => triggerAutoLogin(site.id, site.name)}
          className="gap-2 hover:bg-primary/10 hover:border-primary/50 transition-all"
        >
          <span>{site.icon}</span>
          <span>{site.name}</span>
          <ExternalLink className="h-3 w-3 opacity-50" />
        </Button>
      ))}
    </div>
  );
};
