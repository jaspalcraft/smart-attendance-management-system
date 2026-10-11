import { httpServerHandler } from 'cloudflare:node';
import express from 'express';
import { apiRouter } from './src/server/api.ts';

const app = express();

app.disable('x-powered-by');
app.use(express.json());
app.use('/api', apiRouter);
app.listen(3000);

export default httpServerHandler({ port: 3000 });
