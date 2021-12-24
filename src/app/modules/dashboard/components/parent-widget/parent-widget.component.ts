import {
  ChangeDetectionStrategy,
  Component,
  Input,
  EventEmitter,
  ViewEncapsulation,
  OnInit,
} from '@angular/core';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { LightChartSettings } from 'src/app/shared/models/settings/light-chart-settings.model';
import { OrderbookSettings } from 'src/app/shared/models/settings/orderbook-settings.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { AnySettings } from '../../../../shared/models/settings/any-settings.model';

@Component({
  selector: 'ats-parent-widget[widget][resize]',
  templateUrl: './parent-widget.component.html',
  styleUrls: ['./parent-widget.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ParentWidgetComponent implements OnInit {

  @Input()
  widget!: Widget<AnySettings>;
  @Input()
  resize! : EventEmitter<DashboardItem>;

  shouldShowSettings: boolean = false;

  constructor() {  }

  ngOnInit(): void {}

  onSwitchSettings(value: boolean) {
    this.shouldShowSettings = value;
  }

  // angular templates doesn't support generics
  getWidget() : any {
    const isLightChartSettings = (s: AnySettings): s is LightChartSettings =>  'timeFrame' in s && 'from' in s;
    const isOrderbookSettings = (s: AnySettings): s is OrderbookSettings =>  'symbol' in s && 'exchange' in s;
    const settings = this.widget.settings
    if (isLightChartSettings(settings)) {
      return this.widget as Widget<LightChartSettings>
    }
    else if (isOrderbookSettings(settings)) {
      return this.widget as Widget<OrderbookSettings>
    }


    return this.widget;
  }
}
