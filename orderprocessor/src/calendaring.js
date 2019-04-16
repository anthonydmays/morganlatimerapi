'use strict';

const {google} = require('googleapis');
const {promisify} = require('util');

class Calendaring {
  constructor(gapiClient) {
    this.calendar = google.calendar({
      version: 'v3',
      auth: gapiClient.auth,
    });
  }

  async book(order) {
    const email = order.billing_email && order.billing_email.toLowerCase() ||
         '';
    for (const item of order.line_items) {
      if (!item.sku || !item.sku.startsWith('CG')) {
        console.log(`Calendaring skipping sku ${item.sku}`);
        continue;
      }
      this.addCustomerToEligibleEvent(item.sku, order.user_id, email);
    }
  }

  async addCustomerToEligibleEvent(sku, userId, email) {
    const listEvents = promisify(this.calendar.events.list);

    const skuId = `#${sku}`;
    console.log(
        `Searching for event with sku ${skuId} for customer ${userId}`);

    const listResponse = await listEvents({
      calendarId: CALENDAR_ID,
      q: skuId,
    });

    if (!listResponse.data.items.length) {
      console.warn(`Event not found for sku ${skuId}.`);
      return;
    }

    const event = listResponse.data.items[0];
    if (event.attendees && event.attendees.find(
        (attendee) => attendee.email.toLowerCase() == email)) {
      console.log(`Customer ${userId} already invited to event ${event.id}`);
      return;
    }

    event.attendees.push({email});

    const updateEvent = promisify(this.calendar.events.update);
    await updateEvent({
      calendarId: CALENDAR_ID,
      eventId: event.id,
      resource: event,
    });

    console.log(`Customer ${userId} added to event ${event.id}`);
  }
}

const CALENDAR_ID =
   'morganlatimer.com_kpl73s5ioudnrjflmnulj6uhqo@group.calendar.google.com';

module.exports = {
  Calendaring,
};
