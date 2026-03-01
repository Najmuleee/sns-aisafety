import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getUserUploads, getUploadWithDetails, getUserUploadStats, getUserProcessingHistory } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // PFIP: Face processing and consent management
  faces: router({
    // Register face profiles for user
    registerProfiles: protectedProcedure
      .input(z.object({
        imageUrls: z.array(z.string()),
      }))
      .mutation(async ({ ctx, input }) => {
        // TODO: Implement face profile registration
        return { success: true, profilesCreated: input.imageUrls.length };
      }),
    
    // Get user's face profiles
    getProfiles: protectedProcedure
      .query(async ({ ctx }) => {
        // TODO: Implement get face profiles
        return [];
      }),
  }),
  
  uploads: router({
    // Upload image for processing
    uploadImage: protectedProcedure
      .input(z.object({
        imageUrl: z.string(),
        caption: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // TODO: Implement image upload and face detection
        return { success: true, uploadId: 1 };
      }),
    
    // Get upload details
    getUpload: protectedProcedure
      .input(z.object({
        uploadId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        // TODO: Implement get upload
        return null;
      }),
  }),
  
  consent: router({
    // Get pending consent requests for user
    getPending: protectedProcedure
      .query(async ({ ctx }) => {
        // TODO: Implement get pending consents
        return [];
      }),
    
    // Approve consent request
    approve: protectedProcedure
      .input(z.object({
        consentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // TODO: Implement consent approval
        return { success: true };
      }),
    
    // Reject consent request
    reject: protectedProcedure
      .input(z.object({
        consentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // TODO: Implement consent rejection
        return { success: true };
      }),
  }),

  profile: router({
    // Get user's upload statistics
    getStats: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        return getUserUploadStats(ctx.user.id);
      }),
    
    // Get user's uploaded images
    getUploads: protectedProcedure
      .input(z.object({
        limit: z.number().default(50),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        return getUserUploads(ctx.user.id, input.limit);
      }),
    
    // Get upload details with faces and consent
    getUploadDetails: protectedProcedure
      .input(z.object({
        uploadId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const uploadDetails = await getUploadWithDetails(input.uploadId);
        if (!uploadDetails || uploadDetails.uploaderId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }
        return uploadDetails;
      }),
    
    // Get user's processing history
    getHistory: protectedProcedure
      .input(z.object({
        limit: z.number().default(100),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        return getUserProcessingHistory(ctx.user.id, input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
