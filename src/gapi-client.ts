import {OAuth2Client} from 'google-auth-library';
import {google} from 'googleapis';
import readline from 'readline';
import {promisify} from 'util';

import {CONFIG_BUCKET, readFile, writeFile} from './gcloud-storage-utils';

export class GapiClient {
  private _auth?: OAuth2Client;
  get auth(): OAuth2Client {
    return this._auth!;
  }
  private authPromise: Promise<void>|null = null;

  constructor() {}

  /**
   * Create an OAuth2 client with the given credentials.
   */
  async authorize() {
    if (this.authPromise) {
      return this.authPromise;
    }
    this.authPromise = this.doAuth();
    return this.authPromise;
    }

  async doAuth() {
    const config = JSON.parse(await readFile(CONFIG_BUCKET, GCAL_CONFIG_FILE));
    const {client_secret, client_id, redirect_uris} = config.installed;
    this._auth =
        new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    try {
      // Check if we have previously stored a token.
      const token = await readFile(CONFIG_BUCKET, TOKEN_FILE);
      this.auth.setCredentials(JSON.parse(String(token)));
    } catch {
      await this.getAccessToken();
    }
  }

  /**
   * Get and store new token after prompting for user authorization.
   */
  private async getAccessToken() {
    const authUrl = this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    console.log('Authorize this app by visiting this url:\n', authUrl);
    const code = await questionAsync('Enter the code from that page here: ');

    const getToken = promisify(this.auth.getToken).bind(this.auth);
    const token = await getToken(code);

    this.auth.setCredentials(token);

    // Store the token to disk for later program executions
    await writeFile(CONFIG_BUCKET, TOKEN_FILE, JSON.stringify(token));
    console.log('Token saved.');
  }
  }

function questionAsync(message: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(message, (result) => {
      rl.close();
      resolve(result);
    });
  });
  }

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_FILE = 'gapi_token.json';

const GCAL_CONFIG_FILE = 'gcal_config.json';
