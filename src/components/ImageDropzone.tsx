import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageDropzoneProps {
  onImageSelect: (file: File) => void;
}

export function ImageDropzone({ onImageSelect }: ImageDropzoneProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageSelect(file);
    }
  }, [onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative cursor-pointer rounded-lg border-2 border-dashed p-12 transition-colors",
        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
        preview ? "bg-muted/25" : "bg-background"
      )}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        {preview ? (
          <>
            <img
              src={preview}
              alt="Preview"
              className="max-h-48 w-auto rounded-lg object-contain"
            />
            <p className="text-sm text-muted-foreground">
              Click or drag to choose a different image
            </p>
          </>
        ) : (
          <>
            {isDragActive ? (
              <Upload className="h-12 w-12 text-primary animate-pulse" />
            ) : (
              <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
            )}
            <div className="space-y-2">
              <p className="text-xl font-medium">Drop your image here</p>
              <p className="text-sm text-muted-foreground">
                or click to select a file
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Supports: JPEG, PNG, WebP (max 5MB)
            </p>
          </>
        )}
      </div>
    </div>
  );
}