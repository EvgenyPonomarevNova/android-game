import type { ReactNode } from 'react';

type Name =
  'play' | 'pause' | 'back' | 'settings' | 'garage' | 'restart' | 'forward' | 'leanBack' | 'brake';
// Vector shapes from the supplied ArtKit. Inline so critical controls need no image request.
const artwork: Record<Name, ReactNode> = {
  play: (
    <svg viewBox="0 0 64 64" width="24" height="24" aria-hidden="true">
      <g strokeLinejoin="round" strokeLinecap="round">
        <path
          d="M23 13 L54 32 L23 51Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="4.8"
          opacity="1"
        />
      </g>
    </svg>
  ),
  pause: (
    <svg viewBox="0 0 64 64" width="24" height="24" aria-hidden="true">
      <g strokeLinejoin="round" strokeLinecap="round">
        <path
          d="M19 12 H28 V52 H19Z M39 12 H48 V52 H39Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="4.8"
          opacity="1"
        />
      </g>
    </svg>
  ),
  back: (
    <svg viewBox="0 0 64 64" width="24" height="24" aria-hidden="true">
      <g strokeLinejoin="round" strokeLinecap="round">
        <path
          d="M40 14 L22 32 L40 50 M24 32 H54"
          fill="none"
          stroke="currentColor"
          strokeWidth="4.8"
          opacity="1"
        />
      </g>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 64 64" width="24" height="24" aria-hidden="true">
      <g strokeLinejoin="round" strokeLinecap="round">
        <path
          d="M32 10 L38 14 L46 11 L52 19 L48 26 L54 32 L48 38 L52 46 L44 53 L37 49 L31 55 L24 49 L16 52 L11 44 L15 38 L9 32 L15 26 L12 18 L20 12 L26 16Z M32 24 A8 8 0 1 0 32 40 A8 8 0 1 0 32 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="4.8"
          opacity="1"
        />
      </g>
    </svg>
  ),
  garage: (
    <svg viewBox="0 0 64 64" width="24" height="24" aria-hidden="true">
      <g strokeLinejoin="round" strokeLinecap="round">
        <path
          d="M10 28 L32 12 L54 28 V53 H10Z M19 37 H45 V53 H19Z M19 31 H45"
          fill="none"
          stroke="currentColor"
          strokeWidth="4.8"
          opacity="1"
        />
      </g>
    </svg>
  ),
  restart: (
    <svg viewBox="0 0 64 64" width="24" height="24" aria-hidden="true">
      <g strokeLinejoin="round" strokeLinecap="round">
        <path
          d="M48 18 A24 24 0 1 0 52 38 M48 18 V5 M48 18 H35"
          fill="none"
          stroke="currentColor"
          strokeWidth="4.8"
          opacity="1"
        />
      </g>
    </svg>
  ),
  forward: (
    <svg viewBox="0 0 64 64" width="24" height="24" aria-hidden="true">
      <g strokeLinejoin="round" strokeLinecap="round">
        <path
          d="M24 14 L42 32 L24 50 M42 32 H10"
          fill="none"
          stroke="currentColor"
          strokeWidth="4.8"
          opacity="1"
        />
      </g>
    </svg>
  ),
  leanBack: (
    <svg viewBox="0 0 64 64" width="24" height="24" aria-hidden="true">
      <g strokeLinejoin="round" strokeLinecap="round">
        <path
          d="M9 47 Q32 5 54 45 M14 42 L10 49 L19 51"
          fill="none"
          stroke="currentColor"
          strokeWidth="4.8"
          opacity="1"
        />
      </g>
    </svg>
  ),
  brake: (
    <svg viewBox="0 0 64 64" width="24" height="24" aria-hidden="true">
      <g strokeLinejoin="round" strokeLinecap="round">
        <path
          d="M32 8 A24 24 0 1 0 32 56 A24 24 0 1 0 32 8 M32 19 V45 M19 32 H45"
          fill="none"
          stroke="currentColor"
          strokeWidth="4.8"
          opacity="1"
        />
      </g>
    </svg>
  ),
};
export function Icon({ name }: { name: Name }) {
  return artwork[name];
}

export function CoffeeMark() {
  return (
    <svg viewBox="0 0 260 280" width="32" height="40" aria-hidden="true">
      <path
        d="M59 82L165 82L150 244Q146 253 132 253L87 253Q76 249 74 239Z"
        fill="#fff7e8"
        stroke="#192437"
        strokeWidth="10"
      />
      <rect x="70" y="134" width="85" height="74" rx="8" fill="#ffd12b" />
      <path
        d="M49 75Q52 52 83 53L157 53Q183 57 183 80Z"
        fill="#192437"
        stroke="#fff7e8"
        strokeWidth="5"
      />
      <rect x="72" y="43" width="88" height="12" rx="6" fill="#fff7e8" />
      <path
        d="M102 36Q88 15 102 8M129 37Q139 13 128 6"
        fill="none"
        stroke="#ccd6df"
        strokeWidth="9"
      />
    </svg>
  );
}

/** Flat version of the original ArtKit cake silhouette for small HUD sizes. */
export function CakeMark() {
  return (
    <svg viewBox="0 0 260 280" width="32" height="40" aria-hidden="true">
      <ellipse cx="126" cy="243" rx="103" ry="15" fill="#9aa7b8" stroke="#192437" strokeWidth="8" />
      <rect
        x="54"
        y="134"
        width="142"
        height="102"
        rx="8"
        fill="#e9b07b"
        stroke="#192437"
        strokeWidth="8"
      />
      <rect x="54" y="165" width="142" height="25" fill="#fff3e5" />
      <rect
        x="48"
        y="118"
        width="154"
        height="34"
        rx="12"
        fill="#fff5e8"
        stroke="#192437"
        strokeWidth="7"
      />
      <path
        d="M58 141Q74 183 90 143T123 145T158 145T191 140"
        fill="none"
        stroke="#fff7e8"
        strokeWidth="14"
      />
      {[80, 125, 170].map((x) => (
        <circle key={x} cx={x} cy="110" r="14" fill="#ea5159" stroke="#192437" strokeWidth="4" />
      ))}
    </svg>
  );
}
