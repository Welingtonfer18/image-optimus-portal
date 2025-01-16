import { useState } from "react";
import { ImageDropzone } from "@/components/ImageDropzone";
import { CreditsDisplay } from "@/components/CreditsDisplay";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [optimizedImageUrl, setOptimizedImageUrl] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [credits] = useState(5); // This would come from your backend

  const handleOptimize = async () => {
    if (!selectedFile) return;
    
    setIsOptimizing(true);
    // Here you would call your optimization API
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated delay
    setOptimizedImageUrl(URL.createObjectURL(selectedFile));
    setIsOptimizing(false);
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Image Optimizer</h1>
          <p className="text-muted-foreground">
            Optimize your images with just a few clicks
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <ImageDropzone onImageSelect={setSelectedFile} />
            
            <div className="flex justify-end space-x-4">
              <Button
                size="lg"
                onClick={handleOptimize}
                disabled={!selectedFile || isOptimizing}
              >
                {isOptimizing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isOptimizing ? "Optimizing..." : "Optimize Image"}
              </Button>
              
              {optimizedImageUrl && (
                <Button size="lg" variant="outline" asChild>
                  <a href={optimizedImageUrl} download>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <CreditsDisplay credits={credits} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;