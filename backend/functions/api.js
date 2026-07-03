import serverless from 'serverless-http';
import app, { connectDB } from '../server.js';

export const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await connectDB();

  // Rewrite the path so Express routes (/api/...) match correctly
  if (event.path && event.path.startsWith('/.netlify/functions/api')) {
    event.path = event.path.replace('/.netlify/functions/api', '/api');
  }
  const slsApp = serverless(app);
  return await slsApp(event, context);
};
