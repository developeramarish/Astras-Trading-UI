import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  Observable,
} from 'rxjs';
import { ContentSize } from '../../../../shared/models/dashboard/dashboard-item.model';
import {
  ScaleLinear,
  scaleLinear
} from 'd3';
import { ThemeService } from '../../../../shared/services/theme.service';
import {
  ThemeColors,
  ThemeSettings
} from '../../../../shared/models/settings/theme-settings.model';
import { map } from 'rxjs/operators';
import { AllTradesItem } from '../../../../shared/models/all-trades.model';
import { ScalperOrderBookDataContext } from '../../models/scalper-order-book-data-context.model';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CustomIteratorWrapper } from "../../../../shared/utils/array-iterators";
import { BodyRow } from "../../models/scalper-order-book.model";
import { TradesPanelSettings } from "../../models/scalper-order-book-settings.model";
import {
  AggregatedTrade,
  AggregatedTradesIterator
} from "../../utils/aggregated-trades-iterator";
import { Side } from "../../../../shared/models/enums/side.model";

interface LayerDrawer {
  zIndex: number;
  draw: () => void;
}

interface DrewItemMeta {
  xLeft: number;

  xRight: number;

  yTop: number;

  yBottom: number;

  connectionColor: string;
}

interface TradeDisplay {
  rowMinIndex: number;

  rowMaxIndex: number;

  volume: number;

  color: 'red' | 'green';
}

@Component({
  selector: 'ats-trades-panel',
  templateUrl: './trades-panel.component.html',
  styleUrls: ['./trades-panel.component.less']
})
export class TradesPanelComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas')
  canvas?: ElementRef<HTMLCanvasElement>;

  @Input({ required: true })
  xAxisStep!: number;

  @Input({ required: true })
  dataContext!: ScalperOrderBookDataContext;

  private readonly zIndexes = {
    gridLines: 0,
    item: 10,
    itemsConnector: 5
  };

  private readonly tradeItemFontSettings = {
    fontFace: 'Arial',
    fontSize: 10
  };

  private readonly margins = {
    tradePoint: {
      text: {
        left: 2,
        right: 2
      }
    }
  };

  private readonly contentSize$ = new BehaviorSubject<ContentSize>({ width: 0, height: 0 });
  private displayPriceItems$!: Observable<BodyRow[]>;

  constructor(
    private readonly themeService: ThemeService,
    private readonly destroyRef: DestroyRef) {
  }

  ngAfterViewInit(): void {
    const panelSettings$ = this.dataContext.extendedSettings$.pipe(
      map(s => s.widgetSettings.tradesPanelSettings),
      map(s => s ?? ({
        minTradeVolumeFilter: 0,
        hideFilteredTrades: false,
        tradesAggregationPeriodMs: 0
      } as TradesPanelSettings)),
      distinctUntilChanged((prev, curr) => {
        return prev.minTradeVolumeFilter === curr.minTradeVolumeFilter
          && prev.hideFilteredTrades === curr.hideFilteredTrades
          && prev.tradesAggregationPeriodMs === curr.tradesAggregationPeriodMs;
      })
    );

    combineLatest([
      this.contentSize$,
      this.displayPriceItems$,
      this.dataContext.trades$,
      panelSettings$,
      this.themeService.getThemeSettings()
    ]).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(([size, priceItems, trades, panelSettings, themeSettings]) => {
      const canvas = this.canvas?.nativeElement!;
      const context = canvas.getContext('2d')!;

      context.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = size!.width;
      canvas.height = priceItems.length * this.xAxisStep;

      this.draw(
        canvas,
        themeSettings,
        panelSettings,
        priceItems,
        trades
      );
    });
  }

  sizeChanged(entries: ResizeObserverEntry[]): void {
    entries.forEach(x => {
      this.contentSize$.next({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
    });
  }

  ngOnDestroy(): void {
    this.contentSize$.complete();
  }

  ngOnInit(): void {
    this.displayPriceItems$ = combineLatest([
      this.dataContext.orderBookBody$,
      this.dataContext.displayRange$
    ]).pipe(
      filter(([, displayRange]) => !!displayRange),
      map(([body, displayRange]) => {
        return body
          .slice(displayRange!.start, Math.min(displayRange!.end + 1, body.length));
      }),
      filter(priceItems => priceItems.length > 0),
    );
  }

  private draw(
    canvas: HTMLCanvasElement,
    themeSettings: ThemeSettings,
    panelSettings: TradesPanelSettings,
    priceItems: BodyRow[],
    orderedTrades: AllTradesItem[]
  ): void {
    const context = canvas.getContext('2d')!;
    const xScale = scaleLinear([0, canvas.width])
      .domain([0, canvas.width]);
    const yScale = scaleLinear([0, canvas.height])
      .domain([0, priceItems.length]);

    let layers: LayerDrawer[] = [];

    layers.push(this.drawGridLines(priceItems.length, xScale, yScale, context, themeSettings.themeColors));

    const itemsDraws: LayerDrawer[] = [];
    let prevItem: DrewItemMeta | null = null;
    for (const trade of new CustomIteratorWrapper(() => new AggregatedTradesIterator(orderedTrades, panelSettings.tradesAggregationPeriodMs))) {
      if (trade == null) {
        continue;
      }

      const currentItem = this.drawTrade(
        trade,
        priceItems,
        prevItem,
        xScale,
        yScale,
        context,
        panelSettings,
        themeSettings.themeColors
      );

      if (currentItem == null) {
        continue;
      }

      if (currentItem.meta.xRight < 0) {
        break;
      }

      itemsDraws.push(currentItem.drawer);

      if (!!prevItem) {
        layers.push(this.drawItemsConnection(
          currentItem.meta,
          prevItem,
          prevItem.connectionColor,
          context
        ));
      }

      prevItem = currentItem.meta;
    }

    layers = [
      ...layers,
      ...itemsDraws.reverse()
    ];

    layers
      .sort((a, b) => {
        if (a.zIndex < b.zIndex) {
          return -1;
        }

        if (a.zIndex > b.zIndex) {
          return 1;
        }

        return 0;
      })
      .forEach(x => x.draw());
  }

  private drawTrade(
    trade: AggregatedTrade,
    priceItems: BodyRow[],
    prevItem: DrewItemMeta | null,
    xScale: ScaleLinear<number, number>,
    yScale: ScaleLinear<number, number>,
    context: CanvasRenderingContext2D,
    panelSettings: TradesPanelSettings,
    themeColors: ThemeColors,): { meta: DrewItemMeta, drawer: LayerDrawer } | null {
    let mappedMinPriceIndex = -1;
    let mappedMaxPriceIndex = -1;

    const isFiltered = trade.volume < panelSettings.minTradeVolumeFilter;

    for (let index = 0; index < priceItems.length; index++) {
      const priceRow = priceItems[index];
      if (trade.minPrice >= priceRow.baseRange.min && trade.minPrice <= priceRow.baseRange.max) {
        mappedMinPriceIndex = index;
      }

      if (trade.maxPrice >= priceRow.baseRange.min && trade.maxPrice <= priceRow.baseRange.max) {
        mappedMaxPriceIndex = index;
      }

      if (mappedMinPriceIndex >= 0 && mappedMaxPriceIndex >= 0) {
        break;
      }
    }

    const tradeDisplay: TradeDisplay = {
      rowMinIndex: mappedMinPriceIndex,
      rowMaxIndex: mappedMaxPriceIndex,
      color: trade.side === Side.Buy ? 'green' : 'red',
      volume: trade.volume
    };

    let currentItem: { meta: DrewItemMeta, drawer: LayerDrawer } | null;

    if (tradeDisplay.rowMaxIndex >= 0 || tradeDisplay.rowMinIndex >= 0) {
      if (isFiltered) {
        currentItem = this.drawFilteredItem(
          tradeDisplay,
          prevItem,
          xScale,
          yScale,
          context,
          themeColors,
          panelSettings.hideFilteredTrades,
          false
        );
      } else {
        currentItem = this.drawInnerItem(
          tradeDisplay,
          prevItem,
          xScale,
          yScale,
          context,
          themeColors,
          false
        );
      }
    } else if (trade.minPrice < priceItems[0].baseRange.max && trade.maxPrice > priceItems[priceItems.length - 1].baseRange.min) {
      const correctedTrade = {
        ...tradeDisplay,
        rowMinIndex: this.getNearestPriceIndex(trade.minPrice, priceItems),
        rowMaxIndex: this.getNearestPriceIndex(trade.maxPrice, priceItems),
      };

      if (isFiltered) {
        currentItem = this.drawFilteredItem(
          correctedTrade,
          prevItem,
          xScale,
          yScale,
          context,
          themeColors,
          panelSettings.hideFilteredTrades,
          true
        );
      } else {
        currentItem = this.drawInnerItem(
          correctedTrade,
          prevItem,
          xScale,
          yScale,
          context,
          themeColors,
          true
        );
      }
    } else {
      const rowIndex = trade.minPrice > priceItems[0].baseRange.max
        ? 0
        : priceItems.length;

      currentItem = this.drawOuterItem(
        tradeDisplay,
        rowIndex,
        prevItem,
        xScale,
        yScale,
        context,
        themeColors
      );
    }

    return currentItem;
  }

  private getNearestPriceIndex(tradePrice: number, priceItems: BodyRow[]): number {
    let index = 0;
    for (let i = priceItems.length - 1; i >= 0; i--) {
      if (tradePrice < priceItems[i].baseRange.min) {
        break;
      }

      index = i;
    }

    return index;
  }

  private drawItemsConnection(
    item1Meta: DrewItemMeta,
    item2Meta: DrewItemMeta,
    color: string,
    context: CanvasRenderingContext2D
  ): LayerDrawer {
    return {
      zIndex: this.zIndexes.itemsConnector,
      draw: (): void => {
        context.beginPath();
        context.moveTo(this.getMetaCenterX(item1Meta)!, this.getMetaCenterY(item1Meta)!);
        context.lineTo(this.getMetaCenterX(item2Meta)!, this.getMetaCenterY(item2Meta)!);
        context.strokeStyle = color;
        context.lineWidth = 1;
        context.stroke();
      }
    };
  }

  private drawInnerItem(
    item: TradeDisplay,
    prevItemMeta: DrewItemMeta | null,
    xScale: ScaleLinear<number, number>,
    yScale: ScaleLinear<number, number>,
    context: CanvasRenderingContext2D,
    themeColors: ThemeColors,
    isGhostTrade: boolean
  ): { meta: DrewItemMeta, drawer: LayerDrawer } {
    const rowMinIndex = item.rowMinIndex >= 0 ? item.rowMinIndex : item.rowMaxIndex;
    const rowMaxIndex = item.rowMaxIndex >= 0 ? item.rowMaxIndex : item.rowMinIndex;

    const prevLeftX = prevItemMeta?.xLeft ?? xScale(xScale.domain()[1]);
    const yTop = yScale(rowMaxIndex);
    const yBottom = yScale(rowMinIndex) + this.xAxisStep;

    const itemText = item.volume.toString();
    context.textBaseline = 'middle';
    context.font = `${this.tradeItemFontSettings.fontSize}px ${this.tradeItemFontSettings.fontFace}`;
    const textMetrics = context.measureText(itemText);
    const textWidth = Math.ceil(textMetrics.width);
    const textMargins = this.margins.tradePoint.text.left + this.margins.tradePoint.text.right;

    const itemWidth = Math.max(textWidth + textMargins, textMetrics.fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent, this.xAxisStep);
    let xRight = prevItemMeta != null
      ? Math.floor(prevItemMeta.xLeft + (prevItemMeta.xRight - prevItemMeta.xLeft) / 2)
      : xScale(xScale.domain()[1]);

    if ((xRight - itemWidth / 2) > prevLeftX) {
      xRight = Math.floor(prevLeftX + itemWidth / 2);
    }

    const xRadius = Math.ceil(itemWidth / 2);
    const xCenter = Math.floor(xRight - xRadius);
    const yCenter = Math.floor(yTop + ((yBottom - yTop) / 2));
    const yRadius = Math.max(xRadius, Math.ceil((yBottom - yTop) / 2));

    const draw = (): void => {
      context.beginPath();
      context.ellipse(xCenter, yCenter, xRadius, yRadius, 0, 0, 2 * Math.PI);
      context.fillStyle = isGhostTrade
        ? themeColors.componentBackground
        : (item.color === 'green' ? themeColors.buyColor : themeColors.sellColor);
      context.fill();

      context.strokeStyle = isGhostTrade
        ? (item.color === 'green' ? themeColors.buyColor : themeColors.sellColor)
        : themeColors.textMaxContrastColor;
      context.stroke();

      context.fillStyle = isGhostTrade
        ? themeColors.textColor
        : themeColors.buySellBtnTextColor;
      context.textAlign = 'center';
      context.fillText(itemText, xCenter, yCenter);
    };

    return {
      drawer: {
        zIndex: this.zIndexes.item,
        draw
      },
      meta: {
        xLeft: Math.floor(xCenter - xRadius),
        xRight: Math.ceil(xCenter + xRadius),
        yTop,
        yBottom,
        connectionColor: item.color === 'green' ? themeColors.buyColorBackground : themeColors.sellColorBackground,
      }
    };
  }

  private drawFilteredItem(
    item: TradeDisplay,
    prevItemMeta: DrewItemMeta | null,
    xScale: ScaleLinear<number, number>,
    yScale: ScaleLinear<number, number>,
    context: CanvasRenderingContext2D,
    themeColors: ThemeColors,
    isHidden: boolean,
    isGhostTrade: boolean
  ): { meta: DrewItemMeta, drawer: LayerDrawer } {
    const rowMinIndex = item.rowMinIndex >= 0 ? item.rowMinIndex : item.rowMaxIndex;
    const rowMaxIndex = item.rowMaxIndex >= 0 ? item.rowMaxIndex : item.rowMinIndex;

    const prevLeftX = prevItemMeta?.xLeft ?? xScale(xScale.domain()[1]);
    const yTop = yScale(rowMaxIndex);
    const yBottom = yScale(rowMinIndex) + this.xAxisStep;

    const itemWidth = Math.max(4, Math.round(this.xAxisStep / 2));
    const xLeft = Math.ceil(prevLeftX - itemWidth);
    const itemHeight = rowMinIndex === rowMaxIndex
      ? itemWidth
      : Math.floor(yBottom - yTop);

    const itemTopY = rowMinIndex === rowMaxIndex
      ? Math.ceil(yTop + (this.xAxisStep / 2) - (itemHeight / 2))
      : yTop;

    const draw = (): void => {
      if (isHidden) {
        return;
      }

      this.drawRoundedRect(xLeft, itemTopY, itemWidth, itemHeight, 2, context);

      context.fillStyle = isGhostTrade
        ? themeColors.componentBackground
        : (item.color === 'green' ? themeColors.buyColor : themeColors.sellColor);
      context.fill();

      context.strokeStyle = isGhostTrade
        ? (item.color === 'green' ? themeColors.buyColor : themeColors.sellColor)
        : themeColors.textMaxContrastColor;
      context.stroke();
    };

    return {
      drawer: {
        zIndex: this.zIndexes.item,
        draw
      },
      meta: {
        xLeft: xLeft,
        xRight: Math.ceil(xLeft + itemWidth),
        yTop,
        yBottom,
        connectionColor: item.color === 'green' ? themeColors.buyColorBackground : themeColors.sellColorBackground,
      }
    };
  }

  private drawRoundedRect(x: number, y: number, width: number, height: number, radius: number, context: CanvasRenderingContext2D): void {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();
  }

  private drawOuterItem(
    item: TradeDisplay,
    rowIndex: number,
    prevItemMeta: DrewItemMeta | null,
    xScale: ScaleLinear<number, number>,
    yScale: ScaleLinear<number, number>,
    context: CanvasRenderingContext2D,
    themeColors: ThemeColors
  ): { meta: DrewItemMeta, drawer: LayerDrawer } {
    const prevLeftX = prevItemMeta?.xLeft ?? xScale(xScale.domain()[1]);
    const xRight = Math.floor(prevLeftX - this.xAxisStep);

    const yTop = yScale(rowIndex);
    const yBottom = yTop + this.xAxisStep;

    const xRadius = Math.ceil(this.xAxisStep / 2);
    const xCenter = Math.floor(xRight - xRadius);
    const yCenter = Math.floor(yTop + ((yBottom - yTop) / 2));
    const yRadius = Math.max(xRadius, Math.ceil((yBottom - yTop) / 2));

    const draw = (): void => {
      context.beginPath();
      context.ellipse(xCenter, yCenter, xRadius, yRadius, 0, 0, 2 * Math.PI);
      context.strokeStyle = item.color === 'green' ? themeColors.buyColorBackground : themeColors.sellColorBackground;
      context.stroke();
    };

    return {
      drawer: {
        zIndex: this.zIndexes.item,
        draw
      },
      meta: {
        xLeft: Math.floor(xRight - this.xAxisStep),
        xRight,
        yTop,
        yBottom,
        connectionColor: item.color === 'green' ? themeColors.buyColorBackground : themeColors.sellColorBackground
      }
    };
  }

  private drawGridLines(
    rowsCount: number,
    xScale: ScaleLinear<number, number>,
    yScale: ScaleLinear<number, number>,
    context: CanvasRenderingContext2D,
    themeColors: ThemeColors): LayerDrawer {
    const draw = (): void => {
      for (let i = 5; i < rowsCount; i = i + 5) {
        context.beginPath();
        context.moveTo(xScale(0), yScale(i) - 0.5);
        context.lineTo(xScale(xScale.domain()[1]), yScale(i));
        context.strokeStyle = themeColors.chartGridColor;
        context.lineWidth = 1;
        context.stroke();
      }
    };

    return {
      zIndex: this.zIndexes.gridLines,
      draw
    };
  }

  private getMetaCenterX(item: DrewItemMeta | null): number | null {
    if (!item) {
      return null;
    }

    return this.getCenter(item.xLeft, item.xRight);
  }

  private getMetaCenterY(item: DrewItemMeta | null): number | null {
    if (!item) {
      return null;
    }

    return this.getCenter(item.yTop, item.yBottom);
  }

  private getCenter(start: number, end: number): number {
    return start + (end - start) / 2;
  }
}
