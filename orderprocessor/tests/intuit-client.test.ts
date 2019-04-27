import * as proxyquire from 'proxyquire';
import OAuthClient from 'intuit-oauth';
import QuickBooks from 'node-quickbooks';
import {spyOnClass} from 'jasmine-es6-spies';

import {IntuitClient} from '../src/intuit-client';

const mockQuickBooks = spyOnClass(QuickBooks);
const mocked = proxyquire.noCallThru().load('../src/intuit-client', {
  'node-quickbooks': function() { return mockQuickBooks; },
  '../intuit_config.prod.json': {},
});

describe('IntuitClient', () => {
  let oAuthClient: jasmine.SpyObj<OAuthClient>;
  let instance: IntuitClient;

  beforeEach(() => {
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

  it('creates token', async () => {
    oAuthClient.createToken.and.callFake((_: string) => {
      return Promise.resolve({});
    });
    await instance.fetchToken('abc/123');
    expect(oAuthClient.createToken).toHaveBeenCalledWith('abc/123');
  });

  it('does not refresh when already authed', async () => {
    oAuthClient.createToken.and.returnValue(Promise.resolve({
      getJson: () => ({}),
    }));
    oAuthClient.isAccessTokenValid.and.returnValue(true);
    await instance.fetchToken('abc/123');
    const result = await instance.maybeRefreshToken();
    expect(oAuthClient.isAccessTokenValid).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('does not refresh when not authed', async () => {
    const result = await instance.maybeRefreshToken();
    expect(oAuthClient.isAccessTokenValid).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('refreshes auth when expired', async () => {
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

  it('retrieves customers', async () => {
    //mockQuickBooks.findCustomers.and.returnValue();
    //oAuthClient.token = {access_token: '', realmId: ''};
    //await instance.getCustomer('test@test.test');
  });
});
