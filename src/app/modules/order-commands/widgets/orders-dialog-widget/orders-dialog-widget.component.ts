import {Component, OnInit, ViewChild} from '@angular/core';
import {distinctUntilChanged, filter, Observable, shareReplay, switchMap, take, tap} from "rxjs";
import {ModalService} from "../../../../shared/services/modal.service";
import {Instrument} from "../../../../shared/models/instruments/instrument.model";
import {isPortfoliosEqual} from "../../../../shared/utils/portfolios";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {InstrumentsService} from "../../../instruments/services/instruments.service";
import {PortfolioKey} from "../../../../shared/models/portfolio-key.model";
import {NzTabComponent, NzTabSetComponent} from "ng-zorro-antd/tabs";
import {CommonParameters, CommonParametersService} from "../../services/common-parameters.service";
import {OrdersDialogService} from "../../../../shared/services/orders/orders-dialog.service";
import {OrderDialogParams, OrderType} from "../../../../shared/models/orders/orders-dialog.model";

@Component({
  selector: 'ats-orders-dialog-widget',
  templateUrl: './orders-dialog-widget.component.html',
  styleUrls: ['./orders-dialog-widget.component.less'],
  providers: [CommonParametersService]
})
export class OrdersDialogWidgetComponent implements OnInit {
  dialogParams$!: Observable<OrderDialogParams | null>;

  currentPortfolio$!: Observable<PortfolioKey>;
  currentInstrument$!: Observable<Instrument>;

  commonParameters$ = this.commonParametersService.parameters$;

  @ViewChild('orderTabs', {static: false})
  orderTabs?: NzTabSetComponent;
  @ViewChild('limitOrderTab', {static: false})
  limitOrderTab?: NzTabComponent;
  @ViewChild('marketOrderTab', {static: false})
  marketOrderTab?: NzTabComponent;
  @ViewChild('stopOrderTab', {static: false})
  stopOrderTab?: NzTabComponent;

  constructor(
    private readonly ordersDialogService: OrdersDialogService,
    private readonly modalService: ModalService,
    private readonly currentDashboardService: DashboardContextService,
    private readonly instrumentService: InstrumentsService,
    private readonly commonParametersService: CommonParametersService,
  ) {
  }

  ngOnInit(): void {
    this.dialogParams$ = this.ordersDialogService.newOrderDialogParameters$.pipe(
      tap(() => this.setCommonParameters({})),
      shareReplay(1)
    );

    this.currentPortfolio$ = this.currentDashboardService.selectedPortfolio$.pipe(
      distinctUntilChanged((previous, current) => isPortfoliosEqual(previous, current)),
      shareReplay(1)
    );

    this.currentInstrument$ = this.dialogParams$.pipe(
      filter((p): p is OrderDialogParams => !!p),
      switchMap(params => this.instrumentService.getInstrument(params.instrumentKey)),
      filter((i): i is Instrument => !!i),
      shareReplay(1)
    );
  }

  closeDialog() {
    this.ordersDialogService.closeNewOrderDialog();
  }

  openHelp() {
    this.modalService.openHelpModal('new-order');
  }

  setInitialTab() {
    this.dialogParams$.pipe(
      filter((p): p is OrderDialogParams => !!p),
      take(1)
    ).subscribe(params => {
      if (!params.initialValues?.orderType) {
        return;
      }

      switch (params.initialValues.orderType) {
        case OrderType.Limit:
          this.activateCommandTab(this.limitOrderTab);
          break;
        case OrderType.Market:
          this.activateCommandTab(this.marketOrderTab);
          break;
        case OrderType.Stop:
          this.activateCommandTab(this.stopOrderTab);
          break;
        default:
          throw new Error(`Unknown order type ${params.initialValues.orderType}`);
      }
    });
  }

  setCommonParameters(params: Partial<CommonParameters>) {
    this.commonParametersService.setParameters(params);
  }

  private activateCommandTab(targetTab?: NzTabComponent) {
    if (!targetTab || targetTab.position == null) {
      return;
    }

    this.orderTabs?.setSelectedIndex(targetTab.position);
  }
}