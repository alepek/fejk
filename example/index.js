const compression = require('compression');
const express = require('express');
const path = require('path');


const smock = require('../src/smock');
const port = process.env.PORT || 9090;

const app = express();

app.use(compression());
app.use('/smock', smock);

process.env.SMOCK_PATH = path.join(__dirname, 'scenarios');

app.listen(port, () => {
  console.log(`Smock is now running at localhost:${port}`);
});
