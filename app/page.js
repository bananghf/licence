export const dynamic = "force-dynamic";

/** Fallback shell; middleware rewrites / to /api/ssr for the real page. */
export default function HomeFallback() {
  return null;
}
