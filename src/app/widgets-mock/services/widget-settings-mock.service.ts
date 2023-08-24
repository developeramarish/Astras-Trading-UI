import { Injectable } from '@angular/core';
import { LightChartSettings, TimeFrameDisplayMode } from "../../modules/light-chart/models/light-chart-settings.model";
import { Observable, of } from "rxjs";

@Injectable()
export class WidgetSettingsMockService {

  constructor() { }

  getSettings(): Observable<LightChartSettings> {
    return of({
      badgeColor: "yellow",
      exchange: "MOEX",
      guid: "cffd89b0-f063-4a21-8879-b5abe5b22689",
      height: 300,
      instrumentGroup: "TQBR",
      isin: "RU0007661625",
      linkToActive: true,
      symbol: "GAZP",
      timeFrame: "D",
      timeFrameDisplayMode: TimeFrameDisplayMode.Buttons,
      width: 300
    });
  }

  updateSettings() {}
}
