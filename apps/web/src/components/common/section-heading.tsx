import { cn } from "@/lib/utils";

export function SectionHeading({
  kicker,
  title,
  subtitle,
  align = "center",
  tone = "light",
  className,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {kicker && (
        <p
          className={cn(
            "mb-3 text-xs font-semibold uppercase tracking-[0.3em]",
            tone === "dark" ? "text-gold-light" : "text-primary",
          )}
        >
          {kicker}
        </p>
      )}
      <h2
        className={cn(
          "font-display text-3xl leading-tight sm:text-4xl",
          tone === "dark" ? "text-cream" : "text-navy",
        )}
      >
        {title}
      </h2>
      <div
        className={cn(
          "mt-4 h-0.5 w-16 rounded-full bg-gradient-to-r from-gold to-saffron",
          align === "center" && "mx-auto",
        )}
      />
      {subtitle && (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed",
            tone === "dark" ? "text-cream/75" : "text-muted-foreground",
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
