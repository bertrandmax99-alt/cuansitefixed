const serverless = require('serverless-http');
const app = require('../../server'); // require the express app
const { ensureDbInit } = require('../../server'); // require the db init function

let handler;

module.exports.handler = async (event, context) => {
  // Ensure the database is initialized before handling any request
  await ensureDbInit();
  
  // Normalize the event path for Express router
  // Netlify rewrites will produce /.netlify/functions/api/api/content or /.netlify/functions/api/uploads/img.jpg
  // Let's ensure the path matches the Express route
  if (event.path && event.path.startsWith('/.netlify/functions/api')) {
    event.path = event.path.replace('/.netlify/functions/api', '');
  }
  
  if (!handler) {
    handler = serverless(app, {
      binary: ['image/*', 'multipart/form-data']
    });
  }
  
  return await handler(event, context);
};

