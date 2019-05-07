import OAuthClient from 'intuit-oauth';
import {spyOnClass} from 'jasmine-es6-spies';
import QuickBooks from 'node-quickbooks';
import * as proxyquire from 'proxyquire';

import {IntuitClient} from '../src/intuit-client';

const mockQuickBooks = spyOnClass(QuickBooks);
const mocked = proxyquire.noCallThru().load('../src/intuit-client', {
  'node-quickbooks': function() {
    return mockQuickBooks;
  },
  '../intuit_config.prod.json': {},
});

describe('IntuitClient', () => {
  let oAuthClient: jasmine.SpyObj<OAuthClient>;
  let instance: IntuitClient;

  beforeEach(() => {
    spyOn(console, 'log');
    spyOn(console, 'error');
    oAuthClient = spyOnClass(OAuthClient) as jasmine.SpyObj<OAuthClient>;
    instance = new mocked.IntuitClient(oAuthClient);
  });

  it('calls auth correctly', () => {
    instance.authorize();
    expect(oAuthClient.authorizeUri).toHaveBeenCalledWith({
      scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
      state: 'morganlatimerapi',
    });
  });

  it('creates token', async() => {
    oAuthClient.createToken.and.returnValue(Promise.resolve({
      getJson: () => ({}),
    }));
    await instance.fetchToken('abc/123');
    expect(oAuthClient.createToken).toHaveBeenCalledWith('abc/123');
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
      line_items: [],
    };
    const invoice = await instance.createInvoice(order, customer);
    expect(invoice).toEqual({
      DocNumber: 4567,
    });
  });
});
