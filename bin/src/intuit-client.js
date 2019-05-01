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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var intuit_oauth_1 = __importDefault(require("intuit-oauth"));
var node_quickbooks_1 = __importDefault(require("node-quickbooks"));
var util_1 = require("util");
var config = __importStar(require("../intuit_config.prod.json"));
var IntuitClient = /** @class */ (function () {
    function IntuitClient(oAuthClient) {
        this.oAuthClient = oAuthClient;
        this.authorized = false;
    }
    IntuitClient.prototype.authorize = function () {
        return this.oAuthClient.authorizeUri({
            scope: [intuit_oauth_1.default.scopes.Accounting, intuit_oauth_1.default.scopes.OpenId],
            state: 'morganlatimerapi',
        });
    };
    IntuitClient.prototype.fetchToken = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var authResponse, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.oAuthClient.createToken(url)];
                    case 1:
                        authResponse = _a.sent();
                        this.authorized = true;
                        console.log(JSON.stringify(authResponse.getJson(), null, 2));
                        return [2 /*return*/, 'Success.'];
                    case 2:
                        e_1 = _a.sent();
                        console.error(e_1);
                        return [2 /*return*/, 'Failed to fetch token.'];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    IntuitClient.prototype.maybeRefreshToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var authResponse, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.authorized) {
                            console.error('Intuit API access not authorized. Please grant access.');
                            return [2 /*return*/, false];
                        }
                        if (this.oAuthClient.isAccessTokenValid()) {
                            console.log('Intuit access token valid.');
                            return [2 /*return*/, true];
                        }
                        console.log('Refreshing Intuit token...');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.oAuthClient.refresh()];
                    case 2:
                        authResponse = _a.sent();
                        console.log(JSON.stringify(authResponse.getJson(), null, 2));
                        return [2 /*return*/, true];
                    case 3:
                        e_2 = _a.sent();
                        console.error(e_2);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/, false];
                }
            });
        });
    };
    IntuitClient.prototype.getCustomer = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            var qbo, findCustomers, response, customer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        qbo = this.getClient();
                        findCustomers = util_1.promisify(qbo.findCustomers).bind(qbo);
                        return [4 /*yield*/, findCustomers({
                                PrimaryEmailAddr: email,
                            })];
                    case 1:
                        response = _a.sent();
                        customer = response.QueryResponse.Customer && response.QueryResponse.Customer[0];
                        return [2 /*return*/, this.mapCustomer(customer)];
                }
            });
        });
    };
    IntuitClient.prototype.createCustomer = function (customer) {
        return __awaiter(this, void 0, void 0, function () {
            var qbo, createCustomer, newCustomer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        qbo = this.getClient();
                        createCustomer = util_1.promisify(qbo.createCustomer).bind(qbo);
                        return [4 /*yield*/, createCustomer({
                                GivenName: customer.firstName,
                                FamilyName: customer.lastName,
                                PrimaryEmailAddr: { Address: customer.email },
                            })];
                    case 1:
                        newCustomer = _a.sent();
                        return [2 /*return*/, this.mapCustomer(newCustomer)];
                }
            });
        });
    };
    IntuitClient.prototype.getInvoice = function (orderNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var qbo, findInvoices, response, invoice;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        qbo = this.getClient();
                        findInvoices = util_1.promisify(qbo.findInvoices).bind(qbo);
                        return [4 /*yield*/, findInvoices({
                                DocNumber: String(orderNumber),
                            })];
                    case 1:
                        response = _a.sent();
                        invoice = response.QueryResponse.Invoice && response.QueryResponse.Invoice[0];
                        return [2 /*return*/, invoice];
                }
            });
        });
    };
    IntuitClient.prototype.createInvoice = function (order, customer) {
        return __awaiter(this, void 0, void 0, function () {
            var qbo, createInvoice, invoice, newInvoice;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        qbo = this.getClient();
                        createInvoice = util_1.promisify(qbo.createInvoice).bind(qbo);
                        invoice = {
                            CustomerRef: {
                                value: customer.ref.Id,
                                name: customer.ref.DisplayName,
                            },
                            BillEmail: { Address: customer.email },
                            DocNumber: order.number,
                            TrackingNum: order.transaction_id,
                            TxnDate: order.date,
                            DueDate: order.date,
                            Line: order.line_items.map(function (lineItem, i) { return ({
                                LineNum: i + 1,
                                Description: lineItem.name,
                                DetailType: 'SalesItemLineDetail',
                                Amount: Number(lineItem.line_total),
                                SalesItemLineDetail: {
                                    Qty: Number(lineItem.quantity),
                                    UnitPrice: Number(lineItem.unit_price),
                                },
                            }); }),
                        };
                        return [4 /*yield*/, createInvoice(invoice)];
                    case 1:
                        newInvoice = _a.sent();
                        return [2 /*return*/, newInvoice];
                }
            });
        });
    };
    IntuitClient.prototype.mapCustomer = function (customer) {
        return customer ? {
            id: customer.Id,
            firstName: customer.GivenName,
            lastName: customer.FamilyName,
            email: customer.PrimaryEmailAddr.Address,
            ref: customer,
        }
            : null;
    };
    IntuitClient.prototype.getClient = function () {
        return new node_quickbooks_1.default(config.clientId, config.clientSecret, this.oAuthClient.token.access_token, false, '' + this.oAuthClient.token.realmId, config.environment === 'sandbox', config.debug, 34, '2.0', this.oAuthClient.token.refresh_token);
    };
    return IntuitClient;
}());
exports.IntuitClient = IntuitClient;
//# sourceMappingURL=intuit-client.js.map