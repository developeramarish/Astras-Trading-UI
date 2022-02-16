import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { catchError, filter, map, Observable, of, Subscription, switchMap } from 'rxjs';
import { HistoryService } from 'src/app/shared/services/history.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { getDayChange, getDayChangePerPrice } from 'src/app/shared/utils/price';
import { PriceData } from '../../models/price-data.model';
import { buyColor, sellColor } from 'src/app/shared/models/settings/styles-constants';
import { PositionsService } from 'src/app/shared/services/positions.service';
import { SyncService } from 'src/app/shared/services/sync.service';
import { PortfolioKey } from 'src/app/shared/models/portfolio-key.model';

@Component({
  selector: 'ats-command-header[symbol][exchange]',
  templateUrl: './command-header.component.html',
  styleUrls: ['./command-header.component.less']
})
export class CommandHeaderComponent implements OnInit, OnDestroy {
  @Input()
  symbol = ''
  @Input()
  exchange = ''
  @Input()
  instrumentGroup: string = ''

  priceData$: Observable<PriceData | null> = of(null)

  colors = {
    buyColor: buyColor,
    sellColor: sellColor
  }

  position = {
    abs: 0, quantity: 0
  }

  private positionSub?: Subscription

  constructor(
      private quoteService: QuotesService,
      private history: HistoryService,
      private positionService: PositionsService,
      private sync: SyncService) {
  }
  ngOnDestroy(): void {
    this.positionSub?.unsubscribe();
  }

  ngOnInit(): void {
    this.positionSub = this.sync.selectedPortfolio$.pipe(
      filter((p): p is PortfolioKey => !!p),
      switchMap(p => {
         return this.positionService.getByPortfolio(p.portfolio, p.exchange, this.symbol)
      })
    ).subscribe({
      next: (p) => {
        if (p) {
          this.position = { abs: Math.abs(p.qtyTFutureBatch), quantity: p.qtyTFutureBatch }
        }
      }, error: (e) => console.log(e)
    })

    this.priceData$ = this.history.getDaysOpen({
      symbol: this.symbol,
      exchange: this.exchange,
      instrumentGroup: this.instrumentGroup
    }).pipe(
      switchMap(candle => {
        return this.quoteService.getQuotes(
          this.symbol,
          this.exchange,
          this.instrumentGroup
        ).pipe(
          map(quote => ({ candle, quote }))
        )
      }),
      map((data) : PriceData => ({
        dayChange: getDayChange(data.quote.last_price, data.candle.close),
        dayChangePerPrice: getDayChangePerPrice(data.quote.last_price, data.candle.close),
        high: data.quote.high_price,
        low: data.quote.low_price,
        lastPrice: data.quote.last_price,
        ask: data.quote.ask,
        bid: data.quote.bid,
        dayOpen: data.candle.open,
        prevClose: data.candle.close
      }))
    )
  }

}