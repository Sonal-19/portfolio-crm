import type * as React from "react";
import { QuickBookingButton } from "./quick-booking-button";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <QuickBookingButton />
    </div>
  );
}
