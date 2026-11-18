import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Temporary identity: approve before the first store publication.
  appId: 'com.nerazley.game',
  appName: 'Не Разлей!',
  webDir: 'dist',
  backgroundColor: '#ffce32',
  android: { allowMixedContent: false },
  plugins: {
    SystemBars: { hidden: true, insetsHandling: 'css', initialViewportFitValueHint: 'cover' },
  },
};
export default config;
