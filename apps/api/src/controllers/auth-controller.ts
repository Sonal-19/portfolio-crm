import { eq } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "$/db";
import { adminsTable } from "$/db/schema";
import { IS_PROD, SESSION_DAYS } from "$/env";
import { coreAuthService } from "$/lib/services/core-auth-service";
import { clientIp, rateLimitService } from "$/lib/services/rate-limit-service";
import { fail, ok } from "$/lib/utils";
import { authProcessor } from "$/pre-processor";

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export const authController = new Elysia({
  name: "auth_controller",
  prefix: "/auth",
})
  .post(
    "/login",
    async ({ body, status, cookie, headers, request, server }) => {
      const ip = clientIp(request, server);
      const key = `login:${ip}`;
      if (!rateLimitService.hit(key, LOGIN_LIMIT, LOGIN_WINDOW_MS)) {
        return status(
          429,
          fail("Too many login attempts. Try again in 15 minutes."),
        );
      }

      const email = body.email.trim().toLowerCase();
      const [admin] = await db
        .select()
        .from(adminsTable)
        .where(eq(adminsTable.email, email))
        .limit(1);

      const valid =
        admin && (await Bun.password.verify(body.password, admin.passwordHash));
      if (!admin || !valid) {
        return status(403, fail("Invalid email or password"));
      }
      rateLimitService.reset(key);

      const { token, expiresAt } = await coreAuthService.issueToken(admin.id, {
        ip,
        userAgent: headers["user-agent"],
      });

      cookie.token?.set({
        value: token,
        path: "/",
        secure: IS_PROD,
        httpOnly: true,
        sameSite: "lax",
        expires: expiresAt,
        maxAge: SESSION_DAYS * 24 * 60 * 60,
      });

      const { passwordHash: _passwordHash, ...safeAdmin } = admin;
      return ok(safeAdmin, "Login successful");
    },
    {
      body: t.Object({
        email: t.String({ minLength: 3 }),
        password: t.String({ minLength: 1 }),
      }),
    },
  )
  .post("/logout", async ({ cookie }) => {
    if (cookie?.token?.value && typeof cookie.token.value === "string") {
      await coreAuthService.revokeToken(cookie.token.value);
    }
    cookie?.token?.remove();
    return ok(null, "Logged out successfully");
  })
  .use(authProcessor)
  .get("/me", ({ auth, status }) => {
    if (!auth?.user) return status(401, fail("Not authenticated"));
    const { passwordHash: _passwordHash, ...safeAdmin } = auth.user;
    return ok(safeAdmin);
  });
