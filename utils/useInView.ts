"use client";

import { useEffect, useRef, useState } from "react";

// True while the element is on (or near) screen. The 3D canvases use it to stop
// their render loop once they are scrolled away instead of drawing unseen frames.
export function useInView<T extends Element>(rootMargin = "120px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin });
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return [ref, inView] as const;
}
