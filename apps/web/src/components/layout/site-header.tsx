import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Mic2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "About", hash: "about" },
  { label: "Studio", hash: "studio" },
  { label: "Latest", hash: "latest" },
  { label: "Blog", hash: "blog" },
  { label: "Contact", hash: "contact" },
] as const;

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const solid = !isHome || scrolled || open;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        solid
          ? "bg-navy/95 shadow-lg shadow-black/20 lg:backdrop-blur"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="shrink-0" aria-label="Home">
          <Logo className="h-10 sm:h-11" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.hash}
              to="/"
              hash={n.hash}
              className="rounded-full px-4 py-2 text-sm font-medium text-cream/80 transition hover:bg-white/5 hover:text-gold-light"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            className="hidden rounded-full bg-gradient-to-r from-gold to-saffron text-navy shadow-md hover:opacity-90 sm:inline-flex"
          >
            <Link to="/studio/book">
              <Mic2 /> Book Free Session
            </Link>
          </Button>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="grid size-10 place-items-center rounded-full text-cream hover:bg-white/10 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10 bg-navy lg:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {NAV.map((n) => (
                <Link
                  key={n.hash}
                  to="/"
                  hash={n.hash}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-cream/85 hover:bg-white/5"
                >
                  {n.label}
                </Link>
              ))}
              <Button
                asChild
                className="mt-2 rounded-full bg-gradient-to-r from-gold to-saffron text-navy"
              >
                <Link to="/studio/book" onClick={() => setOpen(false)}>
                  <Mic2 /> Book Free Studio Session
                </Link>
              </Button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
