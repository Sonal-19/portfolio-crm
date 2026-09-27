import cors from "@elysiajs/cors";
import Elysia from "elysia";
import { mainController } from "./controllers";
import { connectionTest } from "./db/connect";
import { ALLOWED_ORIGIN_HOSTS, IS_PROD, PORT, UPLOADS_DIR } from "./env";
import { coreAuthService } from "./lib/services/core-auth-service";
import { socialSyncService } from "./lib/services/social/social-sync-service";

const EXT_TO_MIME: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

const app = new Elysia({ name: "main_app" })
  .use(
    cors({
      origin: IS_PROD ? ALLOWED_ORIGIN_HOSTS : true,
      credentials: true,
    }),
  )
  .onRequest(({ set }) => {
    set.headers["X-Powered-By"] = "elysia-shimlawale";
    set.headers["X-Content-Type-Options"] = "nosniff";
    set.headers["X-Frame-Options"] = "DENY";
  })
  .get("/uploads/*", async ({ params, set }) => {
    const rel = params["*"] as string;
    // Prevent path traversal outside the uploads directory.
    if (rel.includes("..") || rel.startsWith("/")) {
      set.status = 400;
      return "Bad path";
    }
    const ext = rel.includes(".") ? `.${rel.split(".").pop()}` : "";
    const mime = EXT_TO_MIME[ext.toLowerCase()];
    if (!mime) {
      set.status = 400;
      return "Unsupported file type";
    }
    const file = Bun.file(`${UPLOADS_DIR}/${rel}`);
    if (!(await file.exists())) {
      set.status = 404;
      return "Not found";
    }
    set.headers["Content-Type"] = mime;
    return file;
  })
  .use(mainController)
  .get("/health", ({ request }: { request: Request }) => ({
    status: "I am very healthy",
    timestamp: new Date().toISOString(),
    url: request.url,
  }));

export type Server = typeof app;

connectionTest().then(async (res) => {
  if (res) {
    await coreAuthService.initialize();
    socialSyncService.startSchedule();
    console.info("✨ ==========================================  ✨");
    app.listen(PORT);
    console.info(`ENV is ${process.env.NODE_ENV}`);
    console.info(
      `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
    );
  } else {
    console.error(
      "Fatal Error: Database connection failed, everything is down",
    );
    new Elysia({ name: "fatal_service_reporter" })
      .all("*", ({ set }) => {
        set.status = 500;
        return {
          success: false,
          message: "Database connection has failed, everything is down",
          data: null,
        };
      })
      .listen(PORT);
  }
});
