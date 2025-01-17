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
  const [optimizationStats, setOptimizationStats] = useState<{
    originalSize: number;
    optimizedSize: number;
    compressionRatio: string;
  } | null>(null);

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

      const { data, error } = await supabase.functions.invoke('optimize-image', {
        body: formData,
      });

      if (error) {
        throw error;
      }

      setOptimizationProgress(100);
      setOptimizedImageUrl(data.optimizedUrl);
      setOptimizationStats({
        originalSize: data.originalSize,
        optimizedSize: data.optimizedSize,
        compressionRatio: data.compressionRatio,
      });
      toast.success("Imagem otimizada com sucesso!");
    } catch (error) {
      console.error('Optimization error:', error);
      toast.error(error instanceof Error ? error.message : "Erro ao otimizar imagem. Tente novamente.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleDownload = async () => {
    if (!optimizedImageUrl) return;
    
    try {
      const response = await fetch(optimizedImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `optimized-${selectedFile?.name || 'image.jpg'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Erro ao baixar a imagem. Tente novamente.");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

            {optimizationStats && (
              <div className="rounded-lg border bg-card p-4 space-y-2">
                <h3 className="font-medium">Resultados da Otimização</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Tamanho Original</p>
                    <p className="font-medium">{formatBytes(optimizationStats.originalSize)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tamanho Otimizado</p>
                    <p className="font-medium">{formatBytes(optimizationStats.optimizedSize)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Taxa de Compressão</p>
                    <p className="font-medium">{optimizationStats.compressionRatio}%</p>
                  </div>
                </div>
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
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={handleDownload}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar
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