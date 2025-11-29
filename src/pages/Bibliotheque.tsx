import { useState, useEffect, useRef } from "react";
import { FileText, Upload, Trash2, Eye, X, Loader2, FileUp } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PdfDocument {
  id: string;
  name: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
}

const Bibliotheque = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [pdfs, setPdfs] = useState<PdfDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingPdf, setViewingPdf] = useState<PdfDocument | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Fetch PDFs on mount
  useEffect(() => {
    fetchPdfs();
  }, []);

  const fetchPdfs = async () => {
    try {
      const { data, error } = await supabase
        .from('pdf_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPdfs(data || []);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
      toast.error("Erreur lors du chargement des PDFs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error("Seuls les fichiers PDF sont acceptés");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Le fichier ne doit pas dépasser 20 Mo");
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique file path
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = fileName;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('pdf_documents')
        .insert({
          name: file.name,
          file_path: filePath,
          file_size: file.size,
        });

      if (dbError) throw dbError;

      toast.success("PDF importé avec succès");
      fetchPdfs();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Erreur lors de l'import du PDF");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const deletePdf = async (pdf: PdfDocument) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('pdfs')
        .remove([pdf.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('pdf_documents')
        .delete()
        .eq('id', pdf.id);

      if (dbError) throw dbError;

      toast.success("PDF supprimé");
      setPdfs(pdfs.filter(p => p.id !== pdf.id));
    } catch (error) {
      console.error('Delete error:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const viewPdf = async (pdf: PdfDocument) => {
    try {
      const { data } = supabase.storage
        .from('pdfs')
        .getPublicUrl(pdf.file_path);

      setPdfUrl(data.publicUrl);
      setViewingPdf(pdf);
    } catch (error) {
      console.error('Error getting PDF URL:', error);
      toast.error("Erreur lors de l'ouverture du PDF");
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-primary-sm">
                  <FileText className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-foreground">Bibliothèque PDF</h1>
                  <p className="text-muted-foreground text-sm">{pdfs.length} document(s)</p>
                </div>
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Importer un PDF
                </Button>
              </div>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pdfs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div 
                  className="w-24 h-24 rounded-2xl bg-muted flex items-center justify-center mb-4 cursor-pointer hover:bg-muted/80 transition-colors border-2 border-dashed border-border"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUp className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-medium text-foreground mb-2">Aucun PDF</h2>
                <p className="text-muted-foreground text-sm max-w-md mb-4">
                  Importez vos documents PDF pour les consulter facilement
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importer votre premier PDF
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pdfs.map((pdf) => (
                  <Card 
                    key={pdf.id} 
                    className="hover:border-primary/50 transition-colors group"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-6 w-6 text-destructive" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate" title={pdf.name}>
                            {pdf.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatFileSize(pdf.file_size)} • {formatDate(pdf.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => viewPdf(pdf)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Voir
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deletePdf(pdf)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* PDF Viewer Dialog */}
        <Dialog open={!!viewingPdf} onOpenChange={(open) => !open && setViewingPdf(null)}>
          <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle className="truncate pr-8">{viewingPdf?.name}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              {pdfUrl && (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-0"
                  title={viewingPdf?.name}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
};

export default Bibliotheque;
