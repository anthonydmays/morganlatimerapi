const OAuthClient = require('intuit-oauth');
const QuickBooks = require('node-quickbooks');
const {promisify} = require('util');
const config = require('../intuit_config.prod.json');

class IntuitClient {
  constructor() {
    this.oAuthClient = new OAuthClient(config);
  }

  authorize() {
    return this.oAuthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting],
      state: 'morganlatimerapi',
    });
  }

  async fetchToken(url) {
    try {
      const authResponse = await this.oAuthClient.createToken(url);
      console.log(JSON.stringify(authResponse.getJson(), null, 2));
      return 'Success.';
    } catch (e) {
      console.error(e);
      return 'Failed to fetch token.';
    }
  }

  async getCustomer(email) {
    const qbo = this.getClient();
    const findCustomers = promisify(qbo.findCustomers).bind(qbo);
    const response = await findCustomers({
       PrimaryEmailAddr: email,
    });
    const customer = response.QueryResponse.Customer &&
        response.QueryResponse.Customer[0];
    return this.mapCustomer(customer);
  }

  async createCustomer(customer) {
    const qbo = this.getClient();
    const createCustomer = promisify(qbo.createCustomer).bind(qbo);
    const newCustomer = await createCustomer({
       GivenName: customer.firstName,
       FamilyName: customer.lastName,
       PrimaryEmailAddr: {Address: customer.email},
    });
    return this.mapCustomer(newCustomer);
  };

  async getInvoice(order_number) {
    const qbo = this.getClient();
    const findInvoices = promisify(qbo.findInvoices).bind(qbo);
    const response = await findInvoices({
       DocNumber: String(order_number),
    });
    const invoice = response.QueryResponse.Invoice &&
        response.QueryResponse.Invoice[0];
    return invoice;
  }

  mapCustomer(customer) {
    return customer ? {
       id: customer.Id,
       firstName: customer.GivenName,
       lastName: customer.FamilyName,
       email: customer.PrimaryEmailAddr.Address,
       ref: customer,
    } : null;
  }

  async createInvoice(order, customer) {
    const qbo = this.getClient();
    const createInvoice = promisify(qbo.createInvoice).bind(qbo);
    const invoice = {
      CustomerRef: {
         value: customer.ref.Id,
         name: customer.ref.DisplayName,
      },
      BillEmail: {Address: customer.email},
      DocNumber: order.number,
      TrackingNum: order.transaction_id,
      DueDate: order.date,
      Line: order.line_items.map((line_item, i) => ({
        LineNum: i + 1,
        Description: line_item.name,
        DetailType: 'SalesItemLineDetail',
        Amount: Number(line_item.line_total),
        SalesItemLineDetail: {
           Qty: Number(line_item.quantity),
           UnitPrice: Number(line_item.unit_price),
        }
      })),
    };
    const invoice = await createInvoice(invoice);
    return invoice;
  }

  async maybeRefreshToken() {
    if (!this.oAuthClient.isAccessTokenValid()) {
      try {
        const authResponse = await this.oAuthClient.refresh();
        console.log(JSON.stringify(authResponse.getJson(), null, 2));
      } catch (e) {
        console.error(e);
      }
    }
  }

  getClient() {
     return new QuickBooks(
           config.clientId,
           config.clientSecret,
           this.oAuthClient.token.access_token,
           false,
           '' + this.oAuthClient.token.realmId,
           config.environment === "sandbox",
           config.debug,
           34,
           '2.0',
           this.oAuthClient.token.refresh_token);
  }
}

module.exports = {
  IntuitClient,
};
