import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={cn("prose-sw", className)}>
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
