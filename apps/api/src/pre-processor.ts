import { eq } from "drizzle-orm";
import Elysia from "elysia";
import { db } from "$/db";
import { adminsTable } from "$/db/schema";
import { IS_PROD, SESSION_DAYS } from "$/env";
import { coreAuthService } from "$/lib/services/core-auth-service";

export const authProcessor = new Elysia({ name: "auth_processor" }).derive(
  { as: "global" },
  async ({ cookie: { token }, headers }) => {
    const authHeader = headers.authorization;
    const headerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : undefined;
    const tokenValue = token?.value || headerToken;

    // No/invalid/unknown token just resolves to a guest (auth.user = null)
    // — it does NOT reject the request. Public routes work for guests too;
    // only `protectedAdmin` rejects.
    if (!tokenValue || typeof tokenValue !== "string") {
      return { auth: { user: null } };
    }

    try {
      const userId = coreAuthService.validateToken(tokenValue);
      if (!userId) return { auth: { user: null } };

      const [user] = await db
        .select()
        .from(adminsTable)
        .where(eq(adminsTable.id, userId))
        .limit(1);
      if (!user) return { auth: { user: null } };

      const newExpiry = coreAuthService.extendToken(tokenValue);
      token?.set({
        value: tokenValue,
        path: "/",
        secure: IS_PROD,
        httpOnly: true,
        sameSite: "lax",
        expires: newExpiry ?? undefined,
        maxAge: SESSION_DAYS * 24 * 60 * 60,
      });

      return { auth: { user } };
    } catch (error) {
      console.error("auth middleware", error);
      return { auth: { user: null } };
    }
  },
);

export const protectedAdmin = new Elysia({ name: "protected_admin" })
  .use(authProcessor)
  .onBeforeHandle({ as: "scoped" }, ({ auth, status }) => {
    if (!auth?.user) {
      return status(401, {
        success: false,
        message: "You must be authenticated to access this route",
      });
    }
    if (auth.user.role !== "admin") {
      return status(403, {
        success: false,
        message: "Admin access required",
      });
    }
  })
  .derive({ as: "scoped" }, ({ auth, status }) => {
    if (!auth?.user) {
      return status(401, {
        success: false,
        message: "You're not allowed to perform this task",
      });
    }
    return { admin: auth.user };
  });
