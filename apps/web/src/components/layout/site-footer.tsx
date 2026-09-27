import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { Logo } from "@/components/common/logo";
import { SocialIconRow } from "@/components/common/social-icons";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { waLink } from "@/lib/utils";

export function SiteFooter() {
  const { data: s } = useSiteSettings();
  return (
    <footer className="relative overflow-hidden bg-navy text-cream/80">
      <div className="pointer-events-none absolute inset-0 bg-mandala opacity-40" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-2">
          <Logo className="h-12" />
          <p className="max-w-md text-sm leading-relaxed text-cream/70">
            {s?.tagline}. Our professional studio at Ghanta Ghar, Ludhiana is
            free for every talented artist.
          </p>
          <SocialIconRow settings={s} />
        </div>
        <div>
          <h3 className="mb-4 font-brand text-sm tracking-widest text-gold-light">
            EXPLORE
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/" hash="about" className="hover:text-gold-light">
                About Bhai Sahib
              </Link>
            </li>
            <li>
              <Link to="/" hash="studio" className="hover:text-gold-light">
                Recording Studio
              </Link>
            </li>
            <li>
              <Link to="/studio/book" className="hover:text-gold-light">
                Book a Free Session
              </Link>
            </li>
            <li>
              <Link to="/blog" className="hover:text-gold-light">
                Blog
              </Link>
            </li>
            <li>
              <Link to="/" hash="contact" className="hover:text-gold-light">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-brand text-sm tracking-widest text-gold-light">
            VISIT THE STUDIO
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
              {s?.studioAddress}
            </li>
            {s?.phone && (
              <li className="flex gap-2">
                <Phone className="mt-0.5 size-4 shrink-0 text-gold" />
                <a href={`tel:${s.phone.replace(/\s/g, "")}`}>{s.phone}</a>
              </li>
            )}
            {s?.email && (
              <li className="flex gap-2">
                <Mail className="mt-0.5 size-4 shrink-0 text-gold" />
                <a href={`mailto:${s.email}`}>{s.email}</a>
              </li>
            )}
            {s?.whatsappNumber && (
              <li className="flex gap-2">
                <FaWhatsapp className="mt-0.5 size-4 shrink-0 text-gold" />
                <a
                  href={waLink(
                    s.whatsappNumber,
                    "Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh 🙏",
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  Chat on WhatsApp
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-cream/50 sm:flex-row sm:px-6">
          <p>
            © {new Date().getFullYear()} Bhai Gurpreet Singh Ji Shimla Wale. All
            rights reserved.
          </p>
          <p className="font-gurmukhi">ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖ਼ਾਲਸਾ, ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫ਼ਤਹਿ</p>
        </div>
      </div>
    </footer>
  );
}
