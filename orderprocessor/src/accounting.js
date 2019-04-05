'use strict';

class Accounting {

   constructor( client ) {
      this.client = client;
   }

   async send(order) {
      const customer = await this.getCustomer(order);
      const invoice = await this.createInvoice(order, customer);
      console.log(
          `Created invoice ${invoice.InvoiceID} for order ${order.id}`);
   }

   async getCustomer(order) {
      const email =
            order.billing_email && order.billing_email.toLowerCase() || '';

      const contacts = await this.client.contacts.get({
         where: `EmailAddress!=null && EmailAddress.ToLower()=="${email}"`
      });

      let customer = contacts.Contacts[0] || {
         EmailAddress: email,
         Name: order.billing_address,
         FirstName: order.billing_first_name,
         LastName: order.billing_last_name,
         IsCustomer: true,
      }
      if (!customer.ContactID) {
         const contacts = await this.client.contacts.create(customer);
         customer = contacts.Contacts[0];
      }

      return customer;
   }

   async createInvoice(order, customer) {
      const invoice = {
         Type: 'ACCREC',
         Status: 'AUTHORISED',
         InvoiceNumber: order.number,
         Reference: order.transaction_id,
         Total: Number(order.total),
         TotalTax: Number(order.tax_total),
         SubTotal: Number(order.subtotal),
         Contact: customer,
         DueDate: order.date,
         LineItems: order.line_items.map(line_item => ({
            Description: line_item.name,
            AccountCode: '400',
            TaxType: 'OUTPUT',
            Quantity: Number(line_item.quantity),
            UnitAmount: Number(line_item.unit_price),
            LineAmount: Number(line_item.line_total),
         })),
      };

      const invoices = await this.client.invoices.create(invoice);
      return invoices.Invoices[0];
   }
}


module.exports = {
   Accounting,
};
