import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { OrderbookService } from '../../services/orderbook.service';

@Component({
  selector: 'ats-orderbook-settings[settingsChange][guid]',
  templateUrl: './orderbook-settings.component.html',
  styleUrls: ['./orderbook-settings.component.less']
})
export class OrderbookSettingsComponent implements OnInit {
  @Input()
  guid!: string
  @Output()
  settingsChange: EventEmitter<void> = new EventEmitter();

  form!: FormGroup;

  constructor(private service: OrderbookService ) { }

  ngOnInit() {
    this.service.getSettings(this.guid).subscribe(settings => {
      if (settings) {
        this.form = new FormGroup({
          symbol: new FormControl(settings.symbol, [
            Validators.required,
            Validators.minLength(4)
          ]),
          exchange: new FormControl(settings.exchange, Validators.required),
          depth: new FormControl(settings.depth, [Validators.required, Validators.min(0), Validators.max(20)]),
          instrumentGroup: new FormControl(settings.instrumentGroup),
          showChart: new FormControl(settings.showChart),
          showTable: new FormControl(settings.showTable),
        });
      }
    })
  }

  submitForm(): void {
    this.service.setSettings({...this.form.value, guid: this.guid, linkToActive: false})
    this.settingsChange.emit()
  }
}