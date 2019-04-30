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
const googleapis_1 = require("googleapis");
const util_1 = require("util");
class Calendaring {
    constructor(gapiClient) {
        this.calendar = googleapis_1.google.calendar({
            version: 'v3',
            auth: gapiClient.auth,
        });
    }
    book(order) {
        return __awaiter(this, void 0, void 0, function* () {
            const email = order.billing_email && order.billing_email.toLowerCase() || '';
            for (const item of order.line_items) {
                if (!item.sku || !item.sku.startsWith('CG')) {
                    console.log(`Calendaring skipping sku ${item.sku}`);
                    continue;
                }
                this.addCustomerToEligibleEvent(item.sku, order.user_id, email);
            }
        });
    }
    addCustomerToEligibleEvent(sku, userId, email) {
        return __awaiter(this, void 0, void 0, function* () {
            const listEvents = util_1.promisify(this.calendar.events.list);
            const skuId = `#${sku}`;
            console.log(`Searching for event with sku ${skuId} for customer ${userId}`);
            const listResponse = yield listEvents({
                calendarId: CALENDAR_ID,
                q: skuId,
            });
            if (!listResponse.data.items.length) {
                console.warn(`Event not found for sku ${skuId}.`);
                return;
            }
            const event = listResponse.data.items[0];
            event.attendees = event.attendees || [];
            if (event.attendees.find((attendee) => attendee.email.toLowerCase() === email)) {
                console.log(`Customer ${userId} already invited to event ${event.id}`);
                return;
            }
            event.attendees.push({ email });
            const updateEvent = util_1.promisify(this.calendar.events.update);
            yield updateEvent({
                calendarId: CALENDAR_ID,
                eventId: event.id,
                resource: event,
            });
            console.log(`Customer ${userId} added to event ${event.id}`);
        });
    }
}
exports.Calendaring = Calendaring;
const CALENDAR_ID = 'morganlatimer.com_kpl73s5ioudnrjflmnulj6uhqo@group.calendar.google.com';
//# sourceMappingURL=calendaring.js.map