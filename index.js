/**
 * @format
 *
 * IMPORTANT: Uses CommonJS require() (not ES module imports) so that
 * polyfills execute BEFORE any module is loaded. ES import statements
 * are hoisted which caused livekit-client to load before TextDecoder existed.
 */

// ─── POLYFILLS FIRST (must run before any other module loads) ───

// Polyfill DOMException
if (typeof global.DOMException === 'undefined') {
  class DOMException extends Error {
    constructor(message = 'DOM Exception', name = 'Error') {
      super(message);
      this.name = name;
    }
  }
  global.DOMException = DOMException;
}

// Polyfill TextEncoder / TextDecoder (required by livekit-client)
if (typeof global.TextEncoder === 'undefined' || typeof global.TextDecoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('text-encoding');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// ─── APP BOOTSTRAP (after polyfills) ───
const { AppRegistry } = require('react-native');
const App = require('./App').default;
const { name: appName } = require('./app.json');

AppRegistry.registerComponent(appName, () => App);

