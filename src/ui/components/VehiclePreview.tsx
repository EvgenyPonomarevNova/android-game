import type { VehicleSetup } from '../../shared/Progression';
import { equipmentStyle } from '../../game/rendering/equipmentStyle';
import { useId } from 'react';
import { PAINTS } from '../../config/career';

/** The same separate ArtKit parts used by the ride, with visible installed equipment. */
export function VehiclePreview({
  setup,
  cargo = 'surprise',
}: {
  setup: VehicleSetup;
  cargo?: string;
}) {
  const art = `${import.meta.env.BASE_URL}assets/artkit/`;
  const style = equipmentStyle(setup);
  const filterId = useId();
  const paint = setup.paint ?? 'yellow';
  const color = PAINTS[paint].color;
  const channels = [1, 3, 5].map((i) => Number.parseInt(color.slice(i, i + 2), 16) / 255);
  return (
    <svg
      viewBox="0 -220 700 620"
      role="img"
      aria-label={`${setup.vehicleId === 'tyagach_80' ? 'Тягач-80' : 'Дворик-50'} с установленным оборудованием`}
    >
      <ellipse cx="352" cy="379" rx="293" ry="17" fill="#0b1426" opacity=".3" />
      <image href={`${art}courier.png`} x="142" y="-197" width="404" height="533" />
      <defs>
        <filter id={filterId} colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values={`${channels[0]} 0 0 0 0 0 ${channels[1]} 0 0 0 0 0 ${channels[2]} 0 0 0 0 0 1 0`}
          />
        </filter>
      </defs>
      <image
        href={`${art}scooter.png`}
        width="700"
        height="318"
        filter={paint === 'yellow' ? undefined : `url(#${filterId})`}
      />
      {setup.vehicleId === 'tyagach_80' && (
        <path d="M192 221h168v32H192z" fill="#294459" stroke="#c4d0df" strokeWidth="6" />
      )}
      {style.engine && (
        <path d="M262 210h74l-8 27h-66z" fill={style.engine} stroke="#17263b" strokeWidth="5" />
      )}
      {style.suspension && (
        <path
          d="m172 242 22-8-12-11 23-9-12-12 22-9"
          fill="none"
          stroke={style.suspension}
          strokeWidth="9"
          strokeLinejoin="round"
        />
      )}
      {[170, 535].map((x) => (
        <g key={x}>
          <image href={`${art}wheel.png`} x={x - 86} y="200" width="172" height="172" />
          {style.tire && (
            <circle
              cx={x}
              cy="286"
              r="68"
              fill="none"
              stroke={style.tire}
              strokeWidth="8"
              strokeDasharray={setup.parts.tires === 'allweather_tires' ? '13 8' : undefined}
            />
          )}
        </g>
      ))}
      <g transform="translate(205 22)">
        <rect
          x="-50"
          y="-31"
          width="100"
          height="96"
          rx="10"
          fill="#23364d"
          stroke={style.mount ? '#f4a95b' : '#65778c'}
          strokeWidth="6"
        />
        <image
          href={`${import.meta.env.BASE_URL}assets/cargo/${cargo === 'hot-meal' ? 'noodles' : 'cake'}.png`}
          x="-37"
          y="-18"
          width="74"
          height="60"
        />
        {style.mount && (
          <path d="M-32-31v96m64-96v96M-50 51H50" stroke="#f4a95b" strokeWidth="9" fill="none" />
        )}
      </g>
    </svg>
  );
}
