import { useState } from "react";
import { ImageDropzone } from "@/components/ImageDropzone";
import { CreditsDisplay } from "@/components/CreditsDisplay";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [optimizedImageUrl, setOptimizedImageUrl] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [credits] = useState(1);

  const handleOptimize = async () => {
    if (!selectedFile) {
      toast.error("Por favor, selecione uma imagem primeiro");
      return;
    }

    setIsOptimizing(true);
    setOptimizationProgress(0);

    try {
      // Start progress animation
      const interval = setInterval(() => {
        setOptimizationProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(
        'https://rugkunwrkoknqiquykqo.supabase.co/functions/v1/optimize-image',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao otimizar imagem');
      }

      const data = await response.json();
      setOptimizationProgress(100);
      setOptimizedImageUrl(data.optimizedUrl);
      toast.success("Imagem otimizada com sucesso!");
    } catch (error) {
      console.error('Optimization error:', error);
      toast.error(error instanceof Error ? error.message : "Erro ao otimizar imagem. Tente novamente.");
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Otimizador de Imagens</h1>
          <p className="text-muted-foreground">
            Otimize suas imagens com apenas alguns cliques
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <ImageDropzone onImageSelect={setSelectedFile} />
            
            {isOptimizing && (
              <div className="space-y-2">
                <Progress value={optimizationProgress} />
                <p className="text-sm text-muted-foreground text-center">
                  Otimizando sua imagem...
                </p>
              </div>
            )}
            
            <div className="flex justify-end space-x-4">
              <Button
                size="lg"
                onClick={handleOptimize}
                disabled={!selectedFile || isOptimizing || credits < 1}
              >
                {isOptimizing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isOptimizing ? "Otimizando..." : "Otimizar Imagem"}
              </Button>
              
              {optimizedImageUrl && (
                <Button size="lg" variant="outline" asChild>
                  <a href={optimizedImageUrl} download>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <CreditsDisplay credits={credits} />
            {credits < 1 && (
              <div className="rounded-lg border bg-card p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Seus créditos acabaram
                </p>
                <Button variant="outline" size="sm">
                  Comprar Créditos
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;