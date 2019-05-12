import {Bucket, File, Storage} from '@google-cloud/storage';
import {spyOnClass} from 'jasmine-es6-spies';
import * as proxyquire from 'proxyquire';

describe('gcloud-storage-utils', () => {
  let mockFile: jasmine.SpyObj<File>;
  let mockBucket: jasmine.SpyObj<Bucket>;
  let mockStorage: jasmine.SpyObj<Storage>;
  let mocked: any;

  beforeEach(() => {
    mockFile = spyOnClass(File);
    mockBucket = spyOnClass(Bucket);
    mockBucket.file.and.returnValue(mockFile);
    mockStorage = spyOnClass(Storage);
    mockStorage.bucket.and.returnValue(mockBucket);
    mocked = proxyquire.noCallThru().load('../src/gcloud-storage-utils', {
      '@google-cloud/storage': {
        Storage: function() {
          return mockStorage;
        },
      },
    });
  });

  it('reads a file', async () => {
    const mockStream: any = {
      on: (event: string, callback: Function) => {
        switch (event) {
          case 'data': {
            callback('some value');
            break;
          }
          case 'end': {
            callback();
            break;
          }
        };
        return mockStream;
      },
    };
    mockFile.createReadStream.and.returnValue(mockStream);
    const content = await mocked.readFile('testBucket', 'testFile');
    expect(mockStorage.bucket).toHaveBeenCalledWith('testBucket');
    expect(mockBucket.file).toHaveBeenCalledWith('testFile');
    expect(content).toEqual('some value');
  });

  it('fails on read error', async () => {
    const mockStream: any = {
      on: (event: string, callback: Function) => {
        switch (event) {
          case 'error': {
            callback('a bad time');
            break;
          }
        };
        return mockStream;
      },
    };
    mockFile.createReadStream.and.returnValue(mockStream);
    try {
      await mocked.readFile('testBucket', 'testFile');
      throw new Error('should not throw');
    } catch (e) {
      expect(e).toEqual('a bad time');
    }
  });

  it('writes a file', async () => {
    const mockStream: any = {
      on: (event: string, callback: Function) => {
        switch (event) {
          case 'finish': {
            callback();
            break;
          }
        };
        return mockStream;
      },
    };
    spyOn(mockStream, 'on').and.callThrough();
    mockFile.createWriteStream.and.returnValue(mockStream);
    await mocked.writeFile('testBucket', 'testFile');
    expect(mockStorage.bucket).toHaveBeenCalledWith('testBucket');
    expect(mockBucket.file).toHaveBeenCalledWith('testFile');
    expect(mockStream.on).toHaveBeenCalled();
  });

  it('fails on write error', async () => {
    const mockStream: any = {
      on: (event: string, callback: Function) => {
        switch (event) {
          case 'error': {
            callback('a bad time');
            break;
          }
        };
        return mockStream;
      },
    };
    mockFile.createWriteStream.and.returnValue(mockStream);
    try {
      await mocked.writeFile('testBucket', 'testFile');
      throw new Error('should not throw');
    } catch (e) {
      expect(e).toEqual('a bad time');
    }
  });
});
