import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <Outlet />
      <Toaster position="top-right" richColors closeButton />
    </>
  ),
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-navy px-4 text-center text-cream">
      <div>
        <p className="font-brand text-6xl text-gold-light">404</p>
        <p className="mt-3 text-cream/70">This page could not be found.</p>
        <a
          href="/"
          className="mt-6 inline-block rounded-full bg-gold px-6 py-2 font-semibold text-navy"
        >
          Go home
        </a>
      </div>
    </div>
  ),
});
