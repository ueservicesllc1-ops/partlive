const http = require('https');

const projectId = 'party-79ae1';

const checkUrl = (url, name) => {
  console.log(`Testing REST API for ${name}...`);
  http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log(`${name} Status Code:`, res.statusCode);
      try {
        const json = JSON.parse(data);
        console.log(`${name} Response:`, JSON.stringify(json, null, 2));
      } catch (e) {
        console.log(`${name} Raw Response:`, data);
      }
    });
  }).on('error', (err) => {
    console.error(`${name} Request error:`, err);
  });
};

checkUrl(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/usernames/test`, 'usernames');
checkUrl(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/test`, 'users');

