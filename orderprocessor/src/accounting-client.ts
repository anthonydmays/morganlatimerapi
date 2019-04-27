export interface AccountingClient {
   authorize(): Promise<string>;
   getCustomer(email: string): Promise<Customer|null>;
   createInvoice(order:any, customer: Customer): Promise<any>;
   createCustomer(customer: Customer): Promise<Customer|null>;
   getInvoice(orderNumber: number): Promise<any>;
   maybeRefreshToken(): Promise<boolean>;
}

export interface Customer {
   id?: number;
   firstName: string,
   lastName: string,
   email: string,
   ref?: any,
}
