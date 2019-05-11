import {spyOnClass} from 'jasmine-es6-spies';
import * as proxyquire from 'proxyquire';

import {Calendaring} from '../src/calendaring';
import {GapiClient} from '../src/gapi-client';

describe('Calendaring', () => {
  let mockGapiClient: GapiClient;
  let mockCalendar: any;
  let mockCalendarApi: any;
  let instance: Calendaring;

  beforeEach(() => {
    spyOn(console, 'log');
    spyOn(console, 'warn');
    spyOn(console, 'error');
    mockCalendarApi = {
      events: {
        list: jasmine.createSpy(),
        update: jasmine.createSpy(),
      },
    };
    mockCalendar = jasmine.createSpy().and.returnValue(mockCalendarApi);
    const mocked = proxyquire.noCallThru().load('../src/calendaring', {
      'googleapis': {
        google: {
          calendar: mockCalendar,
        },
      },
    });
    mockGapiClient = spyOnClass(GapiClient);
    instance = new mocked.Calendaring(mockGapiClient);
  });

  it('initializes correctly', () => {
    expect(instance).toBeDefined();
    expect(mockCalendar).toHaveBeenCalledWith({
      version: 'v3',
      auth: mockGapiClient.auth,
    });
  });

  it('does not book customers for ineligible skus', async() => {
    await instance.book({
      user_id: 5667,
      line_items: [{sku: '12345'}],
    });
    expect(mockCalendarApi.events.list).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Calendaring skipping sku 12345.');
  });

  it('does not book customers already booked', async() => {
    const expectedCalendarId =
        'morganlatimer.com_kpl73s5ioudnrjflmnulj6uhqo@group.calendar.google.com';
    const fakeApiResponse = {
      data: {
        items: [
          {
            id: 'abc123',
            attendees: [{email: 'Anthonymays@MORGANLATIMER.COM'}],
          },
        ],
      },
    };
    mockCalendarApi.events.list.and.callFake((req: any, callback: Function) => {
      expect(req.calendarId).toBe(expectedCalendarId);
      expect(req.q).toBe('#CG12345');
      callback(undefined, fakeApiResponse);
    });
    await instance.book({
      user_id: 5667,
      billing_email: 'AnthonyMays@morganLatimer.com',
      line_items: [{sku: 'CG12345'}],
    });
    expect(console.log)
        .toHaveBeenCalledWith(
            'Searching for event with sku #CG12345 for customer 5667.');
    expect(console.log)
        .toHaveBeenCalledWith('Customer 5667 already invited to event abc123.');
    expect(mockCalendarApi.events.update).not.toHaveBeenCalled();
  });

  it('warns when event not found', async() => {
    const fakeApiResponse = {
      data: {
        items: [],
      },
    };
    mockCalendarApi.events.list.and.callFake(
        (_req: any, callback: Function) => {
          callback(undefined, fakeApiResponse);
        });
    await instance.book({
      user_id: 5667,
      billing_email: 'AnthonyMays@morganLatimer.com',
      line_items: [{sku: 'CG12345'}],
    });
    expect(console.warn)
        .toHaveBeenCalledWith('Event not found for sku #CG12345.');
  });

  it('books customers successfully', async() => {
    const expectedCalendarId =
        'morganlatimer.com_kpl73s5ioudnrjflmnulj6uhqo@group.calendar.google.com';
    const fakeApiResponse = {
      data: {
        items: [
          {
            id: 'abc123',
          },
        ],
      },
    };
    mockCalendarApi.events.list.and.callFake(
        (_req: any, callback: Function) => {
          callback(undefined, fakeApiResponse);
        });
    mockCalendarApi.events.update.and.callFake(
        (req: any, callback: Function) => {
          expect(req).toEqual({
            calendarId: expectedCalendarId,
            eventId: 'abc123',
            resource: {
              id: 'abc123',
              attendees: [{email: 'anthonymays@morganlatimer.com'}],
            },
          });
          callback(undefined, {});
        });
    await instance.book({
      user_id: 5667,
      billing_email: 'AnthonyMays@morganLatimer.com',
      line_items: [{sku: 'CG12345'}],
    });
    expect(mockCalendarApi.events.update).toHaveBeenCalled();
  });
});
