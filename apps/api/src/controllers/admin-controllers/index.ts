import Elysia from "elysia";
import { adminBlogController } from "./admin-blog-controller";
import { adminDashboardController } from "./admin-dashboard-controller";
import { adminFollowUpsController } from "./admin-follow-ups-controller";
import { adminKirtanBookingsController } from "./admin-kirtan-bookings-controller";
import { adminLeadsController } from "./admin-leads-controller";
import { adminQueriesController } from "./admin-queries-controller";
import { adminReleasesController } from "./admin-releases-controller";
import { adminSettingsController } from "./admin-settings-controller";
import { adminSocialController } from "./admin-social-controller";
import { adminWhatsappController } from "./admin-whatsapp-controller";

export const adminControllers = new Elysia({
  name: "admin_controllers",
  prefix: "/admin",
})
  .use(adminDashboardController)
  .use(adminLeadsController)
  .use(adminFollowUpsController)
  .use(adminKirtanBookingsController)
  .use(adminQueriesController)
  .use(adminBlogController)
  .use(adminSocialController)
  .use(adminReleasesController)
  .use(adminWhatsappController)
  .use(adminSettingsController);
