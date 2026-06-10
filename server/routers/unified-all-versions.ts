import { router, protectedProcedure } from "../_core/trpc";
import { v1Router } from "./v1-features";
import { v2Router } from "./v2-features";
import { v3Router } from "./v3-features";
import { v4Router } from "./v4-features";
import { v45Router } from "./v45-features";
import { v5Router } from "./v5-features";
import { v6Router } from "./v6-features";
import { v7Router } from "./v7-features";
import { v8Router } from "./v8-features";
import { v9Router } from "./v9-features";
import { v10Router } from "./v10-features";

export const unifiedRouter = router({
  allVersions: protectedProcedure.query(async () => ({
    versions: ["v1", "v2", "v3", "v4", "v4.5", "v5", "v6", "v7", "v8", "v9", "v10"],
    totalFeatures: 1873,
    timestamp: Date.now()
  })),
  v1: v1Router,
  v2: v2Router,
  v3: v3Router,
  v4: v4Router,
  v45: v45Router,
  v5: v5Router,
  v6: v6Router,
  v7: v7Router,
  v8: v8Router,
  v9: v9Router,
  v10: v10Router,
});
