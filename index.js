/**
 * @format
 */

// Polyfill DOMException for React Native environment
if (typeof global.DOMException === 'undefined') {
  class DOMException extends Error {
    constructor(message = 'DOM Exception', name = 'Error') {
      super(message);
      this.name = name;
    }
  }
  global.DOMException = DOMException;
}

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

