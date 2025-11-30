import { useMemo, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { Search, ChevronDown } from "lucide-react";

const Index = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [depth, setDepth] = useState<1 | 2 | 3>(1);
  const [geminiEnabled, setGeminiEnabled] = useState(true);

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

  const depthOptions = useMemo(
    () => [
      { id: 1 as const, label: "1 Base", description: "Page principale uniquement" },
      { id: 2 as const, label: "2 Annexes", description: "Inclut les pages liées" },
      { id: 3 as const, label: "3 Complet", description: "Explore toutes les pages détectées" },
    ],
    []
  );

  const categoryOptions = [
    { id: "droit", label: "Droit" },
    { id: "federation", label: "Fédération" },
    { id: "finance", label: "Finance" },
    { id: "generaliste", label: "Généraliste" },
    { id: "presse", label: "Presse" },
    { id: "sport", label: "Sport" },
    { id: "syndicat", label: "Syndicat" },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-b from-[#f4f8fd] via-[#eef3fb] to-[#e6eef9] flex w-full">
        <AppSidebar
          selectedCategories={selectedCategories}
          onCategoryToggle={toggleCategory}
          onClearCategories={clearCategories}
        />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-3xl mx-auto text-center space-y-8">
            <div className="space-y-3">
              <p className="text-3xl md:text-4xl font-bold text-[#1f67d2] tracking-tight">
                Bienvenue ENZO
              </p>
              <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-[#d8e2f3] rounded-full px-4 py-3 shadow-sm">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Faites votre prompt..."
                  className="border-0 shadow-none focus-visible:ring-0 text-base"
                />
              </div>
            </div>

            <Card className="bg-white/90 border-[#d8e2f3] shadow-lg rounded-3xl p-6 space-y-5 text-left">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-lg font-medium text-foreground">Profondeur d’analyse</p>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="space-y-3">
                  {depthOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setDepth(opt.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition ${
                        depth === opt.id
                          ? "bg-[#1f67d2] text-white border-[#1f67d2]"
                          : "bg-white text-foreground border-[#d8e2f3] hover:border-[#1f67d2]"
                      }`}
                    >
                      <div className="text-base font-semibold">{opt.label}</div>
                      <div className={`text-sm ${depth === opt.id ? "text-white/90" : "text-muted-foreground"}`}>
                        {opt.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-medium text-foreground">Catégories</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        {selectedCategories.length > 0
                          ? `${selectedCategories.length} sélectionnée${selectedCategories.length > 1 ? "s" : ""}`
                          : "Sélectionnez des catégories..."}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      {categoryOptions.map((cat) => (
                        <DropdownMenuCheckboxItem
                          key={cat.id}
                          checked={selectedCategories.includes(cat.id)}
                          onCheckedChange={() => toggleCategory(cat.id)}
                        >
                          {cat.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((cat) => {
                    const meta = categoryOptions.find((c) => c.id === cat);
                    return (
                      <Button
                        key={cat}
                        variant="ghost"
                        size="sm"
                        className="bg-[#eef3fb] text-[#1f67d2] hover:bg-[#dce8fa]"
                        onClick={() => toggleCategory(cat)}
                      >
                        {meta?.label || cat}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Switch checked={geminiEnabled} onCheckedChange={setGeminiEnabled} />
                  <span className="text-sm text-foreground">Reformuler via Gemini</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Profondeur: {depthOptions.find((o) => o.id === depth)?.label}
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span>À propos</span>
              <span>Services</span>
              <span>Contact</span>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
