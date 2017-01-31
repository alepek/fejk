const compression = require('compression');
const express = require('express');
const path = require('path');

const fejk = require('../src/fejk');

const port = process.env.PORT || 9090;

const app = express();

app.use(compression());
app.use('/fejk', fejk);

process.env.FEJK_PATH = path.join(__dirname, 'scenarios');

app.listen(port, () => {
  console.log(`Fejk is now running at localhost:${port}`);
});
