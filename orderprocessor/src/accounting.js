'use strict';

class Accounting {
  constructor( client ) {
    this.client = client;
  }

  async send(order) {
    let customer = await this.client.getCustomer(order);
    if (!customer) {
       customer = await this.client.createCustomer({
          email,
          firstName: order.billing_first_name,
          lastName: order.billing_last_name,
       });
    }

    let invoice = await this.client.getInvoice(order.order_number);
    if (!invoice) {
       invoice = await this.client.createInvoice(order, customer);
    }

    console.log(
        `Created invoice ${invoice.Id} for order ${order.id}`);
  }
}


module.exports = {
  Accounting,
};
