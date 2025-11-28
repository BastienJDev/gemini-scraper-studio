import { useState } from "react";
import { Zap, List, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { ChatInterface } from "@/components/ChatInterface";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "droit", label: "DROIT", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { id: "federation", label: "FEDERATION", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { id: "finance", label: "Finance", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { id: "generaliste", label: "Generaliste", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { id: "presse", label: "PRESSE", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  { id: "sport", label: "Sport", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { id: "syndicat", label: "Syndicat", color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
];

const Index = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex flex-col">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center glow-primary-sm">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-foreground">ScrapAI</h1>
                <p className="text-[10px] text-muted-foreground">Recherche sur vos sites</p>
              </div>
            </div>

            {/* Center - Category Filter */}
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
                    <Filter className="h-3.5 w-3.5" />
                    Catégories
                    {selectedCategories.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px] bg-primary/20 text-primary">
                        {selectedCategories.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="center">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Filtrer par catégorie</p>
                    <p className="text-xs text-muted-foreground">
                      Gemini cherchera uniquement dans les sites de ces catégories
                    </p>
                    <div className="space-y-2">
                      {CATEGORIES.map((category) => (
                        <label
                          key={category.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-secondary/30 rounded-md p-1.5 -mx-1.5"
                        >
                          <Checkbox
                            checked={selectedCategories.includes(category.id)}
                            onCheckedChange={() => toggleCategory(category.id)}
                          />
                          <Badge variant="outline" className={cn("text-xs", category.color)}>
                            {category.label}
                          </Badge>
                        </label>
                      ))}
                    </div>
                    {selectedCategories.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => setSelectedCategories([])}
                      >
                        Tout désélectionner
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Selected categories badges */}
              {selectedCategories.length > 0 && (
                <div className="hidden sm:flex items-center gap-1">
                  {selectedCategories.slice(0, 3).map((catId) => {
                    const cat = CATEGORIES.find((c) => c.id === catId);
                    return cat ? (
                      <Badge key={catId} variant="outline" className={cn("text-[10px]", cat.color)}>
                        {cat.label}
                      </Badge>
                    ) : null;
                  })}
                  {selectedCategories.length > 3 && (
                    <Badge variant="secondary" className="text-[10px]">
                      +{selectedCategories.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Right - Navigation */}
            <div className="flex items-center gap-2">
              <Link to="/sites">
                <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground hover:text-foreground">
                  <List className="h-3.5 w-3.5" />
                  Ma Liste
                </Button>
              </Link>
              <span className="px-2 py-1 rounded-md bg-primary/10 text-primary font-medium text-[10px]">
                Gemini 2.5 Flash
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Full Screen Chat */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <ChatInterface selectedCategories={selectedCategories} />
      </main>
    </div>
  );
};

export default Index;
