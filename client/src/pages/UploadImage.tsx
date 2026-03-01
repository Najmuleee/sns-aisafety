import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

interface DetectedFace {
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

export default function UploadImage() {
  const [, setLocation] = useLocation();
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploadId, setUploadId] = useState<number | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImage(event.target.result as string);
        setDetectedFaces([]);
        setUploadId(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDetectFaces = async () => {
    if (!image) {
      setMessage({ type: "error", text: "Please upload an image first" });
      return;
    }

    setIsProcessing(true);
    try {
      // TODO: Call API to detect faces
      setDetectedFaces([
        {
          bbox: { x: 50, y: 50, width: 100, height: 120 },
          confidence: 0.95,
        },
      ]);
      setMessage({ type: "success", text: "Faces detected successfully" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to detect faces" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublish = async () => {
    if (!image || detectedFaces.length === 0) {
      setMessage({ type: "error", text: "Please upload and detect faces first" });
      return;
    }

    setIsProcessing(true);
    try {
      // TODO: Call API to publish image
      setUploadId(1);
      setMessage({ type: "success", text: "Image uploaded successfully!" });
      setTimeout(() => setLocation(`/upload/${1}`), 2000);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to upload image" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Upload Image</h1>
            <p className="text-muted-foreground">
              Share a photo with automatic face detection and consent management
            </p>
          </div>

          {message && (
            <Alert className="mb-6" variant={message.type === "error" ? "destructive" : "default"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Select Image</CardTitle>
                <CardDescription>Upload a group photo to share</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {image ? (
                  <div className="relative">
                    <img
                      src={image}
                      alt="Uploaded"
                      className="w-full rounded-lg border border-border"
                    />
                    <button
                      onClick={() => {
                        setImage(null);
                        setDetectedFaces([]);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div className="text-center">
                        <p className="font-medium">Click to upload</p>
                        <p className="text-sm text-muted-foreground">PNG, JPG up to 20MB</p>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </CardContent>
            </Card>

            {/* Image Details */}
            <Card>
              <CardHeader>
                <CardTitle>Image Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Caption (Optional)</label>
                  <Textarea
                    placeholder="Add a caption to your image..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="mt-2"
                  />
                </div>

                {detectedFaces.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      {detectedFaces.length} face(s) detected
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Button
                    onClick={handleDetectFaces}
                    disabled={!image || isProcessing}
                    variant="outline"
                    className="w-full"
                  >
                    {isProcessing ? "Detecting..." : "Detect Faces"}
                  </Button>
                  <Button
                    onClick={handlePublish}
                    disabled={!image || detectedFaces.length === 0 || isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? "Publishing..." : "Publish Image"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/dashboard")}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
