'use strict';

class Accounting {
  constructor( client ) {
    this.client = client;
  }

  async send(order) {
    try {
      const email =
            order.billing_email && order.billing_email.toLowerCase() || '';
      let customer = await this.client.getCustomer(email);
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
          `Created invoice ${invoice.Id} for order ${order.id}.`);
    } catch (e) {
      console.log(
          `Failed to create invoice for order ${order.id}.`);
      console.log(e.Fault ? e.Fault.Error[0] : e);
    }
  }
}


module.exports = {
  Accounting,
};
