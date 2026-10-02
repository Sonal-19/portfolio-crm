import { createFileRoute } from "@tanstack/react-router";
import { AboutSection } from "@/components/landing/about-section";
import { BlogPreviewSection } from "@/components/landing/blog-preview-section";
import { ContactSection } from "@/components/landing/contact-section";
import { HeroSection } from "@/components/landing/hero-section";
import { KirtanSection } from "@/components/landing/kirtan-section";
import { releasesQuery } from "@/components/landing/release-carousel";
import { SocialFeedSection } from "@/components/landing/social-feed-section";
import { PublicLayout } from "@/components/layout/public-layout";
import { siteSettingsQuery, useSiteSettings } from "@/hooks/use-site-settings";

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.prefetchQuery(siteSettingsQuery),
      context.queryClient.prefetchQuery(releasesQuery),
    ]),
  component: HomePage,
});

function HomePage() {
  const { data: s } = useSiteSettings();
  return (
    <PublicLayout>
      <HeroSection s={s} />
      <AboutSection s={s} />
      <KirtanSection s={s} />
      <SocialFeedSection s={s} />
      <BlogPreviewSection />
      <ContactSection s={s} />
    </PublicLayout>
  );
}
