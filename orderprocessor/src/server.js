'use strict';

// [START app]
const express = require('express');
const bodyParser = require('body-parser');

const {GapiClient} = require('./gapi-client');
const {IntuitClient} = require('./intuit-client');
const {Accounting} = require('./accounting');
const {Calendaring} = require('./calendaring');

const app = express();
const gapiClient = new GapiClient();
const intuitClient = new IntuitClient();

gapiClient.authorize();
console.log(`Intuit auth url:\n`, intuitClient.authorize());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/status', (req, res) => {
  res.send('Running...');
});

app.get('/intuit_callback', async (req, res) => {
  const response = await intuitClient.fetchToken(req.url);
  res.send(response);
});

app.post('/orders', async (req, res) => {
  const order = req.body;

  const accounting = new Accounting(intuitClient);
  await accounting.send(order);

  await gapiClient.authorize();

  const calendaring = new Calendaring(gapiClient);
  await calendaring.book(order);

  res.send('OK');
});

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
// [END app]

module.exports = app;

