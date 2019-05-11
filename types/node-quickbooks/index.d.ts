declare module 'node-quickbooks' {
   export default class Quickbooks {
      constructor(...args: any);
      findCustomers(req: any, callback: Function): void;
      createCustomer(req: any, callback: Function): void;
      findInvoices(req: any, callback: Function): void;
      createInvoice(req: any, callback: Function): void;
   }
}
