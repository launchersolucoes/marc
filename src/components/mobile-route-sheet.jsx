"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function MobileRouteSheet({ open, closeHref, title, className = "", children, id }) {
  const router = useRouter();
  const sheetRef = useRef(null);
  const startY = useRef(0);
  const [offset, setOffset] = useState(0);

  const close = () => router.push(closeHref, { scroll: false });

  useEffect(() => {
    if (!open || !window.matchMedia("(max-width: 800px)").matches) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => sheetRef.current?.focus());
    const onKeyDown = (event) => {
      if (event.key === "Escape") close();
      if (event.key !== "Tab" || !sheetRef.current) return;
      const focusable = [...sheetRef.current.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]")];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (document.activeElement === sheetRef.current) { event.preventDefault(); (event.shiftKey ? last : first).focus(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus?.();
    };
  }, [open, closeHref]);

  const beginDrag = (event) => {
    startY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveDrag = (event) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    setOffset(Math.max(0, event.clientY - startY.current));
  };
  const endDrag = (event) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (offset > 88) close();
    setOffset(0);
  };

  return (
    <>
      {open && <button className="mobile-route-sheet__backdrop" type="button" aria-label={`Fechar ${title}`} onClick={close} />}
      <aside
        className={`${className} mobile-route-sheet ${open ? "is-requested" : ""} ${offset ? "is-dragging" : ""}`}
        id={id}
        ref={sheetRef}
        tabIndex={open ? -1 : undefined}
        role={open ? "dialog" : undefined}
        aria-modal={open ? "true" : undefined}
        aria-label={open ? title : undefined}
        style={offset ? { transform: `translateY(${offset}px)` } : undefined}
      >
        {open && (
          <>
            <div className="mobile-route-sheet__handle" aria-hidden="true" onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}><span /></div>
            <header className="mobile-route-sheet__bar"><button type="button" onClick={close}>Cancelar</button><strong>{title}</strong><span aria-hidden="true" /></header>
          </>
        )}
        <div className="mobile-route-sheet__content">{children}</div>
      </aside>
    </>
  );
}
