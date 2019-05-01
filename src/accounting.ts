import {AccountingClient} from './accounting-client';

/**
 * Facade for accounting system responsible for creating new customers and
 * invoices.
 */
export class Accounting {
  private readonly client: AccountingClient;

  constructor(client: AccountingClient) { this.client = client; }

  async send(order: any) {
    try {
      const orderId = order.id;
      const authorized = await this.client.maybeRefreshToken();
      if (!authorized) {
        console.error(`Cannot send order ${orderId} to accounting. Not authorized.`);
        return;
        }
      const email =
          order.billing_email && order.billing_email.toLowerCase() || '';
      let customer = await this.client.getCustomer(email);
      if (!customer) {
        customer = await this.client.createCustomer({
          email,
          firstName : order.billing_first_name,
          lastName : order.billing_last_name,
        });
        }

      if (!customer) {
        console.error(`Customer ${order.user_id} could not be created.`);
        return;
        }

      let invoice = await this.client.getInvoice(order.order_number);
      if (!invoice) {
        invoice = await this.client.createInvoice(order, customer);
      }

      console.log(`Created invoice ${invoice.Id} for order ${orderId}.`);
    } catch (e) {
      console.log(`Failed to create invoice for order ${order.id}.`);
      console.log(e.Fault ? e.Fault.Error[0] : e);
    }
  }
}
