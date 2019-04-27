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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const accounting_1 = require("./accounting");
const calendaring_1 = require("./calendaring");
const gapi_client_1 = require("./gapi-client");
const intuit_client_1 = require("./intuit-client");
const app = express_1.default();
const gapiClient = new gapi_client_1.GapiClient();
const intuitClient = new intuit_client_1.IntuitClient();
gapiClient.authorize();
console.log(`Intuit auth url:\n`, intuitClient.authorize());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.get('/status', (_, res) => {
    res.send('Running...');
});
app.get('/intuit_callback', (req, res) => __awaiter(this, void 0, void 0, function* () {
    const response = yield intuitClient.fetchToken(req.url);
    res.send(response);
}));
app.post('/orders', (req, res) => __awaiter(this, void 0, void 0, function* () {
    const order = req.body;
    const accounting = new accounting_1.Accounting(intuitClient);
    yield accounting.send(order);
    yield gapiClient.authorize();
    const calendaring = new calendaring_1.Calendaring(gapiClient);
    yield calendaring.book(order);
    res.send('OK');
}));
// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});
//# sourceMappingURL=server.js.map