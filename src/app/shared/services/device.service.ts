import { Injectable } from '@angular/core';
import { from, shareReplay, map, Observable } from "rxjs";
import { NgxDeviceInfoService } from "ngx-device-info";
import { DeviceInfo } from "../models/device-info.model";

interface NgxDeviceInfo extends DeviceInfo {
  isTablet: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  constructor(private readonly deviceInfoService: NgxDeviceInfoService) {
  }

  deviceInfo$: Observable<DeviceInfo> = from<Promise<NgxDeviceInfo>>(this.deviceInfoService.getDeviceInfo())
    .pipe(
      map(info => ({ isMobile: info.isMobile || info.isTablet })),
      shareReplay(1)
    );
}
