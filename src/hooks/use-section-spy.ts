import { useEffect, useState } from "react";

/**
 * Returns the id of the landing section most visible in the viewport.
 * Empty `sectionIds` disables observation (non-landing routes).
 */
export function useSectionSpy(sectionIds: string[]) {
  const [active, setActive] = useState<string | null>(null);
  const key = sectionIds.join("\0");

  useEffect(() => {
    if (!sectionIds.length) {
      setActive(null);
      return;
    }

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el != null);

    if (!elements.length) return;

    const ratios = new Map<string, number>();

    const pick = () => {
      let bestId: string | null = null;
      let best = 0;
      for (const id of sectionIds) {
        const ratio = ratios.get(id) ?? 0;
        if (ratio > best) {
          best = ratio;
          bestId = id;
        }
      }
      const next = best >= 0.12 ? bestId : null;
      setActive((current) => (current === next ? current : next));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.intersectionRatio);
        }
        pick();
      },
      {
        rootMargin: "-14% 0px -52% 0px",
        threshold: [0, 0.08, 0.15, 0.3, 0.5, 0.75, 1],
      },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [key, sectionIds]);

  return active;
}
