import { useEffect, useState, type FC } from 'react';
import { axiosInstance } from '@/api/axios.ts';
import { useServerStore } from '@/stores/server.ts';

const ROUTE_HREF_SUFFIX = '/server-properties';
const HIDE_STYLE_ID = 'server-properties-route-hide';

let cache: string[] | null = null;
let inflight: Promise<string[]> | null = null;

export async function fetchAllowedEggs(): Promise<string[]> {
  if (cache) return cache;
  if (!inflight) {
    inflight = axiosInstance
      .get('/api/client/server-properties/allowed-eggs')
      .then(({ data }) => {
        cache = Array.isArray(data.eggs) ? data.eggs.map(String) : [];
        return cache as string[];
      })
      .catch(() => {
        cache = [];
        return cache as string[];
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function isEggAllowed(eggUuid: string | null | undefined, allowed: string[] | null): boolean {
  if (allowed === null || allowed.length === 0) return true;
  if (!eggUuid) return true;
  return allowed.includes(eggUuid);
}

export const EggMirror: FC = () => {
  const egg = useServerStore((state) => state.server?.egg?.uuid ?? null);
  const [allowed, setAllowed] = useState<string[] | null>(cache);

  useEffect(() => {
    fetchAllowedEggs()
      .then(setAllowed)
      .catch(() => setAllowed([]));
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const removeStyle = () => document.getElementById(HIDE_STYLE_ID)?.remove();
    removeStyle();

    if (!isEggAllowed(egg, allowed)) {
      const style = document.createElement('style');
      style.id = HIDE_STYLE_ID;
      style.textContent = `a[href$="${ROUTE_HREF_SUFFIX}"]{display:none !important;}`;
      document.head.appendChild(style);
    }

    return removeStyle;
  }, [egg, allowed]);

  return null;
};
