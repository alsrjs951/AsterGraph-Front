import { BRAND_MARK, BRAND_MARK_REVERSED } from "./brandPaths";

/** Approved AG Aperture: an A silhouette with the open return of a G. */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`brand-mark ${className}`}
      viewBox="0 0 256 256"
      fill="var(--color-blue)"
      aria-hidden="true"
      focusable="false"
    >
      <path className="brand-mark-on-light" d={BRAND_MARK} />
      <path className="brand-mark-on-dark" d={BRAND_MARK_REVERSED} />
    </svg>
  );
}
