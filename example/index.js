import { dirname } from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import express from 'express';

import fejk from '../src/fejk';

const port = process.env.PORT || 9090;

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(compression());
app.use('/fejk', fejk({
  extension: '.js',
  path: `${__dirname}/scenarios`,
}));

app.listen(port, () => {
  console.log(`Fejk is now running at localhost:${port}`);
});
