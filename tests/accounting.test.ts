import {Accounting} from '../src/accounting';
import {AccountingClient} from '../src/accounting-client';

describe('Accounting', () => {
  let mockAccountingClient: jasmine.SpyObj<AccountingClient>;
  let instance: Accounting;
  let testOrder: any;

  beforeEach(() => {
    spyOn(console, 'log');
    spyOn(console, 'error');
    testOrder = require('./test-order.json');
    mockAccountingClient = jasmine.createSpyObj('AccountingClient', [
      'authorize',
      'getCustomer',
      'createInvoice',
      'createCustomer',
      'getInvoice',
      'maybeRefreshToken',
    ]);
    instance = new Accounting(<AccountingClient>mockAccountingClient);
  });

  it('does not send orders when not authorized', async() => {
    mockAccountingClient.maybeRefreshToken.and.returnValue(
        Promise.resolve(false));
    await instance.send(testOrder);
    expect(console.error)
        .toHaveBeenCalledWith(
            'Cannot send order 883 to accounting. Not authorized.');
  });

  it('sends order for existing customers', async() => {
    mockAccountingClient.maybeRefreshToken.and.returnValue(
        Promise.resolve(true));
    const customer = {
      firstName: 'Anthony',
      lastName: 'Mays',
      email: 'test@test.test',
    };
    const order = {order_number: 5678};
    mockAccountingClient.getCustomer.and.returnValue(Promise.resolve(customer));
    await instance.send(testOrder);
    expect(mockAccountingClient.getCustomer)
        .toHaveBeenCalledWith('test@test.test');
    expect(mockAccountingClient.getInvoice).toHaveBeenCalledWith('883');
    expect(mockAccountingClient.createInvoice)
        .toHaveBeenCalledWith(testOrder, customer);
  });

  it('sends order for new customers', async() => {
    mockAccountingClient.maybeRefreshToken.and.returnValue(
        Promise.resolve(true));
    const customer = {
      firstName: 'Anthony',
      lastName: 'Mays',
      email: 'test@test.test',
    };
    const order = {order_number: 5678};
    mockAccountingClient.getCustomer.and.returnValue(Promise.resolve(null));
    mockAccountingClient.createCustomer.and.returnValue(
        Promise.resolve(customer));
    await instance.send(testOrder);
    expect(mockAccountingClient.createCustomer).toHaveBeenCalledWith(customer);
    expect(mockAccountingClient.createInvoice)
        .toHaveBeenCalledWith(testOrder, customer);
  });

  it('does not send order if invoice exists', async() => {
    mockAccountingClient.maybeRefreshToken.and.returnValue(
        Promise.resolve(true));
    const customer = {
      firstName: 'Anthony',
      lastName: 'Mays',
      email: 'test@test.test',
    };
    const invoice = {order_number: 5678};
    mockAccountingClient.getCustomer.and.returnValue(Promise.resolve(customer));
    mockAccountingClient.getInvoice.and.returnValue(Promise.resolve(invoice));
    await instance.send(testOrder);
    expect(mockAccountingClient.createInvoice).not.toHaveBeenCalled();
  });

  it('reports error on failure', async() => {
    const err = new Error('Refresh failed!');
    mockAccountingClient.maybeRefreshToken.and.callFake(() => {
      throw err;
    });
    await instance.send(testOrder);
    expect(console.error)
        .toHaveBeenCalledWith('Failed to create invoice for order 883.', err);
  });

  it('reports error when customer not found', async() => {
    mockAccountingClient.maybeRefreshToken.and.returnValue(
        Promise.resolve(true));
    testOrder.billing_email = null;
    await instance.send(testOrder);
    expect(console.error)
        .toHaveBeenCalledWith('Customer 1 could not be created.');
    expect(mockAccountingClient.getInvoice).not.toHaveBeenCalled();
    expect(mockAccountingClient.createInvoice).not.toHaveBeenCalled();
  });

  it('reports service fault', async () => {
    const err = {Fault: {Error: ['Some error']}};
    mockAccountingClient.maybeRefreshToken.and.callFake(() => {
      throw err;
    });
    await instance.send(testOrder);
    expect(console.error)
        .toHaveBeenCalledWith(
            'Failed to create invoice for order 883.', 'Some error');
  });
});
