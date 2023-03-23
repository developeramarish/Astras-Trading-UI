import { Component, OnDestroy, OnInit } from '@angular/core';
import { fromEvent, Observable, Subject } from "rxjs";
import { Store } from "@ngrx/store";
import { initWidgetSettings } from "../../../../store/widget-settings/widget-settings.actions";
import { PortfoliosActions } from "../../../../store/portfolios/portfolios.actions";
import { MobileDashboardActions } from "../../../../store/mobile-dashboard/mobile-dashboard-actions";
import { map, startWith } from "rxjs/operators";

@Component({
  selector: 'ats-mobile-dashboard-widget',
  templateUrl: './mobile-dashboard-widget.component.html',
  styleUrls: ['./mobile-dashboard-widget.component.less']
})
export class MobileDashboardWidgetComponent implements OnInit, OnDestroy {
  private destroy$: Subject<boolean> = new Subject<boolean>();

  screenHeight!: Observable<number>;

  constructor(
    private readonly store: Store
  ) {
  }

  ngOnInit(): void {
    this.store.dispatch(initWidgetSettings());
    this.store.dispatch(PortfoliosActions.initPortfolios());
    this.store.dispatch(MobileDashboardActions.initMobileDashboard());
    this.screenHeight = fromEvent(window, 'resize')
      .pipe(
        map(() => (window.screen.height / window.devicePixelRatio)),
        startWith(window.screen.height / window.devicePixelRatio)
      );
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}