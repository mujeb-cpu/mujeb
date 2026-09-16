import { useEffect, useState } from "react";

export function useDelayedLoad(delay = 350): boolean {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    const t = setTimeout(() => setLoaded(true), delay);
    return () => clearTimeout(t);
  }, []);

  return loaded;
}
