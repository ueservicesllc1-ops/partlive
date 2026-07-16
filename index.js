/**
 * @format
 *
 * IMPORTANT: Uses CommonJS require() (not ES module imports) so that
 * polyfills execute BEFORE any module is loaded. ES import statements
 * are hoisted which caused livekit-client to load before globals existed.
 *
 * ORDER MATTERS:
 * 1. Crypto (react-native-get-random-values)
 * 2. URL polyfill
 * 3. Web Streams (ReadableStream / WritableStream / TransformStream) — required by livekit-client 2.x
 * 4. Buffer
 * 5. DOMException
 * 6. TextEncoder/TextDecoder
 * 7. registerGlobals() from @livekit/react-native-webrtc — finalizes WebRTC globals
 */

// 1. Crypto
require('react-native-get-random-values');

// 2. URL
require('react-native-url-polyfill/auto');

// Polyfill global.navigator.userAgent (required by livekit-client browser capability checks)
if (typeof global.navigator === 'undefined') {
  global.navigator = { userAgent: 'react-native' };
} else if (typeof global.navigator.userAgent === 'undefined') {
  global.navigator.userAgent = 'react-native';
}

// 3. Web Streams — livekit-client 2.x uses ReadableStream, WritableStream, TransformStream
//    for binary WebSocket transport on Android (Hermes does NOT include these)
const webStreams = require('web-streams-polyfill');
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = webStreams.ReadableStream;
}
if (typeof global.WritableStream === 'undefined') {
  global.WritableStream = webStreams.WritableStream;
}
if (typeof global.TransformStream === 'undefined') {
  global.TransformStream = webStreams.TransformStream;
}
if (typeof global.ByteLengthQueuingStrategy === 'undefined') {
  global.ByteLengthQueuingStrategy = webStreams.ByteLengthQueuingStrategy;
}
if (typeof global.CountQueuingStrategy === 'undefined') {
  global.CountQueuingStrategy = webStreams.CountQueuingStrategy;
}

// 4. Buffer
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

// 5. DOMException
if (typeof global.DOMException === 'undefined') {
  class DOMException extends Error {
    constructor(message = 'DOM Exception', name = 'Error') {
      super(message);
      this.name = name;
    }
  }
  global.DOMException = DOMException;
}

// 6. TextEncoder / TextDecoder
if (typeof global.TextEncoder === 'undefined' || typeof global.TextDecoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('text-encoding');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// 7. Register WebRTC globals (WebRTC, MediaStream, RTCPeerConnection, etc.)
//    Must come AFTER the web streams polyfills above
const { registerGlobals } = require('@livekit/react-native-webrtc');
registerGlobals();

// ─── APP BOOTSTRAP ───
const { AppRegistry } = require('react-native');
const App = require('./App').default;
const { name: appName } = require('./app.json');

AppRegistry.registerComponent(appName, () => App);
