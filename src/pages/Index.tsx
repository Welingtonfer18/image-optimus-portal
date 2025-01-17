import { useState } from "react";
import { ImageDropzone } from "@/components/ImageDropzone";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import imageCompression from "browser-image-compression";

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [optimizedImageUrl, setOptimizedImageUrl] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [optimizationStats, setOptimizationStats] = useState<{
    originalSize: number;
    optimizedSize: number;
    compressionRatio: string;
  } | null>(null);

  const handleOptimize = async () => {
    if (!selectedFile) {
      toast.error("Por favor, selecione uma imagem primeiro", {
        position: "bottom-center",
      });
      return;
    }

    setIsOptimizing(true);
    setOptimizationProgress(0);

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        onProgress: (progress: number) => {
          setOptimizationProgress(progress);
        },
      };

      const compressedFile = await imageCompression(selectedFile, options);
      
      const originalSize = selectedFile.size;
      const optimizedSize = compressedFile.size;
      const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);

      const fileName = selectedFile.name.replace(/[^\x00-\x7F]/g, '');
      const fileExt = fileName.split('.').pop() || 'jpg';
      const originalPath = `original/${crypto.randomUUID()}.${fileExt}`;
      const optimizedPath = `optimized/${crypto.randomUUID()}.${fileExt}`;

      const { error: originalUploadError } = await supabase.storage
        .from('images')
        .upload(originalPath, selectedFile, {
          contentType: selectedFile.type,
          upsert: false
        });

      if (originalUploadError) {
        throw originalUploadError;
      }

      const { error: optimizedUploadError } = await supabase.storage
        .from('images')
        .upload(optimizedPath, compressedFile, {
          contentType: compressedFile.type,
          upsert: false
        });

      if (optimizedUploadError) {
        throw optimizedUploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(optimizedPath);

      setOptimizedImageUrl(publicUrl);
      setOptimizationStats({
        originalSize,
        optimizedSize,
        compressionRatio,
      });

      await supabase.from('images').insert({
        original_filename: fileName,
        original_path: originalPath,
        optimized_path: optimizedPath,
        content_type: compressedFile.type,
        optimized_at: new Date().toISOString(),
        original_size: originalSize,
        optimized_size: optimizedSize,
      });

      toast.success("Imagem otimizada com sucesso!", {
        position: "bottom-center",
        icon: <Sparkles className="h-4 w-4" />,
      });
    } catch (error) {
      console.error('Optimization error:', error);
      toast.error("Erro ao otimizar imagem. Tente novamente.", {
        position: "bottom-center",
      });
    } finally {
      setIsOptimizing(false);
      setOptimizationProgress(100);
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
      
      toast.success("Download concluído!", {
        position: "bottom-center",
        icon: <Download className="h-4 w-4" />,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Erro ao baixar a imagem. Tente novamente.", {
        position: "bottom-center",
      });
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6 md:p-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            ImageOptimizer Pro
          </h1>
          <p className="text-muted-foreground text-lg">
            Otimize suas imagens instantaneamente mantendo a qualidade
          </p>
        </div>

        <div className="grid gap-8">
          <div className="space-y-8">
            <ImageDropzone onImageSelect={setSelectedFile} />
            
            {isOptimizing && (
              <div className="space-y-2">
                <Progress value={optimizationProgress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center animate-pulse">
                  Otimizando sua imagem...
                </p>
              </div>
            )}

            {optimizationStats && (
              <div className="rounded-lg border bg-card/50 backdrop-blur-sm p-6 space-y-4">
                <h3 className="font-semibold text-lg">Resultados da Otimização</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-muted-foreground">Tamanho Original</p>
                    <p className="font-medium text-lg">{formatBytes(optimizationStats.originalSize)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-muted-foreground">Tamanho Otimizado</p>
                    <p className="font-medium text-lg">{formatBytes(optimizationStats.optimizedSize)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-muted-foreground">Taxa de Compressão</p>
                    <p className="font-medium text-lg">{optimizationStats.compressionRatio}%</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                size="lg"
                onClick={handleOptimize}
                disabled={!selectedFile || isOptimizing}
                className="w-full sm:w-auto"
              >
                {isOptimizing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Otimizando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Otimizar Imagem
                  </>
                )}
              </Button>
              
              {optimizedImageUrl && (
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={handleDownload}
                  className="w-full sm:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Imagem Otimizada
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;