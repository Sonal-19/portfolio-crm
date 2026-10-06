import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react";
import * as React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Option = { value: string; label: React.ReactNode; text: string };

/** Plain text of a React node, used for option labels without a value and for search. */
function nodeText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node))
    return nodeText(node.props.children);
  return "";
}

/** Collects the <option> children (through arrays and fragments). */
function collectOptions(children: React.ReactNode, out: Option[] = []) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement<Record<string, unknown>>(child)) return;
    if (child.type === React.Fragment) {
      collectOptions(child.props.children as React.ReactNode, out);
      return;
    }
    if (child.type !== "option") return;
    const label = child.props.children as React.ReactNode;
    const text = nodeText(label);
    const value = child.props.value;
    out.push({ value: value == null ? text : String(value), label, text });
  });
  return out;
}

type SelectProps = Omit<
  React.ComponentProps<"select">,
  "value" | "defaultValue" | "onChange"
> & {
  value?: string | number | readonly string[];
  defaultValue?: string | number | readonly string[];
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

/**
 * Custom dropdown used across admin forms and filters. Takes the same props
 * and <option> children as a <select>, and calls onChange with an
 * event-like object whose `target.value` is the picked option's value.
 */
export function NativeSelect({
  className,
  value,
  defaultValue,
  onChange,
  children,
  disabled,
  id,
  name,
  "aria-label": ariaLabel,
}: SelectProps) {
  const options = collectOptions(children);
  const [inner, setInner] = React.useState(
    defaultValue == null ? (options[0]?.value ?? "") : String(defaultValue),
  );
  const current = value == null ? inner : String(value);
  const selected = options.find((o) => o.value === current) ?? options[0];

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [highlight, setHighlight] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);
  const searchable = options.length > 8;

  const q = query.trim().toLowerCase();
  const visible = q
    ? options.filter((o) => o.text.toLowerCase().includes(q))
    : options;

  // Keep the highlighted row in view while moving with the keyboard.
  React.useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${highlight}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  const pick = (opt: Option) => {
    setOpen(false);
    if (value == null) setInner(opt.value);
    onChange?.({
      target: { value: opt.value, name },
      currentTarget: { value: opt.value, name },
    } as unknown as React.ChangeEvent<HTMLSelectElement>);
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setQuery("");
      setHighlight(
        Math.max(
          0,
          options.findIndex((o) => o.value === current),
        ),
      );
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const last = visible.length - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h >= last ? 0 : h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? last : h - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setHighlight(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setHighlight(last);
    } else if (e.key === "Enter" || (e.key === " " && !searchable)) {
      e.preventDefault();
      const opt = visible[highlight];
      if (opt) pick(opt);
    } else if (!searchable && e.key.length === 1) {
      // Type-to-jump for short lists without a search box.
      const i = visible.findIndex((o) =>
        o.text.toLowerCase().startsWith(e.key.toLowerCase()),
      );
      if (i >= 0) setHighlight(i);
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={ariaLabel}
          disabled={disabled}
          onKeyDown={(e) => {
            if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
              e.preventDefault();
              onOpenChange(true);
            }
          }}
          className={cn(
            "group inline-flex h-9 min-w-36 items-center justify-between gap-2 rounded-md border border-input bg-white px-3 text-left text-sm shadow-xs outline-none transition-[color,box-shadow,border-color] hover:border-gold/60 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:border-gold data-[state=open]:ring-[3px] data-[state=open]:ring-gold/20",
            className,
          )}
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate",
              selected?.value === "" && "text-muted-foreground",
            )}
          >
            {selected?.label ?? ""}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </button>
      </PopoverTrigger>
      {name && <input type="hidden" name={name} value={current} />}

      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-44 overflow-hidden p-1"
        onOpenAutoFocus={(e) => {
          if (searchable) return;
          e.preventDefault();
          listRef.current?.focus();
        }}
        onKeyDown={onKeyDown}
      >
        {searchable && (
          <div className="mb-1 flex items-center gap-2 border-b px-2 pb-1.5 pt-0.5">
            <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlight(0);
              }}
              placeholder="Search…"
              className="h-7 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        )}
        <div
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          className="max-h-64 overflow-y-auto outline-none"
        >
          {visible.length === 0 && (
            <p className="px-2 py-3 text-center text-sm text-muted-foreground">
              No matches
            </p>
          )}
          {visible.map((opt, i) => {
            const isSelected = opt.value === current;
            return (
              <div
                key={`${opt.value}-${i}`}
                role="option"
                tabIndex={-1}
                aria-selected={isSelected}
                data-index={i}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(opt)}
                onKeyDown={() => {}}
                className={cn(
                  "flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                  i === highlight && "bg-accent text-accent-foreground",
                  isSelected && "font-medium",
                  opt.value === "" && "text-muted-foreground",
                )}
              >
                <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                {isSelected && (
                  <CheckIcon className="size-4 shrink-0 text-gold" />
                )}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** The browser's own <select>, kept for the public booking form (native pickers on phones). */
export function BrowserSelect({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-9 rounded-md border border-input bg-white px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
