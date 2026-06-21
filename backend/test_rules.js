const http = require('https');

const projectId = 'party-79ae1';
const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/usernames/test`;

console.log('Testing Firestore REST API for usernames collection...');
console.log('URL:', url);

http.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log('Response:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Raw Response:', data);
    }
  });
}).on('error', (err) => {
  console.error('Request error:', err);
});
