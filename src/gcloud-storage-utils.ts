import {Storage} from '@google-cloud/storage';

const storage = new Storage();

export function readFile(bucket: string, name: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const file = await storage.bucket(bucket).file(name);
    const stream = file.createReadStream();
    let buf = '';
    stream
        .on('data',
            d => {
              buf += d;
            })
        .on('error',
            err => {
              reject(err);
            })
        .on('end', () => {
          resolve(buf);
        });
  });
}

export function writeFile(
    bucket: string, name: string, content: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const file = await storage.bucket(bucket).file(name);
    const stream = file.createWriteStream();
    stream
        .on('error',
            err => {
              reject(err);
            })
        .on('finish', () => {
          resolve();
        });
    stream.end(content);
  });
}

export const CONFIG_BUCKET = 'morganlatimerapi-config';
