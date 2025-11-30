import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Lock, Mail } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const ok = login(email, password);
    if (!ok) {
      setError("Identifiants invalides. Vérifie l'email et le mot de passe.");
      setLoading(false);
      return;
    }

    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#eaf5ff] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-200">
            <ShieldCheck className="h-6 w-6 text-[#2f80ed]" />
          </div>
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-800">Connexion</h1>
          <p className="text-sm text-slate-600">Identifie-toi avec email et mot de passe.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2 text-left">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#2f80ed]" />
              Email
            </label>
            <Input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white"
            />
          </div>

          <div className="space-y-2 text-left">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#2f80ed]" />
              Mot de passe
            </label>
            <Input
              type="password"
              placeholder="Votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-white"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <Button
            type="submit"
            className="w-full bg-[#2f80ed] hover:bg-[#2b74d6]"
            disabled={loading}
          >
            {loading ? "Vérification..." : "Se connecter"}
          </Button>
        </form>

        <p className="text-xs text-slate-500">
          Identifiants stockés pour l'instant dans `src/data/users.json` (ex. admin@vyzion.local / changeme123).
        </p>
      </div>
    </div>
  );
};

export default Login;
