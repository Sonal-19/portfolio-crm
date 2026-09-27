import Elysia from "elysia";
import { adminControllers } from "./admin-controllers";
import { authController } from "./auth-controller";
import { publicController } from "./public-controller";

export const mainController = new Elysia({
  name: "router",
  prefix: "/api",
})
  .use(authController)
  .use(publicController)
  .use(adminControllers);
