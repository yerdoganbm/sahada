/**
 * React Native App Entry Point
 * @format
 */

import { AppRegistry, Platform } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

// Web: DOM'a mount et (aksi halde beyaz ekran)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const rootTag = document.getElementById('root');
  if (rootTag) {
    AppRegistry.runApplication(appName, { rootTag });
  }
}
