import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, faceProfiles, InsertFaceProfile, uploads, InsertUpload, detectedFaces, InsertDetectedFace, consentRequests, InsertConsentRequest, auditLogs, InsertAuditLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// PFIP: Face processing queries
export async function getFaceProfilesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(faceProfiles).where(eq(faceProfiles.userId, userId));
}

export async function createFaceProfile(data: InsertFaceProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(faceProfiles).values(data);
  return result;
}

// PFIP: Upload queries
export async function createUpload(data: InsertUpload) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(uploads).values(data);
}

export async function getUploadById(uploadId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(uploads).where(eq(uploads.id, uploadId)).limit(1);
  return result[0] || null;
}

export async function updateUploadStatus(uploadId: number, status: string, finalImagePath?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { status, updatedAt: new Date() };
  if (finalImagePath) updateData.finalImagePath = finalImagePath;
  return db.update(uploads).set(updateData).where(eq(uploads.id, uploadId));
}

// PFIP: Detected faces queries
export async function createDetectedFace(data: InsertDetectedFace) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(detectedFaces).values(data);
}

export async function getDetectedFacesByUploadId(uploadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(detectedFaces).where(eq(detectedFaces.uploadId, uploadId));
}

// PFIP: Consent request queries
export async function createConsentRequest(data: InsertConsentRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(consentRequests).values(data);
}

export async function getConsentRequestsByUploadId(uploadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(consentRequests).where(eq(consentRequests.uploadId, uploadId));
}

export async function getConsentRequestsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(consentRequests).where(eq(consentRequests.requestedUserId, userId));
}

export async function updateConsentRequestStatus(consentId: number, status: "pending" | "approved" | "rejected") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(consentRequests).set({ status, respondedAt: new Date() }).where(eq(consentRequests.id, consentId));
}

// PFIP: Audit log queries
export async function createAuditLog(data: InsertAuditLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(auditLogs).values(data);
}

export async function getAuditLogs(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).orderBy((t) => t.timestamp).limit(limit);
}

// PFIP: User profile queries
export async function getUserUploads(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(uploads)
    .where(eq(uploads.uploaderId, userId))
    .orderBy(desc(uploads.createdAt))
    .limit(limit);
}

export async function getUploadWithDetails(uploadId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const upload = await db.select().from(uploads)
    .where(eq(uploads.id, uploadId))
    .limit(1);
  
  if (!upload.length) return null;
  
  const detectedFacesList = await db.select().from(detectedFaces)
    .where(eq(detectedFaces.uploadId, uploadId));
  
  const consentList = await db.select().from(consentRequests)
    .where(eq(consentRequests.uploadId, uploadId));
  
  return {
    ...upload[0],
    detectedFaces: detectedFacesList,
    consentRequests: consentList,
  };
}

export async function getUserUploadStats(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, completed: 0, failed: 0 };
  
  const userUploads = await db.select().from(uploads)
    .where(eq(uploads.uploaderId, userId));
  
  return {
    total: userUploads.length,
    pending: userUploads.filter((u) => u.status === 'pending').length,
    completed: userUploads.filter((u) => u.status === 'completed').length,
    failed: userUploads.filter((u) => u.status === 'failed').length,
  };
}

export async function getUserProcessingHistory(userId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(auditLogs)
    .where(eq(auditLogs.userId, userId))
    .orderBy(desc(auditLogs.timestamp))
    .limit(limit);
}
