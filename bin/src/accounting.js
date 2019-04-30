"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Facade for accounting system responsible for creating new customers and
 * invoices.
 */
class Accounting {
    constructor(client) { this.client = client; }
    send(order) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const orderId = order.id;
                const authorized = yield this.client.maybeRefreshToken();
                if (!authorized) {
                    console.error(`Cannot send order ${orderId} to accounting. Not authorized.`);
                    return;
                }
                const email = order.billing_email && order.billing_email.toLowerCase() || '';
                let customer = yield this.client.getCustomer(email);
                if (!customer) {
                    customer = yield this.client.createCustomer({
                        email,
                        firstName: order.billing_first_name,
                        lastName: order.billing_last_name,
                    });
                }
                if (!customer) {
                    console.error(`Customer ${order.user_id} could not be created.`);
                    return;
                }
                let invoice = yield this.client.getInvoice(order.order_number);
                if (!invoice) {
                    invoice = yield this.client.createInvoice(order, customer);
                }
                console.log(`Created invoice ${invoice.Id} for order ${orderId}.`);
            }
            catch (e) {
                console.log(`Failed to create invoice for order ${order.id}.`);
                console.log(e.Fault ? e.Fault.Error[0] : e);
            }
        });
    }
}
exports.Accounting = Accounting;
//# sourceMappingURL=accounting.js.map