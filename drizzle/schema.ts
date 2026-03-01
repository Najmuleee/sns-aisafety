import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role").default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const faceProfiles = sqliteTable("face_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  embeddingVector: text("embedding_vector").notNull(),
  originalImagePath: text("original_image_path"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type FaceProfile = typeof faceProfiles.$inferSelect;
export type InsertFaceProfile = typeof faceProfiles.$inferInsert;

export const uploads = sqliteTable("uploads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uploaderId: integer("uploader_id").notNull(),
  originalImagePath: text("original_image_path").notNull(),
  finalImagePath: text("final_image_path"),
  status: text("status").default("pending").notNull(),
  caption: text("caption"),
  consentStatus: text("consent_status").default("pending").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = typeof uploads.$inferInsert;

export const detectedFaces = sqliteTable("detected_faces", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uploadId: integer("upload_id").notNull(),
  matchedUserId: integer("matched_user_id"),
  embeddingVector: text("embedding_vector").notNull(),
  boundingBox: text("bounding_box").notNull(),
  confidence: text("confidence").notNull(),
  isUploader: integer("is_uploader", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type DetectedFace = typeof detectedFaces.$inferSelect;
export type InsertDetectedFace = typeof detectedFaces.$inferInsert;

export const consentRequests = sqliteTable("consent_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uploadId: integer("upload_id").notNull(),
  requestedFromUserId: integer("requested_from_user_id").notNull(),
  detectedFaceId: integer("detected_face_id").notNull(),
  status: text("status").default("pending").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  respondedAt: integer("responded_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type ConsentRequest = typeof consentRequests.$inferSelect;
export type InsertConsentRequest = typeof consentRequests.$inferInsert;

export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventType: text("event_type").notNull(),
  userId: integer("user_id"),
  uploadId: integer("upload_id"),
  metadata: text("metadata"),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
