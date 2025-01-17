import { useState } from "react";
import { ImageDropzone } from "@/components/ImageDropzone";
import { CreditsDisplay } from "@/components/CreditsDisplay";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import imageCompression from "browser-image-compression";

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
      // Verificar se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Configurações de compressão
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        onProgress: (progress: number) => {
          setOptimizationProgress(progress);
        },
      };

      // Comprimir a imagem
      const compressedFile = await imageCompression(selectedFile, options);
      
      // Calcular estatísticas
      const originalSize = selectedFile.size;
      const optimizedSize = compressedFile.size;
      const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);

      // Upload da imagem original
      const fileName = selectedFile.name.replace(/[^\x00-\x7F]/g, '');
      const fileExt = fileName.split('.').pop() || 'jpg';
      const originalPath = `original/${crypto.randomUUID()}.${fileExt}`;
      const optimizedPath = `optimized/${crypto.randomUUID()}.${fileExt}`;

      // Upload da imagem original
      const { error: originalUploadError } = await supabase.storage
        .from('images')
        .upload(originalPath, selectedFile, {
          contentType: selectedFile.type,
          upsert: false
        });

      if (originalUploadError) {
        throw originalUploadError;
      }

      // Upload da imagem otimizada
      const { error: optimizedUploadError } = await supabase.storage
        .from('images')
        .upload(optimizedPath, compressedFile, {
          contentType: compressedFile.type,
          upsert: false
        });

      if (optimizedUploadError) {
        throw optimizedUploadError;
      }

      // Obter URL pública da imagem otimizada
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(optimizedPath);

      setOptimizedImageUrl(publicUrl);
      setOptimizationStats({
        originalSize,
        optimizedSize,
        compressionRatio,
      });

      // Salvar metadados
      await supabase.from('images').insert({
        user_id: user.id,
        original_filename: fileName,
        original_path: originalPath,
        optimized_path: optimizedPath,
        content_type: compressedFile.type,
        optimized_at: new Date().toISOString(),
        original_size: originalSize,
        optimized_size: optimizedSize,
      });

      toast.success("Imagem otimizada com sucesso!");
    } catch (error) {
      console.error('Optimization error:', error);
      toast.error("Erro ao otimizar imagem. Tente novamente.");
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