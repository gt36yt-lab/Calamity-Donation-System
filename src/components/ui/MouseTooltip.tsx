import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { Info } from "lucide-react";

interface MouseTooltipProps {
  trigger: ReactNode;
  panelTitle: string;
  children: ReactNode;
  panelWidth?: number;
  className?: string;
}

const MARGIN = 16;
const CURSOR_OFFSET = 22;
const ESTIMATED_PANEL_HEIGHT = 420;

/**
 * A detail panel that follows the mouse cursor while hovering the trigger
 * (desktop), and falls back to an anchored panel under the trigger on tap
 * (touch devices, where there is no cursor to follow).
 */
export function MouseTooltip({
  trigger,
  panelTitle,
  children,
  panelWidth = 380,
  className = "",
}: MouseTooltipProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  function clamp(clientX: number, clientY: number) {
    let x = clientX + CURSOR_OFFSET;
    let y = clientY + CURSOR_OFFSET;
    if (typeof window !== "undefined") {
      if (x + panelWidth + MARGIN > window.innerWidth) {
        x = clientX - panelWidth - CURSOR_OFFSET;
      }
      if (y + ESTIMATED_PANEL_HEIGHT + MARGIN > window.innerHeight) {
        y = Math.max(MARGIN, clientY - ESTIMATED_PANEL_HEIGHT - CURSOR_OFFSET);
      }
    }
    return { x, y };
  }

  function handleMouseMove(e: ReactMouseEvent<HTMLDivElement>) {
    setPos(clamp(e.clientX, e.clientY));
  }

  function handleMouseEnter(e: ReactMouseEvent<HTMLDivElement>) {
    setOpen(true);
    setPos(clamp(e.clientX, e.clientY));
  }

  function handleTap() {
    if (pos !== null) {
      setOpen((v) => !v);
      return;
    }
    // Touch: no cursor coordinates yet — anchor under the trigger instead.
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      setPos({
        x: Math.min(rect.left, window.innerWidth - panelWidth - MARGIN),
        y: rect.bottom + 8,
      });
    }
    setOpen((v) => !v);
  }

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: globalThis.MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setOpen(false)}
    >
      <button type="button" onClick={handleTap} className="block h-full w-full cursor-help text-left">
        {trigger}
      </button>

      {open && pos && (
        <div
          role="dialog"
          aria-label={panelTitle}
          style={{ position: "fixed", left: pos.x, top: pos.y, width: panelWidth, maxWidth: "calc(100vw - 32px)" }}
          className="z-50 animate-rise-in rounded-xl border border-ink-800 bg-ink-950 p-5 text-paper-50 shadow-2xl shadow-black/60"
        >
          <div className="mb-3 flex items-center gap-2 border-b border-ink-800 pb-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-signal-400">
            <Info className="h-3.5 w-3.5" />
            {panelTitle}
          </div>
          {children}
        </div>
      )}
    </div>
  );
}
