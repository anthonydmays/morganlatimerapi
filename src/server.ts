import bodyParser from 'body-parser';
import express from 'express';
import {argv} from 'yargs';

import {Accounting} from './accounting';
import {Calendaring} from './calendaring';
import {GapiClient} from './gapi-client';
import {IntuitClient} from './intuit-client';

export const app = express();
const gapiClient = new GapiClient();
const intuitConfig = argv.intuitConfig as string || undefined;
const intuitClient = new IntuitClient(intuitConfig);

gapiClient.authorize();
intuitClient.authorize().then(authUrl => {
  if (authUrl) {
    console.log(`Intuit auth url:\n`, authUrl);
  }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/status', (_, res) => {
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
