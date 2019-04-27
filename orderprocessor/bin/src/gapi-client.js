"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const readline_1 = __importDefault(require("readline"));
const googleapis_1 = require("googleapis");
const config = __importStar(require("../gcal_config.json"));
class GapiClient {
    constructor() {
        this.authPromise = null;
    }
    /**
      * Create an OAuth2 client with the given credentials.
      */
    authorize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.authPromise) {
                return this.authPromise;
            }
            this.authPromise = new Promise((resolve, reject) => {
                const { client_secret, client_id, redirect_uris } = config.installed;
                this.auth = new googleapis_1.google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
                // Check if we have previously stored a token.
                fs_1.default.readFile(TOKEN_PATH, (err, token) => {
                    if (err) {
                        this.getAccessToken(resolve, reject);
                        return;
                    }
                    this.auth.setCredentials(JSON.parse(String(token)));
                    resolve();
                });
            });
            return this.authPromise;
        });
    }
    /**
      * Get and store new token after prompting for user authorization.
      */
    getAccessToken(resolve, reject) {
        if (!this.auth)
            return;
        const authUrl = this.auth.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });
        console.log('Authorize this app by visiting this url:\n', authUrl);
        const rl = readline_1.default.createInterface({
            input: process.stdin,
            output: process.stdout,
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
                fs_1.default.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
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
exports.GapiClient = GapiClient;
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = './gapi_token.json';
//# sourceMappingURL=gapi-client.js.map