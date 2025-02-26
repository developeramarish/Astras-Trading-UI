import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BottomFloatingPanelComponent } from './bottom-floating-panel.component';
import { mockComponent } from "../../../../shared/utils/testing";
import {
  BehaviorSubject,
  Subject
} from "rxjs";
import { ScalperOrderBookDataContext } from "../../models/scalper-order-book-data-context.model";
import { LetDirective } from "@ngrx/component";

describe('BottomFloatingPanelComponent', () => {
  let component: BottomFloatingPanelComponent;
  let fixture: ComponentFixture<BottomFloatingPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        LetDirective
      ],
      declarations: [
        BottomFloatingPanelComponent,
        mockComponent({ selector: 'ats-modifiers-indicator'}),
        mockComponent({ selector: 'ats-working-volumes-panel', inputs: ['guid', 'isActive']}),
        mockComponent({ selector: 'ats-short-long-indicator', inputs: ['dataContext']}),
      ]
    });
    fixture = TestBed.createComponent(BottomFloatingPanelComponent);
    component = fixture.componentInstance;
    component.dataContext = {
      extendedSettings$: new Subject(),
      orderBook$: new Subject(),
      position$: new Subject(),
      currentOrders$: new Subject(),
      currentPortfolio$: new Subject(),
      trades$: new Subject(),
      orderBookBody$: new Subject(),
      displayRange$: new Subject(),
      workingVolume$: new Subject(),
      scaleFactor$: new BehaviorSubject(1)
    } as ScalperOrderBookDataContext;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
