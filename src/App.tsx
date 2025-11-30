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
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

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
              element={
                <PrivateRoute>
                  <Index />
                </PrivateRoute>
              }
            />
            <Route
              path="/sites"
              element={
                <PrivateRoute>
                  <Sites />
                </PrivateRoute>
              }
            />
            <Route
              path="/emploi"
              element={
                <PrivateRoute>
                  <Emploi />
                </PrivateRoute>
              }
            />
            <Route
              path="/actualites"
              element={
                <PrivateRoute>
                  <Actualites />
                </PrivateRoute>
              }
            />
            <Route
              path="/bibliotheque"
              element={
                <PrivateRoute>
                  <Bibliotheque />
                </PrivateRoute>
              }
            />
            <Route
              path="/playwright"
              element={
                <PrivateRoute>
                  <Playwright />
                </PrivateRoute>
              }
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
