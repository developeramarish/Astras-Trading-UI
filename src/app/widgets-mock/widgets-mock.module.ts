import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetsMockComponent } from './components/widgets-mock/widgets-mock.component';
import { WidgetsMockRoutingModule } from "./widgets-mock-routing.module";
import { LightChartModule } from "../modules/light-chart/light-chart.module";
import { WidgetSettingsService } from "../shared/services/widget-settings.service";
import { WidgetSettingsMockService } from "./services/widget-settings-mock.service";
import { LightChartDatafeedFactoryService } from "../modules/light-chart/services/light-chart-datafeed-factory.service";
import {
  LightChartDatafeedFactoryMockService
} from "./services/light-chart-datafeed-factory-service-mock.service";

@NgModule({
  declarations: [
    WidgetsMockComponent,
  ],
  imports: [
    CommonModule,
    WidgetsMockRoutingModule,
    LightChartModule
  ],
  providers: [
    {
      provide: WidgetSettingsService,
      useClass: WidgetSettingsMockService
    },
    {
      provide: LightChartDatafeedFactoryService,
      useClass: LightChartDatafeedFactoryMockService
    }
  ]
})
export class WidgetsMockModule { }
