﻿import {Component, DestroyRef, EventEmitter, Input, OnDestroy, Output} from "@angular/core";
import {BehaviorSubject, combineLatest, Observable, shareReplay, switchMap} from "rxjs";
import {PortfolioKey} from "../../../../shared/models/portfolio-key.model";
import {Instrument} from "../../../../shared/models/instruments/instrument.model";
import {filter, map} from "rxjs/operators";
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {InstrumentsService} from "../../../instruments/services/instruments.service";
import {AbstractControl, FormControl, Validators} from "@angular/forms";
import {inputNumberValidation} from "../../../../shared/utils/validation-options";
import {AtsValidators} from "../../../../shared/utils/form-validators";
import {OrderFormState} from "../../models/order-form.model";

@Component({
  template: ''
})
export abstract class BaseEditOrderFormComponent implements OnDestroy {
  formInstrument$!: Observable<Instrument>;
  readonly portfolioKey$ = new BehaviorSubject<PortfolioKey | null>(null);
  readonly orderId$ = new BehaviorSubject<string | null>(null);

  @Output()
  formStateChanged = new EventEmitter<OrderFormState>();

  protected constructor(
    protected readonly instrumentService: InstrumentsService,
    protected readonly destroyRef: DestroyRef
  ) {
  }

  @Input({required: true})
  set portfolioKey(value: PortfolioKey) {
    this.portfolioKey$.next(value);
  }

  @Input({required: true})
  set orderId(value: string) {
    this.orderId$.next(value);
  }

  ngOnDestroy(): void {
    this.portfolioKey$.complete();
    this.orderId$.complete();
  }

  protected initFormInstrument(instrumentKey$: Observable<InstrumentKey>) {
    this.formInstrument$ = instrumentKey$.pipe(
      switchMap(instrumentKey => this.instrumentService.getInstrument(instrumentKey)),
      filter((i): i is Instrument => !!i),
      shareReplay(1)
    );
  }

  protected getInstrumentWithPortfolio(): Observable<{ instrument: Instrument, portfolioKey: PortfolioKey }> {
    return combineLatest({
      instrument: this.formInstrument$,
      portfolioKey: this.portfolioKey$
    }).pipe(
      filter(x => !!x.instrument && !!x.portfolioKey),
      map(x => ({instrument: x.instrument!, portfolioKey: x.portfolioKey!})),
    );
  }

  protected enableControl(target: AbstractControl) {
    target.enable({emitEvent: false});
  }

  protected disableControl(target: AbstractControl) {
    target.disable({emitEvent: false});
  }

  protected setPriceValidators(target: FormControl<number | null>, newInstrument: Instrument) {
    target.clearValidators();
    target.addValidators([
      Validators.required,
      Validators.min(inputNumberValidation.negativeMin),
      Validators.max(inputNumberValidation.max),
      AtsValidators.priceStepMultiplicity(newInstrument.minstep)
    ]);
  }
}