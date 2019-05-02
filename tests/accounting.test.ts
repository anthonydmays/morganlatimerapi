import {Accounting} from '../src/accounting';
import {AccountingClient} from '../src/accounting-client';

import * as testOrder from './test-order.json';

describe('Accounting', () => {
  let mockAccountingClient: jasmine.SpyObj<AccountingClient>;
  let instance: Accounting;

  beforeEach(() => {
    spyOn(console, 'log');
    spyOn(console, 'error');
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

  it('does not send orders when not authorized', async () => {
    mockAccountingClient.maybeRefreshToken.and.returnValue(
        Promise.resolve(false));
    await instance.send(testOrder);
    expect(console.error)
        .toHaveBeenCalledWith(
            'Cannot send order 883 to accounting. Not authorized.');
  });
});
