import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Play, Settings, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface LoginResult {
  success: boolean;
  cookies?: Array<{ name: string; value: string; domain: string }>;
  content?: string;
  error?: string;
}

// Change this to your VPS IP
const PLAYWRIGHT_API_URL = "http://170.39.216.138/api/playwright";

export function PlaywrightLogin() {
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameSelector, setUsernameSelector] = useState('input[name="email"]');
  const [passwordSelector, setPasswordSelector] = useState('input[name="password"]');
  const [submitSelector, setSubmitSelector] = useState('button[type="submit"]');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LoginResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleLogin = async () => {
    if (!url || !username || !password) {
      toast.error("Remplis l'URL, l'email et le mot de passe");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${PLAYWRIGHT_API_URL}/auto-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          username,
          password,
          usernameSelector,
          passwordSelector,
          submitSelector,
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        toast.success("Connexion réussie !");
      } else {
        toast.error(`Échec: ${data.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      setResult({ success: false, error: errorMessage });
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5 text-primary" />
          Auto-Login Playwright
        </CardTitle>
        <CardDescription>
          Connecte-toi automatiquement à un site pour récupérer les cookies de session
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="url">URL de connexion</Label>
          <Input
            id="url"
            placeholder="https://example.com/login"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="username">Email / Username</Label>
            <Input
              id="username"
              type="email"
              placeholder="ton@email.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              Sélecteurs CSS avancés
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="usernameSelector">Sélecteur du champ email</Label>
              <Input
                id="usernameSelector"
                placeholder='input[name="email"]'
                value={usernameSelector}
                onChange={(e) => setUsernameSelector(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordSelector">Sélecteur du champ mot de passe</Label>
              <Input
                id="passwordSelector"
                placeholder='input[name="password"]'
                value={passwordSelector}
                onChange={(e) => setPasswordSelector(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="submitSelector">Sélecteur du bouton submit</Label>
              <Input
                id="submitSelector"
                placeholder='button[type="submit"]'
                value={submitSelector}
                onChange={(e) => setSubmitSelector(e.target.value)}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Button 
          onClick={handleLogin} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connexion en cours...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Lancer l'auto-login
            </>
          )}
        </Button>

        {result && (
          <div className={`p-4 rounded-lg border ${result.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                {result.success ? "Connexion réussie" : "Échec de connexion"}
              </span>
            </div>
            
            {result.error && (
              <p className="text-sm text-red-400">{result.error}</p>
            )}
            
            {result.cookies && result.cookies.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium mb-2">Cookies récupérés ({result.cookies.length}) :</p>
                <div className="max-h-32 overflow-y-auto text-xs bg-background/50 p-2 rounded">
                  {result.cookies.map((cookie, i) => (
                    <div key={i} className="truncate">
                      <span className="text-primary">{cookie.name}</span>: {cookie.value.substring(0, 30)}...
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
