import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  type ReactNode,
  type PointerEvent,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
export type DragEndEvent = {
  active: { id: string };
  over: { id: string } | null;
};
interface Drag {
  id: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  rect: DOMRect;
  over: string | null;
  keyboard: boolean;
  started: boolean;
}
interface DragAPI {
  drag: Drag | null;
  register: (id: string, node: HTMLElement | null) => void;
  begin: (id: string, event: PointerEvent) => void;
  keyboard: (id: string, event: KeyboardEvent) => void;
}
const Context = createContext<DragAPI | null>(null);
// Pointer, touch, and keyboard interaction share the same board state.
export function BoardDragContext({
  children,
  onDragStart,
  onDragEnd,
  onDragCancel,
}: {
  children: ReactNode;
  onDragStart: (event: { active: { id: string } }) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragCancel: () => void;
}) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const current = useRef<Drag | null>(null);
  const columns = useRef(new Map<string, HTMLElement>());
  const callbacks = useRef({ onDragStart, onDragEnd, onDragCancel });
  callbacks.current = { onDragStart, onDragEnd, onDragCancel };
  const update = (d: Drag | null) => {
    current.current = d;
    setDrag(d);
  };
  const register = (id: string, node: HTMLElement | null) => {
    if (node) {
      node.dataset.dropId = id;
      columns.current.set(id, node);
    } else columns.current.delete(id);
  };
  const begin = (id: string, event: PointerEvent) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const node = event.currentTarget.closest(".booking-card");
    if (!node) return;
    const rect = node.getBoundingClientRect();
    update({
      id,
      x: event.clientX,
      y: event.clientY,
      originX: event.clientX,
      originY: event.clientY,
      rect,
      over: null,
      keyboard: false,
      started: false,
    });
  };
  const finish = () => {
    const d = current.current;
    if (!d) return;
    update(null);
    if (d.started)
      callbacks.current.onDragEnd({
        active: { id: d.id },
        over: d.over ? { id: d.over } : null,
      });
  };
  const keyboard = (id: string, event: KeyboardEvent) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (current.current?.started) {
        finish();
        return;
      }
      const rect = event.currentTarget
        .closest(".booking-card")!
        .getBoundingClientRect();
      const parent = event.currentTarget.closest<HTMLElement>("[data-drop-id]");
      const next = {
        id,
        x: rect.left,
        y: rect.top,
        originX: rect.left,
        originY: rect.top,
        rect,
        over: parent?.dataset.dropId || null,
        keyboard: true,
        started: true,
      };
      update(next);
      callbacks.current.onDragStart({ active: { id } });
    } else if (
      current.current?.keyboard &&
      ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
    ) {
      event.preventDefault();
      const keys = Array.from(columns.current.keys()),
        d = current.current;
      const idx = keys.indexOf(d.over || "");
      const next =
        keys[
          Math.max(
            0,
            Math.min(
              keys.length - 1,
              idx + (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1),
            ),
          )
        ];
      const node = columns.current.get(next)!;
      node.scrollIntoView({ block: "nearest", inline: "nearest" });
      const r = node.getBoundingClientRect();
      update({
        ...d,
        over: next,
        x: r.left + 12,
        y: r.top + 48,
        rect: new DOMRect(r.left + 12, r.top + 48, d.rect.width, d.rect.height),
      });
    }
  };
  useEffect(() => {
    const move = (event: globalThis.PointerEvent) => {
      const d = current.current;
      if (!d || d.keyboard) return;
      const distance = Math.hypot(
        event.clientX - d.originX,
        event.clientY - d.originY,
      );
      if (!d.started && distance < 6) return;
      if (!d.started) callbacks.current.onDragStart({ active: { id: d.id } });
      const element = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>("[data-drop-id]");
      const scroller = document.querySelector(".kanban-scroll");
      if (scroller) {
        const bounds = scroller.getBoundingClientRect();
        if (event.clientX > bounds.right - 45) scroller.scrollLeft += 16;
        if (event.clientX < bounds.left + 45) scroller.scrollLeft -= 16;
      }
      update({
        ...d,
        x: event.clientX,
        y: event.clientY,
        started: true,
        over: element?.dataset.dropId || null,
      });
      event.preventDefault();
    };
    const cancel = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && current.current) {
        update(null);
        callbacks.current.onDragCancel();
      }
    };
    document.addEventListener("pointermove", move, { passive: false });
    document.addEventListener("pointerup", finish);
    const cancelPointer = () => {
      if (current.current) {
        update(null);
        callbacks.current.onDragCancel();
      }
    };
    document.addEventListener("pointercancel", cancelPointer);
    document.addEventListener("keydown", cancel);
    return () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", finish);
      document.removeEventListener("pointercancel", cancelPointer);
      document.removeEventListener("keydown", cancel);
    };
  }, []);
  return (
    <Context.Provider value={{ drag, register, begin, keyboard }}>
      {children}
      <div className="sr-only" aria-live="assertive">
        {drag?.started
          ? `Booking picked up. ${drag.over ? `Over ${drag.over}.` : ""} Use left and right arrows, then Space to drop.`
          : ""}
      </div>
    </Context.Provider>
  );
}
export function useBoardDrag({ id }: { id: string }) {
  const ctx = useContext(Context)!;
  return {
    attributes: {
      "aria-pressed": ctx.drag?.id === id && ctx.drag.started,
      "aria-roledescription": "draggable booking",
    },
    listeners: {
      onPointerDown: (e: PointerEvent) => ctx.begin(id, e),
      onKeyDown: (e: KeyboardEvent) => ctx.keyboard(id, e),
    },
    isDragging: ctx.drag?.id === id && ctx.drag.started,
  };
}
export function useBoardDrop({ id }: { id: string }) {
  const ctx = useContext(Context)!;
  return {
    setNodeRef: (node: HTMLElement | null) => ctx.register(id, node),
    isOver: ctx.drag?.started && ctx.drag.over === id,
  };
}
export function DragOverlay({ children }: { children: ReactNode }) {
  const ctx = useContext(Context);
  const d = ctx?.drag;
  if (!d?.started) return null;
  return createPortal(
    <div
      className="drag-overlay"
      style={{
        position: "fixed",
        left: d.keyboard ? d.rect.left : d.rect.left + d.x - d.originX,
        top: d.keyboard ? d.rect.top : d.rect.top + d.y - d.originY,
        width: d.rect.width,
        zIndex: 200,
        pointerEvents: "none",
        transform: "rotate(2deg)",
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
