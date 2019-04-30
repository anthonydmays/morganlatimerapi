declare module 'node-quickbooks' {
   export default class Quickbooks {
      constructor(...args: any);
      findCustomers(): Promise<any>;
      createCustomer(): Promise<any>;
      findInvoices(): Promise<any>;
      createInvoice(): Promise<any>;
   }
}
