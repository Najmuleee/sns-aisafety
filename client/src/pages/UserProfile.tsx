import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Image,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Share2,
  Trash2,
  Eye,
  Calendar,
} from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

interface Upload {
  id: number;
  uploaderId: number;
  originalImagePath: string;
  finalImagePath?: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  caption?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface HistoryEvent {
  id: number;
  eventType: string;
  userId?: number | null;
  metadata?: unknown;
  timestamp: Date;
}

export default function UserProfile() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedUpload, setSelectedUpload] = useState<Upload | null>(null);

  // Fetch user stats
  const { data: stats, isLoading: statsLoading } = trpc.profile.getStats.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Fetch user uploads
  const { data: uploads, isLoading: uploadsLoading } = trpc.profile.getUploads.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated }
  );

  // Fetch processing history
  const { data: history, isLoading: historyLoading } = trpc.profile.getHistory.useQuery(
    { limit: 100 },
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please log in to view your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "processing":
        return <Badge className="bg-blue-500">Processing</Badge>;
      case "failed":
        return <Badge className="bg-red-500">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "upload_created":
        return <Image className="h-4 w-4" />;
      case "face_detected":
        return <Eye className="h-4 w-4" />;
      case "consent_request_created":
        return <AlertCircle className="h-4 w-4" />;
      case "consent_approved":
        return <CheckCircle2 className="h-4 w-4" />;
      case "image_rendered":
        return <Image className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{user?.name || "User Profile"}</h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" onClick={() => setLocation("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Uploads</CardTitle>
                <Image className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completed}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.failed}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="uploads" className="w-full">
          <TabsList>
            <TabsTrigger value="uploads">Image Gallery</TabsTrigger>
            <TabsTrigger value="history">Processing History</TabsTrigger>
          </TabsList>

          {/* Image Gallery Tab */}
          <TabsContent value="uploads">
            <Card>
              <CardHeader>
                <CardTitle>Your Uploads</CardTitle>
                <CardDescription>
                  View all images you have uploaded and their processing status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {uploadsLoading ? (
                  <div className="text-center py-8">Loading uploads...</div>
                ) : !uploads || uploads.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No uploads yet</p>
                    <Button onClick={() => setLocation("/upload-image")}>
                      Upload Your First Image
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {uploads.map((upload: Upload) => (
                      <div
                        key={upload.id}
                        className="border border-border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer"
                        onClick={() => setSelectedUpload(upload)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">Upload #{upload.id}</h3>
                              {getStatusBadge(upload.status)}
                            </div>
                            {upload.caption && (
                              <p className="text-sm text-muted-foreground mb-2">{upload.caption}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(upload.createdAt)}
                              </span>
                              <span>
                                {upload.finalImagePath ? "Processed" : "Original"}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {upload.finalImagePath && (
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Share2 className="h-4 w-4 mr-1" />
                              Share
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Processing History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Processing History</CardTitle>
                <CardDescription>
                  Timeline of all processing events and actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="text-center py-8">Loading history...</div>
                ) : !history || history.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No processing history yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((event: HistoryEvent) => (
                      <div
                        key={event.id}
                        className="border border-border rounded-lg p-4 flex items-start gap-4"
                      >
                        <div className="mt-1 text-muted-foreground">
                          {getEventIcon(event.eventType)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold capitalize">
                              {event.eventType.replace(/_/g, " ")}
                            </h4>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(event.timestamp)}
                            </span>
                          </div>
                          {event.metadata ? (
                            <p className="text-sm text-muted-foreground">
                              {typeof event.metadata === 'string' ? event.metadata : JSON.stringify(event.metadata).substring(0, 100)}...
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Upload Details Modal */}
        {selectedUpload && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Upload Details - #{selectedUpload.id}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUpload(null)}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedUpload.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{formatDate(selectedUpload.createdAt)}</p>
                  </div>
                </div>

                {selectedUpload.caption && (
                  <div>
                    <p className="text-sm text-muted-foreground">Caption</p>
                    <p className="font-medium">{selectedUpload.caption}</p>
                  </div>
                )}

                {selectedUpload.originalImagePath && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Original Image</p>
                    <div className="border border-border rounded-lg p-2 bg-muted">
                      <p className="text-xs truncate">{selectedUpload.originalImagePath}</p>
                    </div>
                  </div>
                )}

                {selectedUpload.finalImagePath && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Processed Image</p>
                    <div className="border border-border rounded-lg p-2 bg-muted">
                      <p className="text-xs truncate">{selectedUpload.finalImagePath}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  {selectedUpload.finalImagePath && (
                    <Button className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download Processed Image
                    </Button>
                  )}
                  <Button variant="outline" className="flex-1">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-500"
                    onClick={() => setSelectedUpload(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
