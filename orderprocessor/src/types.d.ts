declare module 'intuit-oauth' {
  export default class OAuthClient {
    token: any;
    static scopes: any;
    constructor(config: any);
    authorizeUri(params: any): any;
    isAccessTokenValid(): boolean;
    createToken(url: string): Promise<any>;
    refresh(): Promise<any>;
  }
}

declare module 'node-quickbooks' {
   export default class Quickbooks {
      constructor(...args: any);
      findCustomers(): Promise<any>;
      createCustomer(): Promise<any>;
      findInvoices(): Promise<any>;
      createInvoice(): Promise<any>;
   }
}
