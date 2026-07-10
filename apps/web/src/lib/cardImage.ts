// Scryfall now rejects requests that carry a default HTTP-library User-Agent with
// HTTP 400 (error subcode "generic_user_agent"). Next's built-in image optimizer
// fetches the upstream image with a bare `fetch()` (no custom User-Agent), so every
// card served through /_next/image started 400ing. We sidestep the optimizer by
// rendering the card <Image> as `unoptimized`, which makes the browser load the
// image directly — the browser sends its own User-Agent, which Scryfall accepts.
//
// Because we no longer downscale via the optimizer, we also swap Scryfall's
// full-resolution "png" variant (~1 MB) for the CDN's right-sized "normal" variant
// (488x680 jpg, ~90 KB) — the exact dimensions the card renders at. Scryfall's image
// URLs only differ by the size segment and extension, so a structural rewrite is safe
// and avoids rebuilding the card index (which stores the "png" URL).
export function toDisplayCardImage(imageUrl: string): string {
  // Leave non-Scryfall sources (e.g. the local "/card-not-found.png" fallback) untouched.
  if (!imageUrl.includes("cards.scryfall.io")) return imageUrl;
  return imageUrl.replace("/png/", "/normal/").replace(/\.png(\?|$)/, ".jpg$1");
}
