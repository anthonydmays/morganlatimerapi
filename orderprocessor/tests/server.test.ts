import {Express} from 'express';
import {Server} from 'http';
import {spyOnClass} from 'jasmine-es6-spies';
import * as proxyquire from 'proxyquire';

import {Accounting} from '../src/accounting';
import {Calendaring} from '../src/calendaring';
import {GapiClient} from '../src/gapi-client';
import {IntuitClient} from '../src/intuit-client';

import express = require('express');
import request = require('supertest');

describe('server', () => {
  let mockIntuitClient: IntuitClient;
  let mockGapiClient: GapiClient;
  let mockAccounting: Accounting;
  let mockCalendaring: Calendaring;
  let app: Express;

  beforeEach(() => {
    spyOn(console, 'log');
    spyOn(console, 'error');

    mockIntuitClient = spyOnClass(IntuitClient);
    mockGapiClient = spyOnClass(GapiClient);
    mockAccounting = spyOnClass(Accounting);
    mockCalendaring = spyOnClass(Calendaring);

    const mockExpress = express();
    spyOn(mockExpress, 'listen').and.callFake(() => spyOnClass(Server));

    const mocked = proxyquire.noCallThru().load('../src/server', {
      './intuit-client': {
        IntuitClient: function() {
          return mockIntuitClient;
        },
      },
      './gapi-client': {
        GapiClient: function() {
          return mockGapiClient;
        },
      },
      './accounting': {
        Accounting: function() {
          return mockAccounting;
        },
      },
      './calendaring': {
        Calendaring: function() {
          return mockCalendaring;
        },
      },
      'express': function() {
        return mockExpress;
      }
    });

    app = mocked.app;
  });

  it('initializes correctly', async() => {
    expect(mockGapiClient.authorize).toHaveBeenCalled();
    expect(mockIntuitClient.authorize).toHaveBeenCalled();
  });

  it('reports status', async() => {
    const res = await request(app).get('/status');
    expect(res.text).toEqual('Running...');
  });

  it('forwards intuit auth', async() => {
    await request(app).get('/intuit_callback?value=123');
    expect(mockIntuitClient.fetchToken)
        .toHaveBeenCalledWith('/intuit_callback?value=123');
  });

  it('accepts orders', async() => {
    const order = {id: 1234};
    const res = await request(app).post('/orders').send(order);
    expect(res.text).toEqual('OK');
    expect(mockAccounting.send).toHaveBeenCalledWith(order);
    expect(mockCalendaring.book).toHaveBeenCalledWith(order);
  });
});
