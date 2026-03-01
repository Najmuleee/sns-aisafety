/**
 * Consent Orchestration Engine
 * Manages consent requests and approval workflow
 */

import { createConsentRequest, updateConsentRequestStatus, getConsentRequestsByUploadId, createAuditLog } from "../db";
import { InsertConsentRequest } from "../../drizzle/schema";

export interface ConsentRequest {
  id: number;
  uploadId: number;
  requestedUserId: number;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  expiresAt: Date;
  respondedAt?: Date;
}

export interface ConsentOrchestrationResult {
  success: boolean;
  consentRequests: ConsentRequest[];
  error?: string;
}

/**
 * Consent Engine
 */
export class ConsentEngine {
  private consentExpirationHours: number = 48; // Consent requests expire after 48 hours

  /**
   * Generate consent requests for detected faces
   */
  async generateConsentRequests(
    uploadId: number,
    detectedFaces: Array<{
      matched_user_id?: number;
      similarity_score?: number;
    }>,
    uploaderId: number
  ): Promise<ConsentOrchestrationResult> {
    try {
      const consentRequests: ConsentRequest[] = [];
      const requestedUserIds = new Set<number>();

      // Collect unique user IDs that need consent (excluding uploader)
      for (const face of detectedFaces) {
        if (
          face.matched_user_id &&
          face.matched_user_id !== uploaderId &&
          !requestedUserIds.has(face.matched_user_id)
        ) {
          requestedUserIds.add(face.matched_user_id);
        }
      }

      // Create consent requests for each unique user
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.consentExpirationHours);

      const userIds = Array.from(requestedUserIds);
      for (const userId of userIds) {
        const consentData: InsertConsentRequest = {
          uploadId,
          requestedUserId: userId,
          status: "pending",
          createdAt: new Date(),
          expiresAt,
        };

        await createConsentRequest(consentData);

        // Log audit event
        await createAuditLog({
          eventType: "consent_request_created",
          userId,
          metadata: {
            uploadId,
            requestedUserId: userId,
          },
        });

        consentRequests.push({
          uploadId,
          requestedUserId: userId,
          status: "pending",
          createdAt: new Date(),
          expiresAt,
        } as ConsentRequest);
      }

      return {
        success: true,
        consentRequests,
      };
    } catch (error) {
      console.error("Error generating consent requests:", error);
      return {
        success: false,
        consentRequests: [],
        error: `Failed to generate consent requests: ${error}`,
      };
    }
  }

  /**
   * Approve a consent request
   */
  async approveConsent(consentId: number, userId: number): Promise<{ success: boolean; error?: string }> {
    try {
      await updateConsentRequestStatus(consentId, "approved");

      // Log audit event
      await createAuditLog({
        eventType: "consent_approved",
        userId,
        metadata: {
          consentId,
        },
      });

      return { success: true };
    } catch (error) {
      console.error("Error approving consent:", error);
      return {
        success: false,
        error: `Failed to approve consent: ${error}`,
      };
    }
  }

  /**
   * Reject a consent request
   */
  async rejectConsent(consentId: number, userId: number): Promise<{ success: boolean; error?: string }> {
    try {
      await updateConsentRequestStatus(consentId, "rejected");

      // Log audit event
      await createAuditLog({
        eventType: "consent_rejected",
        userId,
        metadata: {
          consentId,
        },
      });

      return { success: true };
    } catch (error) {
      console.error("Error rejecting consent:", error);
      return {
        success: false,
        error: `Failed to reject consent: ${error}`,
      };
    }
  }

  /**
   * Check if all consent requests for an upload are resolved
   */
  async checkConsentStatus(uploadId: number): Promise<{
    allApproved: boolean;
    allResolved: boolean;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
  }> {
    try {
      const requests = await getConsentRequestsByUploadId(uploadId);

      const pendingCount = requests.filter((r) => r.status === "pending").length;
      const approvedCount = requests.filter((r) => r.status === "approved").length;
      const rejectedCount = requests.filter((r) => r.status === "rejected").length;

      return {
        allApproved: rejectedCount === 0 && pendingCount === 0,
        allResolved: pendingCount === 0,
        pendingCount,
        approvedCount,
        rejectedCount,
      };
    } catch (error) {
      console.error("Error checking consent status:", error);
      return {
        allApproved: false,
        allResolved: false,
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
      };
    }
  }

  /**
   * Get consent status for rendering
   * Returns a map of face index to consent status
   */
  async getConsentStatusForRendering(
    uploadId: number,
    detectedFaces: Array<{ matched_user_id?: number }>
  ): Promise<Record<number, string>> {
    try {
      const requests = await getConsentRequestsByUploadId(uploadId);
      const consentMap: Record<number, string> = {};

      for (let i = 0; i < detectedFaces.length; i++) {
        const face = detectedFaces[i];
        if (!face.matched_user_id) {
          consentMap[i] = "unknown";
        } else {
          const request = requests.find((r) => r.requestedUserId === face.matched_user_id);
          consentMap[i] = request?.status || "pending";
        }
      }

      return consentMap;
    } catch (error) {
      console.error("Error getting consent status:", error);
      return {};
    }
  }

  /**
   * Set consent expiration hours
   */
  setConsentExpirationHours(hours: number): void {
    this.consentExpirationHours = hours;
  }
}

// Export singleton instance
export const consentEngine = new ConsentEngine();
