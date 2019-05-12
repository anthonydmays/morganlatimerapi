"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var googleapis_1 = require("googleapis");
var readline_1 = __importDefault(require("readline"));
var util_1 = require("util");
var gcloud_storage_utils_1 = require("./gcloud-storage-utils");
var GapiClient = /** @class */ (function () {
    function GapiClient() {
        this.authPromise = null;
    }
    Object.defineProperty(GapiClient.prototype, "auth", {
        get: function () {
            return this._auth;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Create an OAuth2 client with the given credentials.
     */
    GapiClient.prototype.authorize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.authPromise) {
                    return [2 /*return*/, this.authPromise];
                }
                this.authPromise = this.doAuth();
                return [2 /*return*/, this.authPromise];
            });
        });
    };
    GapiClient.prototype.doAuth = function () {
        return __awaiter(this, void 0, void 0, function () {
            var config, _a, _b, _c, client_secret, client_id, redirect_uris, token, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _b = (_a = JSON).parse;
                        return [4 /*yield*/, gcloud_storage_utils_1.readFile(gcloud_storage_utils_1.CONFIG_BUCKET, GCAL_CONFIG_FILE)];
                    case 1:
                        config = _b.apply(_a, [_e.sent()]);
                        _c = config.installed, client_secret = _c.client_secret, client_id = _c.client_id, redirect_uris = _c.redirect_uris;
                        this._auth =
                            new googleapis_1.google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
                        _e.label = 2;
                    case 2:
                        _e.trys.push([2, 4, , 6]);
                        return [4 /*yield*/, gcloud_storage_utils_1.readFile(gcloud_storage_utils_1.CONFIG_BUCKET, TOKEN_FILE)];
                    case 3:
                        token = _e.sent();
                        this.auth.setCredentials(JSON.parse(String(token)));
                        return [3 /*break*/, 6];
                    case 4:
                        _d = _e.sent();
                        return [4 /*yield*/, this.getAccessToken()];
                    case 5:
                        _e.sent();
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get and store new token after prompting for user authorization.
     */
    GapiClient.prototype.getAccessToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var authUrl, code, getToken, token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        authUrl = this.auth.generateAuthUrl({
                            access_type: 'offline',
                            scope: SCOPES,
                        });
                        console.log('Authorize this app by visiting this url:\n', authUrl);
                        return [4 /*yield*/, questionAsync('Enter the code from that page here: ')];
                    case 1:
                        code = _a.sent();
                        getToken = util_1.promisify(this.auth.getToken).bind(this.auth);
                        return [4 /*yield*/, getToken(code)];
                    case 2:
                        token = _a.sent();
                        this.auth.setCredentials(token);
                        // Store the token to disk for later program executions
                        return [4 /*yield*/, gcloud_storage_utils_1.writeFile(gcloud_storage_utils_1.CONFIG_BUCKET, TOKEN_FILE, JSON.stringify(token))];
                    case 3:
                        // Store the token to disk for later program executions
                        _a.sent();
                        console.log('Token saved.');
                        return [2 /*return*/];
                }
            });
        });
    };
    return GapiClient;
}());
exports.GapiClient = GapiClient;
function questionAsync(message) {
    return new Promise(function (resolve) {
        var rl = readline_1.default.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question(message, function (result) {
            rl.close();
            resolve(result);
        });
    });
}
// If modifying these scopes, delete token.json.
var SCOPES = ['https://www.googleapis.com/auth/calendar'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
var TOKEN_FILE = 'gapi_token.json';
var GCAL_CONFIG_FILE = 'gcal_config.json';
//# sourceMappingURL=gapi-client.js.map