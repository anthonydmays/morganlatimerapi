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
const intuit_oauth_1 = __importDefault(require("intuit-oauth"));
const node_quickbooks_1 = __importDefault(require("node-quickbooks"));
const util_1 = require("util");
const config = __importStar(require("../intuit_config.prod.json"));
class IntuitClient {
    constructor(oAuthClient) {
        this.oAuthClient = oAuthClient;
        this.authorized = false;
    }
    authorize() {
        return this.oAuthClient.authorizeUri({
            scope: [intuit_oauth_1.default.scopes.Accounting, intuit_oauth_1.default.scopes.OpenId],
            state: 'morganlatimerapi',
        });
    }
    fetchToken(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const authResponse = yield this.oAuthClient.createToken(url);
                this.authorized = true;
                console.log(JSON.stringify(authResponse.getJson(), null, 2));
                return 'Success.';
            }
            catch (e) {
                console.error(e);
                return 'Failed to fetch token.';
            }
        });
    }
    maybeRefreshToken() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.authorized) {
                console.error('Intuit API access not authorized. Please grant access.');
                return false;
            }
            if (this.oAuthClient.isAccessTokenValid()) {
                console.log('Intuit access token valid.');
                return true;
            }
            console.log('Refreshing Intuit token...');
            try {
                const authResponse = yield this.oAuthClient.refresh();
                console.log(JSON.stringify(authResponse.getJson(), null, 2));
                return true;
            }
            catch (e) {
                console.error(e);
            }
            return false;
        });
    }
    getCustomer(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const qbo = this.getClient();
            const findCustomers = util_1.promisify(qbo.findCustomers).bind(qbo);
            const response = yield findCustomers({
                PrimaryEmailAddr: email,
            });
            const customer = response.QueryResponse.Customer && response.QueryResponse.Customer[0];
            return this.mapCustomer(customer);
        });
    }
    createCustomer(customer) {
        return __awaiter(this, void 0, void 0, function* () {
            const qbo = this.getClient();
            const createCustomer = util_1.promisify(qbo.createCustomer).bind(qbo);
            const newCustomer = yield createCustomer({
                GivenName: customer.firstName,
                FamilyName: customer.lastName,
                PrimaryEmailAddr: { Address: customer.email },
            });
            return this.mapCustomer(newCustomer);
        });
    }
    getInvoice(orderNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            const qbo = this.getClient();
            const findInvoices = util_1.promisify(qbo.findInvoices).bind(qbo);
            const response = yield findInvoices({
                DocNumber: String(orderNumber),
            });
            const invoice = response.QueryResponse.Invoice && response.QueryResponse.Invoice[0];
            return invoice;
        });
    }
    createInvoice(order, customer) {
        return __awaiter(this, void 0, void 0, function* () {
            const qbo = this.getClient();
            const createInvoice = util_1.promisify(qbo.createInvoice).bind(qbo);
            const invoice = {
                CustomerRef: {
                    value: customer.ref.Id,
                    name: customer.ref.DisplayName,
                },
                BillEmail: { Address: customer.email },
                DocNumber: order.number,
                TrackingNum: order.transaction_id,
                TxnDate: order.date,
                DueDate: order.date,
                Line: order.line_items.map((lineItem, i) => ({
                    LineNum: i + 1,
                    Description: lineItem.name,
                    DetailType: 'SalesItemLineDetail',
                    Amount: Number(lineItem.line_total),
                    SalesItemLineDetail: {
                        Qty: Number(lineItem.quantity),
                        UnitPrice: Number(lineItem.unit_price),
                    },
                })),
            };
            const newInvoice = yield createInvoice(invoice);
            return newInvoice;
        });
    }
    mapCustomer(customer) {
        return customer ? {
            id: customer.Id,
            firstName: customer.GivenName,
            lastName: customer.FamilyName,
            email: customer.PrimaryEmailAddr.Address,
            ref: customer,
        }
            : null;
    }
    getClient() {
        return new node_quickbooks_1.default(config.clientId, config.clientSecret, this.oAuthClient.token.access_token, false, '' + this.oAuthClient.token.realmId, config.environment === 'sandbox', config.debug, 34, '2.0', this.oAuthClient.token.refresh_token);
    }
}
exports.IntuitClient = IntuitClient;
//# sourceMappingURL=intuit-client.js.map