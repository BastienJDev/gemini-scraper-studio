import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Sites from "./pages/Sites";
import Emploi from "./pages/Emploi";
import Actualites from "./pages/Actualites";
import Bibliotheque from "./pages/Bibliotheque";
import NotFound from "./pages/NotFound";
import Playwright from "./pages/Playwright";
import Login from "./pages/Login";
import { AuthProvider } from "./auth/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={<Index />}
            />
            <Route
              path="/sites"
              element={<Sites />}
            />
            <Route
              path="/emploi"
              element={<Emploi />}
            />
            <Route
              path="/actualites"
              element={<Actualites />}
            />
            <Route
              path="/bibliotheque"
              element={<Bibliotheque />}
            />
            <Route
              path="/playwright"
              element={<Playwright />}
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
