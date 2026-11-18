export const routeAssets = ['bench', 'street-lamp', 'yard-fence', 'arrow-sign'].map((name) => ({
  key: `yard-${name}`,
  url: `${import.meta.env.BASE_URL}assets/route/${name}.png`,
}));
