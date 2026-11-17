import { artUrl } from '../../assets/artkit';

type Name =
  'play' | 'pause' | 'back' | 'settings' | 'garage' | 'restart' | 'forward' | 'leanBack' | 'brake';
const names: Record<Name, string> = {
  play: 'play',
  pause: 'pause',
  back: 'back',
  settings: 'gear',
  garage: 'garage',
  restart: 'replay',
  forward: 'forward',
  leanBack: 'lean',
  brake: 'brake',
};

export function Icon({ name }: { name: Name }) {
  return (
    <img
      src={artUrl(`icon-${names[name]}.png`)}
      width="24"
      height="24"
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}
