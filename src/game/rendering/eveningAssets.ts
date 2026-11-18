export const eveningAssets = [
  ...['sky', 'far', 'mid', 'near'].map((name) => ({
    key: `evening-${name}`,
    url: `${import.meta.env.BASE_URL}assets/career/evening-${name}.webp`,
  })),
  { key: 'wet-asphalt', url: `${import.meta.env.BASE_URL}assets/career/wet-asphalt.png` },
];
