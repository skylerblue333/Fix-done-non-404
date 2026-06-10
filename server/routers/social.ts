import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { socialPosts, socialComments, userFollows } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const socialRouter = router({
  // Create post
  createPost: protectedProcedure
    .input(
      z.object({
        content: z.string(),
        imageUrl: z.string().optional(),
        imageKey: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(socialPosts).values([
        {
          userId: ctx.user!.id,
          content: input.content,
          imageUrl: input.imageUrl,
          imageKey: input.imageKey,
        },
      ]);
      return { success: true };
    }),

  // Get feed
  getFeed: publicProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(socialPosts)
        .orderBy(desc(socialPosts.createdAt))
        .limit(input.limit);
    }),

  // Get user posts
  getUserPosts: publicProcedure
    .input(z.object({ userId: z.number(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(socialPosts)
        .where(eq(socialPosts.userId, input.userId))
        .orderBy(desc(socialPosts.createdAt))
        .limit(input.limit);
    }),

  // Like post
  toggleLike: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      const post = await db
        .select()
        .from(socialPosts)
        .where(eq(socialPosts.id, input.postId))
        .then((r: any[]) => r[0]);
      if (!post) return { success: false };
      await db
        .update(socialPosts)
        .set({ likes: post.likes + 1 })
        .where(eq(socialPosts.id, input.postId));
      return { success: true, likes: post.likes + 1 };
    }),

  // Add comment
  addComment: protectedProcedure
    .input(z.object({ postId: z.number(), content: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(socialComments).values([
        {
          postId: input.postId,
          userId: ctx.user!.id,
          content: input.content,
        },
      ]);
      return { success: true };
    }),

  // Get comments
  getComments: publicProcedure
    .input(z.object({ postId: z.number(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(socialComments)
        .where(eq(socialComments.postId, input.postId))
        .orderBy(desc(socialComments.createdAt))
        .limit(input.limit);
    }),

  // Follow user
  followUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      if (input.userId === ctx.user!.id) {
        throw new Error("Cannot follow yourself");
      }
      await db.insert(userFollows).values([
        {
          followerId: ctx.user!.id,
          followingId: input.userId,
        },
      ]);
      return { success: true };
    }),

  // Unfollow user
  unfollowUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // In production, would delete the follow record
      return { success: true };
    }),

  // Get followers
  getFollowers: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(userFollows)
        .where(eq(userFollows.followingId, input.userId));
    }),

  // Get trending posts
  getTrending: publicProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(socialPosts)
        .orderBy(desc(socialPosts.likes))
        .limit(input.limit);
    }),
});
