import { useState } from "react";
import { Briefcase, Search, MapPin, Building2, Calendar, ExternalLink, Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface JobOffer {
  id: string;
  intitule: string;
  description?: string;
  entreprise?: {
    nom?: string;
    description?: string;
  };
  lieuTravail?: {
    libelle?: string;
    commune?: string;
  };
  typeContrat?: string;
  typeContratLibelle?: string;
  experienceLibelle?: string;
  salaire?: {
    libelle?: string;
  };
  dateCreation?: string;
  origineOffre?: {
    urlOrigine?: string;
  };
}

const LOCATIONS = [
  { value: "75", label: "Paris (75)" },
  { value: "92", label: "Hauts-de-Seine (92)" },
  { value: "93", label: "Seine-Saint-Denis (93)" },
  { value: "94", label: "Val-de-Marne (94)" },
  { value: "69", label: "Rhône (69)" },
  { value: "13", label: "Bouches-du-Rhône (13)" },
  { value: "31", label: "Haute-Garonne (31)" },
  { value: "33", label: "Gironde (33)" },
  { value: "59", label: "Nord (59)" },
  { value: "44", label: "Loire-Atlantique (44)" },
];

const Emploi = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [departement, setDepartement] = useState("75");
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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

  const searchJobs = async () => {
    if (!searchQuery.trim()) {
      toast.error("Veuillez entrer un mot-clé de recherche");
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/france-travail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          query: searchQuery,
          departement: departement,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setJobs(data.resultats || []);
      
      if (data.resultats?.length === 0) {
        toast.info("Aucune offre trouvée pour cette recherche");
      } else {
        toast.success(`${data.resultats.length} offre(s) trouvée(s)`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error("Erreur lors de la recherche d'emploi");
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getContractBadgeColor = (type?: string) => {
    switch (type) {
      case 'CDI': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'CDD': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'MIS': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        <AppSidebar 
          selectedCategories={selectedCategories}
          onCategoryToggle={toggleCategory}
          onClearCategories={clearCategories}
        />
        
        <main className="flex-1 flex flex-col bg-secondary/30">
          <header className="md:hidden border-b border-border bg-card sticky top-0 z-10 p-3">
            <SidebarTrigger />
          </header>
          
          <div className="flex-1 p-6 overflow-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-primary-sm">
                  <Briefcase className="h-5 w-5 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-semibold text-foreground">Offres d'emploi</h1>
              </div>
              <p className="text-muted-foreground text-sm">Recherchez des offres via France Travail</p>
            </div>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un emploi (ex: juriste, avocat, développeur...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchJobs()}
                  className="pl-10"
                />
              </div>
              
              <Select value={departement} onValueChange={setDepartement}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Département" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((loc) => (
                    <SelectItem key={loc.value} value={loc.value}>
                      {loc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={searchJobs} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Rechercher
                  </>
                )}
              </Button>
            </div>

            {/* Results */}
            {!hasSearched ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-medium text-foreground mb-2">Recherchez des offres</h2>
                <p className="text-muted-foreground text-sm max-w-md">
                  Entrez un mot-clé et sélectionnez un département pour trouver des offres d'emploi
                </p>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Briefcase className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-medium text-foreground mb-2">Aucune offre trouvée</h2>
                <p className="text-muted-foreground text-sm">Essayez avec d'autres mots-clés ou un autre département</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {jobs.map((job) => (
                  <Card key={job.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-lg leading-tight">{job.intitule}</CardTitle>
                          {job.entreprise?.nom && (
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <Building2 className="h-3 w-3" />
                              {job.entreprise.nom}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {job.typeContrat && (
                            <Badge variant="outline" className={getContractBadgeColor(job.typeContrat)}>
                              {job.typeContratLibelle || job.typeContrat}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                        {job.lieuTravail?.libelle && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.lieuTravail.libelle}
                          </span>
                        )}
                        {job.dateCreation && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(job.dateCreation)}
                          </span>
                        )}
                        {job.salaire?.libelle && (
                          <span className="text-primary font-medium">
                            {job.salaire.libelle}
                          </span>
                        )}
                      </div>
                      
                      {job.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                          {job.description}
                        </p>
                      )}

                      {job.experienceLibelle && (
                        <Badge variant="secondary" className="text-xs">
                          {job.experienceLibelle}
                        </Badge>
                      )}

                      {job.origineOffre?.urlOrigine && (
                        <div className="mt-4 pt-3 border-t border-border">
                          <a
                            href={job.origineOffre.urlOrigine}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            Voir l'offre complète
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Emploi;
