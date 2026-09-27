import { createFileRoute } from "@tanstack/react-router";
import { AboutSection } from "@/components/landing/about-section";
import { BlogPreviewSection } from "@/components/landing/blog-preview-section";
import { ContactSection } from "@/components/landing/contact-section";
import { HeroSection } from "@/components/landing/hero-section";
import { SocialFeedSection } from "@/components/landing/social-feed-section";
import { StudioSection } from "@/components/landing/studio-section";
import { PublicLayout } from "@/components/layout/public-layout";
import { siteSettingsQuery, useSiteSettings } from "@/hooks/use-site-settings";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.prefetchQuery(siteSettingsQuery),
  component: HomePage,
});

function HomePage() {
  const { data: s } = useSiteSettings();
  return (
    <PublicLayout>
      <HeroSection s={s} />
      <AboutSection s={s} />
      <StudioSection s={s} />
      <SocialFeedSection s={s} />
      <BlogPreviewSection />
      <ContactSection s={s} />
    </PublicLayout>
  );
}
