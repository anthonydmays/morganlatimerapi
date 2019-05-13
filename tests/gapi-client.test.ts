import {OAuth2Client} from 'google-auth-library';
import {spyOnClass} from 'jasmine-es6-spies';
import * as proxyquire from 'proxyquire';

import {GapiClient} from '../src/gapi-client';
import * as storageUtils from '../src/gcloud-storage-utils';

describe('GapiClient', () => {
  let instance: GapiClient;
  let mockOAuth2ClientConstructor: jasmine.Spy;
  let mockOAuth2Client: jasmine.SpyObj<OAuth2Client>;
  let mockReadline: jasmine.SpyObj<Readline>;
  let readFile: jasmine.Spy;
  let writeFile: jasmine.Spy;
  let config: string;

  beforeEach(() => {
    spyOn(console, 'log');
    spyOn(console, 'error');
    config = JSON.stringify({
      installed: {
        client_secret: 'my_secret',
        client_id: 'my_id',
        redirect_uris: [
          'https://some-place.org',
        ],
      },
    });

    readFile = spyOn(storageUtils, 'readFile');
    setupReadFileWithTokenPromise(Promise.resolve('12345'));
    writeFile = spyOn(storageUtils, 'writeFile');
    writeFile.and.returnValue(Promise.resolve());

    mockOAuth2Client = spyOnClass(OAuth2Client);
    mockOAuth2ClientConstructor = jasmine.createSpy('OAuth2Client');
    mockOAuth2ClientConstructor.and.callFake(() => mockOAuth2Client);
    mockReadline = spyOnClass(Readline);
    const mocked = proxyquire.noCallThru().load('../src/gapi-client', {
      './gcloud-storage-utils': storageUtils,
      'googleapis': {
        google: {
          auth: {
            OAuth2: mockOAuth2ClientConstructor,
          },
        },
      },
      'readline': {
        createInterface: () => mockReadline,
      }
    });
    instance = new mocked.GapiClient();
  });

  function setupReadFileWithTokenPromise(promise: Promise<string>) {
    readFile.and.callFake((bucket: string, file: string) => {
      expect(bucket).toEqual(storageUtils.CONFIG_BUCKET);
      switch (file) {
        case 'gapi_config.json': {
          return Promise.resolve(config);
        }
        case 'gapi_token.json': {
          return promise;
        }
        default: { throw new Error(`File ${file} not expected.`); }
      }
    });
  }

  it('initializes gapi with existing token', async () => {
    await instance.authorize();
    expect(mockOAuth2ClientConstructor)
        .toHaveBeenCalledWith('my_id', 'my_secret', 'https://some-place.org');
    expect(mockOAuth2Client.setCredentials).toHaveBeenCalledWith(12345);
  });

  it('initializes auth only once', async () => {
    await instance.authorize();
    expect(mockOAuth2ClientConstructor).toHaveBeenCalled();

    mockOAuth2ClientConstructor.calls.reset();

    await instance.authorize();
    expect(mockOAuth2ClientConstructor).not.toHaveBeenCalled();
  });

  it('prompts for auth token if not existing', async () => {
    setupReadFileWithTokenPromise(Promise.reject('blah'));
    mockOAuth2Client.generateAuthUrl.and.returnValue('http://go-here');
    mockReadline.question.and.callFake((msg: string, callback: Function) => {
      expect(msg).toEqual('Enter the code from that page here: ');
      callback('56785');
    });
    (mockOAuth2Client.getToken as jasmine.Spy)
        .and.callFake((code: string, callback: Function) => {
          expect(code).toEqual('56785');
          callback(null, {access_token: '1234'});
        });
    writeFile.and.callFake((bucket: string, path: string, content: string) => {
      expect(bucket).toEqual(storageUtils.CONFIG_BUCKET);
      expect(path).toEqual('gapi_token.json');
      expect(content).toEqual('{"access_token":"1234"}');
      return Promise.resolve();
    });
    await instance.authorize();
    expect(mockOAuth2Client.generateAuthUrl).toHaveBeenCalledWith({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar']
    });
    expect(console.log)
        .toHaveBeenCalledWith(
            'Authorize this app by visiting this url:\n', 'http://go-here');
    expect(mockOAuth2Client.setCredentials).toHaveBeenCalledWith({
      access_token: '1234'
    });
  });

  it('errors when token cannot be retrieved', async () => {
    setupReadFileWithTokenPromise(Promise.reject('blah'));
    mockReadline.question.and.callFake((_: string, callback: Function) => {
      callback('56785');
    });
    const expectedError = new Error('getToken failed');
    (mockOAuth2Client.getToken as jasmine.Spy)
        .and.callFake((_: string, callback: Function) => {
          callback(expectedError);
        });
    mockOAuth2Client.generateAuthUrl.and.returnValue('http://go-here');
    let error: Error|undefined;
    try {
      await instance.authorize();
    } catch (e) {
      error = e;
    }
    expect(error).toEqual(expectedError);
  });

  it('does not error if token cannot be saved', async () => {
    setupReadFileWithTokenPromise(Promise.reject('blah'));
    mockReadline.question.and.callFake((_: string, callback: Function) => {
      callback('56785');
    });
    (mockOAuth2Client.getToken as jasmine.Spy)
        .and.callFake((_: string, callback: Function) => {
          callback(null, {access_token: '1234'});
        });
    writeFile.and.returnValue(Promise.reject('failed'));
    let error: string|undefined;
    try {
      await instance.authorize();
    } catch (e) {
      error = e;
    }
    expect(error).toEqual('failed');
  });
});

class Readline {
  question(_message: string, _callback: Function) {}
  close() {}
}
