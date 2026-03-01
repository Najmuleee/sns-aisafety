import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function RegisterFaces() {
  const [, setLocation] = useLocation();
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    const newImages: string[] = [];
    for (let i = 0; i < Math.min(files.length, 10 - uploadedImages.length); i++) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newImages.push(event.target.result as string);
          if (newImages.length === files.length) {
            setUploadedImages([...uploadedImages, ...newImages]);
          }
        }
      };
      reader.readAsDataURL(files[i]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const handleRegister = async () => {
    if (uploadedImages.length === 0) {
      setMessage({ type: "error", text: "Please upload at least one face image" });
      return;
    }

    setIsProcessing(true);
    try {
      // TODO: Call API to register faces
      setMessage({ type: "success", text: "Face profiles registered successfully!" });
      setTimeout(() => setLocation("/dashboard"), 2000);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to register faces" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Register Your Face Profiles</h1>
            <p className="text-muted-foreground">
              Upload 5-10 clear face images for identity recognition
            </p>
          </div>

          {message && (
            <Alert className="mb-6" variant={message.type === "error" ? "destructive" : "default"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Upload Face Images</CardTitle>
              <CardDescription>
                Upload clear, front-facing photos of your face. Recommended: 5-10 images with
                different lighting and angles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-border rounded-lg p-8">
                <label className="cursor-pointer">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div className="text-center">
                      <p className="font-medium">Click to upload or drag and drop</p>
                      <p className="text-sm text-muted-foreground">PNG, JPG up to 10MB</p>
                    </div>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadedImages.length >= 10}
                  />
                </label>
              </div>

              {/* Uploaded Images */}
              {uploadedImages.length > 0 && (
                <div>
                  <h3 className="font-medium mb-4">
                    Uploaded Images ({uploadedImages.length}/10)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Face ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleRegister}
                  disabled={uploadedImages.length === 0 || isProcessing}
                  size="lg"
                >
                  {isProcessing ? "Processing..." : "Register Faces"}
                </Button>
                <Button variant="outline" onClick={() => setLocation("/dashboard")}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
