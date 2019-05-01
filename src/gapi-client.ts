import fs from 'fs';
import {OAuth2Client} from 'google-auth-library';
import {google} from 'googleapis';
import readline from 'readline';

import * as config from '../gcal_config.json';

export class GapiClient {
  auth!: OAuth2Client;
  private authPromise: Promise<void>|null = null;

  constructor() {}

  /**
   * Create an OAuth2 client with the given credentials.
   */
  async authorize() {
    if (this.authPromise) { return this.authPromise; }
    this.authPromise = new Promise((resolve, reject) => {
      const {client_secret, client_id, redirect_uris} = config.installed;
      this.auth =
          new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

      // Check if we have previously stored a token.
      fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) {
          this.getAccessToken(resolve, reject);
          return;
        }
        this.auth.setCredentials(JSON.parse(String(token)));
        resolve();
      });
    });
    return this.authPromise;
  }

  /**
   * Get and store new token after prompting for user authorization.
   */
  getAccessToken(resolve: Function, reject: Function) {
    if (!this.auth) {
      return;
    }
    const authUrl = this.auth.generateAuthUrl({
      access_type : 'offline',
      scope : SCOPES,
    });
    console.log('Authorize this app by visiting this url:\n', authUrl);
    const rl = readline.createInterface({
      input : process.stdin,
      output : process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      this.auth.getToken(code, (err, token) => {
        if (err || !token) {
          console.error('Error retrieving token.');
          reject(err);
          return;
        }
        this.auth.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) {
            console.error('Token could not be saved.');
            reject(err);
            return;
          }
          console.log('Token saved.');
        });
        resolve();
      });
    });
  }
  }

// If modifying these scopes, delete token.json.
const SCOPES = [ 'https://www.googleapis.com/auth/calendar' ];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = './gapi_token.json';
