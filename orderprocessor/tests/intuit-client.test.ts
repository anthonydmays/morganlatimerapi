import {IntuitClient} from '../src/intuit-client';
import OAuthClient from 'intuit-oauth';
import {spyOnClass} from 'jasmine-es6-spies';

describe('IntuitClient', () => {
  let oAuthClient: jasmine.SpyObj<OAuthClient>;
  let instance: IntuitClient;

  beforeEach(() => {
    oAuthClient = spyOnClass(OAuthClient) as jasmine.SpyObj<OAuthClient>;
    instance = new IntuitClient(oAuthClient);
  });

  it('calls auth correctly', () => {
    instance.authorize();
    expect(oAuthClient.authorizeUri).toHaveBeenCalledWith({
      scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
      state: 'morganlatimerapi',
    });
  });

  it('creates token', async () => {
    oAuthClient.createToken.and.returnValue(Promise.resolve({
      getJson: () => ({}),
    }));
    await instance.fetchToken('abc/123');
    expect(oAuthClient.createToken).toHaveBeenCalledWith('abc/123');
  });

  it('refreshes token', async () => {
    await instance.maybeRefreshToken();
  });
});
