import OAuthClient from 'intuit-oauth';
import QuickBooks from 'node-quickbooks';
import {promisify} from 'util';

import {AccountingClient, Customer} from './accounting-client';
import {CONFIG_BUCKET, readFile, writeFile} from './gcloud-storage-utils';

export class IntuitClient implements AccountingClient {
  private readonly promisedOAuthClient: Promise<OAuthClient>;
  private config!: any;
  private authorized = false;

  constructor() {
    this.promisedOAuthClient = this.getOAuthClient();
  }

  async authorize(): Promise<string> {
    const oAuthClient = await this.promisedOAuthClient;
    try {
      const token =
          JSON.parse(await readFile(CONFIG_BUCKET, this.config.tokenFile));
      console.log('Read Intuit auth token from storage.');
      console.log(JSON.stringify(token, null, 2));
      oAuthClient.token.setToken(token);
      this.authorized = true;
      return '';
    } catch (e) {
      console.log('Failed to retrieve saved token. Getting auth url.');
      }
    return oAuthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
      state: 'morganlatimerapi',
    });
    }

  async fetchToken(url: string): Promise<string> {
    const oAuthClient = await this.promisedOAuthClient;
    try {
      const authResponse = await oAuthClient.createToken(url);
      this.authorized = true;
      const token = authResponse.getJson();
      console.log(JSON.stringify(token, null, 2));
      this.saveAuthToken(token);
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
    const oAuthClient = await this.promisedOAuthClient;
    if (oAuthClient.isAccessTokenValid()) {
      console.log('Intuit access token valid.');
      return true;
    }
    console.log('Refreshing Intuit token...');
    try {
      const authResponse = await oAuthClient.refresh();
      console.log(JSON.stringify(authResponse.getJson(), null, 2));
      return true;
    } catch (e) {
      console.error(e);
      }
    return false;
    }

  async getCustomer(email: string): Promise<Customer|null> {
    const qbo = await this.getClient();
    const findCustomers = promisify(qbo.findCustomers).bind(qbo);
    const response = await findCustomers({
      PrimaryEmailAddr: email,
    });
    const customer =
        response.QueryResponse.Customer && response.QueryResponse.Customer[0];
    return this.mapCustomer(customer);
    }

  async createCustomer(customer: Customer): Promise<Customer|null> {
    const qbo = await this.getClient();
    const createCustomer = promisify(qbo.createCustomer).bind(qbo);
    const newCustomer = await createCustomer({
      GivenName: customer.firstName,
      FamilyName: customer.lastName,
      PrimaryEmailAddr: {Address: customer.email},
    });
    return this.mapCustomer(newCustomer);
    }

  async getInvoice(orderNumber: number): Promise<any> {
    const qbo = await this.getClient();
    const findInvoices = promisify(qbo.findInvoices).bind(qbo);
    const response = await findInvoices({
      DocNumber: String(orderNumber),
    });
    const invoice =
        response.QueryResponse.Invoice && response.QueryResponse.Invoice[0];
    return invoice;
    }

  async createInvoice(order: any, customer: Customer): Promise<any> {
    const qbo = await this.getClient();
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
    } :
                      null;
  }

  private async getOAuthClient(): Promise<OAuthClient> {
    this.config = JSON.parse(await readFile(CONFIG_BUCKET, INTUIT_CONFIG_FILE));
    return new OAuthClient(this.config);
    }

  private async getClient(): Promise<QuickBooks> {
    const oAuthClient = await this.promisedOAuthClient;
    return new QuickBooks(
        this.config.clientId, this.config.clientSecret,
        oAuthClient.token.access_token, false, '' + oAuthClient.token.realmId,
        this.config.environment === 'sandbox', this.config.debug, 34, '2.0',
        oAuthClient.token.refresh_token);
  }

  private async saveAuthToken(token: {}) {
    try {
      await writeFile(
          CONFIG_BUCKET, this.config.tokenFile, JSON.stringify(token));
      console.log('Intuit token saved.');
    } catch (e) {
      console.log('Failed to save Intuit token.', e);
    }
  }
  }

const INTUIT_CONFIG_FILE = 'intuit_config.prod.json';
