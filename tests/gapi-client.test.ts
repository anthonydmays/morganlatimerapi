import {OAuth2Client} from 'google-auth-library';
import {spyOnClass} from 'jasmine-es6-spies';
import * as proxyquire from 'proxyquire';

import {GapiClient} from '../src/gapi-client';

describe('GapiClient', () => {
  let instance: GapiClient;
  let fs: jasmine.SpyObj<FS>;
  let mockOAuth2ClientConstructor: jasmine.Spy;
  let mockOAuth2Client: jasmine.SpyObj<OAuth2Client>;
  let mockReadline: jasmine.SpyObj<Readline>;

  beforeEach(() => {
    spyOn(console, 'log');
    spyOn(console, 'error');
    fs = spyOnClass(FS);
    mockOAuth2Client = spyOnClass(OAuth2Client);
    mockOAuth2ClientConstructor = jasmine.createSpy('OAuth2Client');
    mockOAuth2ClientConstructor.and.callFake(() => mockOAuth2Client);
    mockReadline = spyOnClass(Readline);
    const mocked = proxyquire.noCallThru().load('../src/gapi-client', {
      '../gcal_config.json': {
        installed: {
          client_secret: 'my_secret',
          client_id: 'my_id',
          redirect_uris: [
            'https://some-place.org',
          ],
        },
      },
      'googleapis': {
        google: {
          auth: {
            OAuth2: mockOAuth2ClientConstructor,
          },
        },
      },
      fs,
      'readline': {
        createInterface: () => mockReadline,
      }
    });
    instance = new mocked.GapiClient();
  });

  it('initializes gapi with existing token', async () => {
    fs.readFile.and.callFake((path: string, callback: Function) => {
      expect(path).toEqual('./gapi_token.json');
      callback(undefined, '12345');
    });
    await instance.authorize();
    expect(mockOAuth2ClientConstructor)
        .toHaveBeenCalledWith('my_id', 'my_secret', 'https://some-place.org');
    expect(mockOAuth2Client.setCredentials).toHaveBeenCalledWith(12345);
  });

  it('initializes auth only once', () => {
    instance.authorize();
    expect(mockOAuth2ClientConstructor).toHaveBeenCalled();

    mockOAuth2ClientConstructor.calls.reset();

    instance.authorize();
    expect(mockOAuth2ClientConstructor).not.toHaveBeenCalled();
  });

  it('prompts for auth token if not existing', async () => {
    fs.readFile.and.callFake((path: string, callback: Function) => {
      expect(path).toEqual('./gapi_token.json');
      callback('blah');
    });
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
    fs.writeFile.and.callFake(
        (path: string, content: string, callback: Function) => {
          expect(path).toEqual('./gapi_token.json');
          expect(content).toEqual('{"access_token":"1234"}');
          callback(null);
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
    fs.readFile.and.callFake((_: string, callback: Function) => {
      callback('blah');
    });
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
    fs.readFile.and.callFake((_: string, callback: Function) => {
      callback('blah');
    });
    mockReadline.question.and.callFake((_: string, callback: Function) => {
      callback('56785');
    });
    (mockOAuth2Client.getToken as jasmine.Spy)
        .and.callFake((_: string, callback: Function) => {
          callback(null, {access_token: '1234'});
        });
    fs.writeFile.and.callFake((_1: string, _2: string, callback: Function) => {
      callback('failed');
    });
    let error: string|undefined;
    try {
      await instance.authorize();
    } catch (e) {
      error = e;
    }
    expect(error).toEqual('failed');
  });
});


class FS {
  readFile(_path: string, _callback: Function) {}
  writeFile(_path: string, _content: string, _callback: Function) {}
}

class Readline {
  question(_message: string, _callback: Function) {}
  close() {}
}
