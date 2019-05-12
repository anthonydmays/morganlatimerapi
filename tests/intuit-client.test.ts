import OAuthClient from 'intuit-oauth';
import {spyOnClass} from 'jasmine-es6-spies';
import QuickBooks from 'node-quickbooks';
import * as proxyquire from 'proxyquire';

import * as storageUtils from '../src/gcloud-storage-utils';
import {IntuitClient} from '../src/intuit-client';

describe('IntuitClient', () => {
  let oAuthClient: jasmine.SpyObj<OAuthClient>;
  let oAuthClientConstructor: jasmine.Spy;
  let mockQuickBooks: jasmine.SpyObj<QuickBooks>;
  let instance: IntuitClient;

  beforeEach(() => {
    spyOn(console, 'log');
    spyOn(console, 'error');

    const readFile = spyOn(storageUtils, 'readFile');
    readFile.and.callFake((bucket: string, file: string) => {
      expect(bucket).toEqual(storageUtils.CONFIG_BUCKET);
      switch (file) {
        case 'intuit_config.prod.json': {
          return Promise.resolve(JSON.stringify({tokenFile: 'test_token'}));
        }
        default: { return Promise.reject('not found'); }
      }
    });
    spyOn(storageUtils, 'writeFile').and.returnValue(Promise.resolve());

    oAuthClient = spyOnClass(OAuthClient) as jasmine.SpyObj<OAuthClient>;
    oAuthClientConstructor = jasmine.createSpy().and.returnValue(oAuthClient);
    (oAuthClientConstructor as any).scopes = OAuthClient.scopes;
    mockQuickBooks = spyOnClass(QuickBooks);
    const mocked = proxyquire.noCallThru().load('../src/intuit-client', {
      'node-quickbooks': function() {
        return mockQuickBooks;
      },
      './gcloud-storage-utils': storageUtils,
      'intuit-oauth': oAuthClientConstructor,

    });
    instance = new mocked.IntuitClient();
  });

  it('calls auth correctly', async () => {
    await instance.authorize();
    expect(oAuthClient.authorizeUri).toHaveBeenCalledWith({
      scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
      state: 'morganlatimerapi',
    });
  });

  it('creates token', async() => {
    oAuthClient.createToken.and.returnValue(Promise.resolve({
      getJson: () => ({}),
    }));
    const result = await instance.fetchToken('abc/123');
    expect(oAuthClient.createToken).toHaveBeenCalledWith('abc/123');
    expect(result).toBe('Success.');
  });

  it('handles token creation error gracefully', async() => {
    oAuthClient.createToken.and.returnValue(Promise.reject({
      error: 'No token for you.',
    }));
    const result = await instance.fetchToken('abc/123');
    expect(result).toBe('Failed to fetch token.');
  });

  it('does not refresh when already authed', async() => {
    oAuthClient.createToken.and.returnValue(Promise.resolve({
      getJson: () => ({}),
    }));
    oAuthClient.isAccessTokenValid.and.returnValue(true);
    await instance.fetchToken('abc/123');
    const result = await instance.maybeRefreshToken();
    expect(oAuthClient.isAccessTokenValid).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('does not refresh when not authed', async() => {
    const result = await instance.maybeRefreshToken();
    expect(oAuthClient.isAccessTokenValid).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('refreshes auth when expired', async() => {
    oAuthClient.createToken.and.returnValue(Promise.resolve({
      getJson: () => ({}),
    }));
    oAuthClient.refresh.and.returnValue(Promise.resolve({
      getJson: () => ({}),
    }));
    oAuthClient.isAccessTokenValid.and.returnValue(false);
    await instance.fetchToken('abc/123');
    const result = await instance.maybeRefreshToken();
    expect(result).toBe(true);
  });

  it('handles refresh errors', async() => {
    oAuthClient.createToken.and.returnValue(Promise.resolve({
      getJson: () => ({}),
    }));
    oAuthClient.refresh.and.returnValue(Promise.reject({
      error: 'Cause I wanted to.',
    }));
    oAuthClient.isAccessTokenValid.and.returnValue(false);
    await instance.fetchToken('abc/123');
    const result = await instance.maybeRefreshToken();
    expect(result).toBe(false);
  });

  it('retrieves customers', async() => {
    const customerRef = {
      Id: 1234,
      GivenName: 'Anthony',
      FamilyName: 'Mays',
      PrimaryEmailAddr: {Address: 'anthony@mays.com'},
    };
    mockQuickBooks.findCustomers.and.callFake(
        (req: any, callback: Function) => {
          expect(req).toEqual({PrimaryEmailAddr: 'test@test.test'});
          callback(undefined, {
            QueryResponse: {
              Customer: [customerRef],
            },
          });
        });
    oAuthClient.token = {access_token: '', realmId: ''};
    const customer = await instance.getCustomer('test@test.test');
    expect(customer).toEqual({
      id: 1234,
      firstName: 'Anthony',
      lastName: 'Mays',
      email: 'anthony@mays.com',
      ref: customerRef,
    });
  });

  it('retrieves no customer if none found', async() => {
    oAuthClient.token = {access_token: '', realmId: ''};
    mockQuickBooks.findCustomers.and.callFake(
        (_req: any, callback: Function) => {
          callback(undefined, {QueryResponse: {Customer: []}});
        });
    const customer = await instance.getCustomer('test@test.test');
    expect(customer).toBe(null);
  });

  it('creates customers', async() => {
    const customerRef = {
      GivenName: 'Anthony',
      FamilyName: 'Mays',
      PrimaryEmailAddr: {Address: 'anthony@mays.com'},
    };
    mockQuickBooks.createCustomer.and.callFake((req: any, callback: any) => {
      expect(req).toEqual(customerRef);
      callback(undefined, {
        ...customerRef,
        Id: 1234,
      });
    });
    oAuthClient.token = {access_token: '', realmId: ''};
    const customer = await instance.createCustomer({
      firstName: 'Anthony',
      lastName: 'Mays',
      email: 'anthony@mays.com',
    });
    expect(customer).toEqual({
      id: 1234,
      firstName: 'Anthony',
      lastName: 'Mays',
      email: 'anthony@mays.com',
      ref: {...customerRef, Id: 1234},
    });
  });

  it('retrieves invoices', async() => {
    mockQuickBooks.findInvoices.and.callFake((_: any, callback: any) => {
      callback(undefined, {
        QueryResponse: {
          Invoice: [{Id: 4567}],
        },
      });
    });
    oAuthClient.token = {access_token: '', realmId: ''};
    const invoice = await instance.getInvoice(5678);
    expect(invoice).toEqual({
      Id: 4567,
    });
  });

  it('creates invoices', async() => {
    mockQuickBooks.createInvoice.and.callFake((req: any, callback: any) => {
      expect(req).toEqual(jasmine.objectContaining({DocNumber: 7890}));
      callback(undefined, {DocNumber: 4567});
    });
    oAuthClient.token = {access_token: '', realmId: ''};
    const customer = {
      firstName: 'Anthony',
      lastName: 'Mays',
      email: 'test@test.test',
      ref: {Id: 1234, name: 'Anthony Mays'}
    };
    const order = {
      number: 7890,
      line_items: [
        {name: 'Coaching call', line_total: 20, quantity: 2, unit_price: 10},
        {name: 'Resume review', line_total: 25, quantity: 3, unit_price: 8.3},
      ],
    };
    const invoice = await instance.createInvoice(order, customer);
    expect(invoice).toEqual({
      DocNumber: 4567,
    });
  });
});
