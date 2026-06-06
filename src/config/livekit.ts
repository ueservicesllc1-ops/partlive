// Local server configuration for LiveKit WebRTC server
// IMPORTANT: Replace '10.0.2.2' or 'localhost' with your development machine's actual Local IP
// if you are testing on a real physical Android tablet connected to the same WiFi.
// For emulator, '10.0.2.2' works directly.
export const LIVEKIT_CONFIG = {
  LIVEKIT_WS_URL: 'ws://192.168.1.51:7880', // Replace with your Local IP (e.g. 192.168.X.X)
  LIVEKIT_TOKEN_SERVER_URL: 'http://192.168.1.51:4000/api/livekit/token', // Replace with your Local IP
};
