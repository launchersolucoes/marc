"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function AppNavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const routeKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    setPending(false);
  }, [routeKey]);

  useEffect(() => {
    const handleNavigation = (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;

      const link = event.target.closest("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

      const destination = new URL(link.href, window.location.href);
      if (
        destination.origin !== window.location.origin ||
        !destination.pathname.startsWith("/app") ||
        destination.href === window.location.href
      ) return;

      setPending(true);
    };

    document.addEventListener("click", handleNavigation, true);
    return () => document.removeEventListener("click", handleNavigation, true);
  }, []);

  useEffect(() => {
    if (!pending) return undefined;
    const timeout = window.setTimeout(() => setPending(false), 8000);
    return () => window.clearTimeout(timeout);
  }, [pending]);

  return (
    <div className={`app-route-progress${pending ? " is-visible" : ""}`} aria-hidden={!pending}>
      <span />
    </div>
  );
}
