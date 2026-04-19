const http = require('http');
http.get('http://localhost:3000/', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log("LENGTH: " + body.length));
});
