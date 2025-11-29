import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Server, Key, TestTube, Loader2, CheckCircle, XCircle, Save, Play } from "lucide-react";

interface ScraperConfig {
  apiUrl: string;
  username: string;
  password: string;
}

interface ScrapeResult {
  items: Array<{
    url: string;
    title?: string;
    text: string;
    error?: string;
  }>;
}

const ScraperConfigPage = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [config, setConfig] = useState<ScraperConfig>({
    apiUrl: "http://170.39.216.138:5000/scrape-droit",
    username: "",
    password: "",
  });
  const [isTesting, setIsTesting] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">("idle");
  const [keyword, setKeyword] = useState("");
  const [scrapeResult, setScrapeResult] = useState<ScrapeResult | null>(null);

  // Load config from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("scraper_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig(parsed);
      } catch (e) {
        console.error("Failed to parse saved config:", e);
      }
    }
  }, []);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleClearCategories = () => {
    setSelectedCategories([]);
  };

  const saveConfig = () => {
    localStorage.setItem("scraper_config", JSON.stringify(config));
    toast.success("Configuration sauvegardée");
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestStatus("idle");
    
    try {
      // Test with a simple request to check if API is reachable
      const response = await fetch(config.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: config.username,
          password: config.password,
          urls: [],
          keyword: "test",
        }),
      });

      if (response.ok) {
        setTestStatus("success");
        toast.success("Connexion réussie à l'API");
      } else {
        setTestStatus("error");
        toast.error(`Erreur: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setTestStatus("error");
      toast.error(`Erreur de connexion: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    } finally {
      setIsTesting(false);
    }
  };

  const runScrape = async () => {
    if (!keyword.trim()) {
      toast.error("Veuillez entrer un mot-clé de recherche");
      return;
    }

    setIsScraping(true);
    setScrapeResult(null);

    try {
      const response = await fetch(config.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: config.username,
          password: config.password,
          urls: ["https://www.droitdusport.com/"],
          keyword: keyword,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setScrapeResult(data);
      toast.success(`Scraping terminé: ${data.items?.length || 0} résultats`);
    } catch (error) {
      toast.error(`Erreur de scraping: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar
          selectedCategories={selectedCategories}
          onCategoryToggle={handleCategoryToggle}
          onClearCategories={handleClearCategories}
        />
        <main className="flex-1 flex flex-col bg-secondary/30">
          <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-4">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Configuration Scraper Python</h1>
          </header>

          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* API Configuration */}
              <Card className="bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-primary" />
                    Configuration API
                  </CardTitle>
                  <CardDescription>
                    Configurez l'URL de votre API Python Playwright sur le VPS
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiUrl">URL de l'API</Label>
                    <Input
                      id="apiUrl"
                      value={config.apiUrl}
                      onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                      placeholder="http://170.39.216.138:5000/scrape-droit"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Credentials */}
              <Card className="bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-primary" />
                    Identifiants droitdusport.com
                  </CardTitle>
                  <CardDescription>
                    Vos identifiants pour le site droitdusport.com
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Nom d'utilisateur</Label>
                      <Input
                        id="username"
                        value={config.username}
                        onChange={(e) => setConfig({ ...config, username: e.target.value })}
                        placeholder="votre@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Mot de passe</Label>
                      <Input
                        id="password"
                        type="password"
                        value={config.password}
                        onChange={(e) => setConfig({ ...config, password: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Button onClick={saveConfig} variant="outline">
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
                <Button onClick={testConnection} disabled={isTesting} variant="secondary">
                  {isTesting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : testStatus === "success" ? (
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  ) : testStatus === "error" ? (
                    <XCircle className="h-4 w-4 mr-2 text-red-500" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Tester la connexion
                </Button>
              </div>

              {/* Test Scrape */}
              <Card className="bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-primary" />
                    Tester le scraping
                  </CardTitle>
                  <CardDescription>
                    Lancez un test de scraping avec un mot-clé
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="Mot-clé de recherche..."
                      className="flex-1"
                    />
                    <Button onClick={runScrape} disabled={isScraping}>
                      {isScraping ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Lancer
                    </Button>
                  </div>

                  {/* Results */}
                  {scrapeResult && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {scrapeResult.items?.length || 0} résultats
                        </Badge>
                      </div>
                      <div className="max-h-96 overflow-auto rounded-lg border border-border bg-secondary/30">
                        {scrapeResult.items?.map((item, index) => (
                          <div key={index} className="p-3 border-b border-border last:border-b-0">
                            {item.title && (
                              <h4 className="font-medium text-sm text-foreground">{item.title}</h4>
                            )}
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              {item.url}
                            </a>
                            {item.error ? (
                              <p className="text-xs text-destructive mt-1">{item.error}</p>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {item.text?.substring(0, 200)}...
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card className="bg-secondary/30 border-dashed">
                <CardHeader>
                  <CardTitle className="text-base">Instructions de déploiement</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-3">
                  <p>1. Copiez votre script Python sur le VPS</p>
                  <p>2. Installez les dépendances :</p>
                  <pre className="bg-card p-2 rounded text-xs overflow-x-auto border border-border">
                    pip install flask flask-cors playwright{"\n"}
                    playwright install chromium
                  </pre>
                  <p>3. Créez l'API Flask (api_scraper.py) et lancez-la :</p>
                  <pre className="bg-card p-2 rounded text-xs overflow-x-auto border border-border">
                    python api_scraper.py
                  </pre>
                  <p>4. Configurez PM2 pour la persistence :</p>
                  <pre className="bg-card p-2 rounded text-xs overflow-x-auto border border-border">
                    pm2 start api_scraper.py --interpreter python3{"\n"}
                    pm2 save
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default ScraperConfigPage;
