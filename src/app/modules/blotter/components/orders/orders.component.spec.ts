import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderCancellerService } from 'src/app/shared/services/order-canceller.service';
import { BlotterService } from '../../services/blotter.service';
import { MockServiceBlotter } from '../../utils/mock-blotter-service';

import { OrdersComponent } from './orders.component';
import {
  commonTestProviders, getTranslocoModule,
  mockComponent,
  sharedModuleImportForTests
} from '../../../../shared/utils/testing';
import { TimezoneConverterService } from '../../../../shared/services/timezone-converter.service';
import {of, Subject} from 'rxjs';
import { TimezoneConverter } from '../../../../shared/utils/timezone-converter';
import { TimezoneDisplayOption } from '../../../../shared/models/enums/timezone-display-option';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {OrdersGroupService} from "../../../../shared/services/orders/orders-group.service";
import {OrdersDialogService} from "../../../../shared/services/orders/orders-dialog.service";

describe('OrdersComponent', () => {
  let component: OrdersComponent;
  let fixture: ComponentFixture<OrdersComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    const cancelSpy = jasmine.createSpyObj('OrderCancellerService', ['cancelOrder']);
    const timezoneConverterServiceSpy = jasmine.createSpyObj('TimezoneConverterService', ['getConverter']);
    timezoneConverterServiceSpy.getConverter.and.returnValue(of(new TimezoneConverter(TimezoneDisplayOption.MskTime)));
    const settingsMock = {
      exchange: 'MOEX',
      portfolio: 'D39004',
      guid: '1230',
      ordersColumns: ['ticker'],
      tradesColumns: ['ticker'],
      positionsColumns: ['ticker'],
    };

    await TestBed.configureTestingModule({
      imports: [
        getTranslocoModule(),
        ...sharedModuleImportForTests
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: { getSettings: jasmine.createSpy('getSettings').and.returnValue(of(settingsMock)) }
        },
        { provide: BlotterService, useClass: MockServiceBlotter },
        { provide: OrderCancellerService, useValue: cancelSpy },
        { provide: TimezoneConverterService, useValue: timezoneConverterServiceSpy },
        {
          provide: OrdersGroupService,
          useValue: {
            getAllOrderGroups: jasmine.createSpy('getAllOrderGroups').and.returnValue(new Subject())
          }
        },
        {
          provide: OrdersDialogService,
          useValue: {
            openEditOrderDialog: jasmine.createSpy('openEditOrderDialog').and.callThrough()
          }
        },
        ...commonTestProviders
      ],
      declarations: [
        OrdersComponent,
        mockComponent({ selector: 'ats-table-filter', inputs: ['columns'] }),
        mockComponent({ selector: 'ats-instrument-badge-display', inputs: ['columns'] })
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
