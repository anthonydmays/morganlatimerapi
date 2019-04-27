import {IntuitClient} from '../src/intuit-client';
import OAuthClient from 'intuit-oauth';
import {spyOnClass} from 'jasmine-es6-spies';

describe('IntuitClient', () => {
  let oAuthClient: jasmine.SpyObj<OAuthClient>;
  let instance: IntuitClient;

  beforeEach(() => {
    oAuthClient = spyOnClass(OAuthClient);
    instance = new IntuitClient(oAuthClient);
  });

  it('does something', () => {
    instance.authorize();
    expect(oAuthClient.authorizeUri).toHaveBeenCalled();
  });
});
