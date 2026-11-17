type Name =
  'play' | 'pause' | 'back' | 'settings' | 'garage' | 'restart' | 'forward' | 'leanBack' | 'brake';
const paths: Record<Name, string> = {
  play: 'M9 5l11 7-11 7V5Z',
  pause: 'M8 5v14M16 5v14',
  back: 'M15 5l-7 7 7 7',
  settings:
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-5v2m0 14v2M3 12h2m14 0h2M5.5 5.5 7 7m10 10 1.5 1.5m0-13L17 7M7 17l-1.5 1.5',
  garage: 'M3 10 12 4l9 6v10H3V10Zm4 10v-7h10v7M7 16h10',
  restart: 'M4 10a8 8 0 1 1 1 8M4 4v6h6',
  forward: 'm5 17 7-10 7 10M12 7v14',
  leanBack: 'M5 16a8 8 0 0 1 13-9M12 7h6V2',
  brake: 'M6 6h12v12H6V6Z',
};
export function Icon({ name }: { name: Name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
