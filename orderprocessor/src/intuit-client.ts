import OAuthClient from 'intuit-oauth';
import QuickBooks from 'node-quickbooks';
import {promisify} from 'util';

import {AccountingClient, Customer} from './accounting-client';
import * as config from '../intuit_config.prod.json';

export class IntuitClient implements AccountingClient {
   private readonly oAuthClient: OAuthClient;
   private authorized = false;

  constructor() {
    this.oAuthClient = new OAuthClient(config);
  }

  authorize() {
    return this.oAuthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
      state: 'morganlatimerapi',
    });
  }

  async fetchToken(url: string): Promise<string> {
    try {
      const authResponse = await this.oAuthClient.createToken(url);
      this.authorized = true;
      console.log(JSON.stringify(authResponse.getJson(), null, 2));
      return 'Success.';
    } catch (e) {
      console.error(e);
      return 'Failed to fetch token.';
    }
  }

  async maybeRefreshToken(): Promise<boolean> {
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
      const authResponse = await this.oAuthClient.refresh();
      console.log(JSON.stringify(authResponse.getJson(), null, 2));
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  }

  async getCustomer(email: string): Promise<Customer|null> {
    const qbo = this.getClient();
    const findCustomers = promisify(qbo.findCustomers).bind(qbo);
    const response = await findCustomers({
      PrimaryEmailAddr: email,
    });
    const customer = response.QueryResponse.Customer &&
        response.QueryResponse.Customer[0];
    return this.mapCustomer(customer);
  }

  async createCustomer(customer: Customer): Promise<Customer|null> {
    const qbo = this.getClient();
    const createCustomer = promisify(qbo.createCustomer).bind(qbo);
    const newCustomer = await createCustomer({
      GivenName: customer.firstName,
      FamilyName: customer.lastName,
      PrimaryEmailAddr: {Address: customer.email},
    });
    return this.mapCustomer(newCustomer);
  }

  async getInvoice(orderNumber: number): Promise<any> {
    const qbo = this.getClient();
    const findInvoices = promisify(qbo.findInvoices).bind(qbo);
    const response = await findInvoices({
      DocNumber: String(orderNumber),
    });
    const invoice = response.QueryResponse.Invoice &&
        response.QueryResponse.Invoice[0];
    return invoice;
  }

  async createInvoice(order: any, customer: Customer): Promise<any> {
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
      TxnDate: order.date,
      DueDate: order.date,
      Line: order.line_items.map((lineItem: any, i: number) => ({
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
    const newInvoice = await createInvoice(invoice);
    return newInvoice;
  }

  private mapCustomer(customer: any|null): Customer|null {
    return customer ? {
      id: customer.Id,
      firstName: customer.GivenName,
      lastName: customer.FamilyName,
      email: customer.PrimaryEmailAddr.Address,
      ref: customer,
    } : null;
  }

  private getClient(): QuickBooks {
    return new QuickBooks(
        config.clientId,
        config.clientSecret,
        this.oAuthClient.token.access_token,
        false,
        '' + this.oAuthClient.token.realmId,
        config.environment === 'sandbox',
        config.debug,
        34,
        '2.0',
        this.oAuthClient.token.refresh_token);
 }
}
