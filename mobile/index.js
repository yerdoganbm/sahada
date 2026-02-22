/**
 * React Native App Entry Point
 * @format
 */

import { AppRegistry, Platform } from 'react-native';
import App from './src/App';

// Native (iOS/Android) expects "main" - must match getMainComponentName()
AppRegistry.registerComponent('main', () => App);

// Web: DOM'a mount et (aksi halde beyaz ekran)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const rootTag = document.getElementById('root');
  if (rootTag) {
    AppRegistry.runApplication('main', { rootTag });
  }
}
