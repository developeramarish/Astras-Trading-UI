import { Currency } from "../enums/currencies.model"
import { WidgetSettings } from "../widget-settings.model"

export interface BlotterSettings extends WidgetSettings {
  activeTabIndex: number,
  exchange: string,
  portfolio: string,
  currency: Currency,
  ordersColumns: string[],
  tradesColumns: string[],
  positionsColumns: string[],
}

export interface ColumnIds  {
  columnId: string,
  name: string,
  isDefault: boolean
}

export const allOrdersColumns: ColumnIds[] = [
  { columnId: 'id', name: "Номер", isDefault: false },
  { columnId: 'symbol', name: "Тикер", isDefault: true  },
  { columnId: 'side', name: "Сторона", isDefault: false  },
  { columnId: 'status', name: "Статус", isDefault: false  },
  { columnId: 'qty', name: "Кол-во", isDefault: false  },
  { columnId: 'residue', name: "Остаток", isDefault: true  },
  { columnId: 'volume', name: "Объем", isDefault: true  },
  { columnId: 'price', name: "Цена", isDefault: true  },
  { columnId: 'transTime', name: 'Время', isDefault: false  },
  { columnId: 'exchange', name: "Биржа", isDefault: false  },
  { columnId: 'type', name: "Тип", isDefault: false  },
  { columnId: 'endTime', name: "Действ. до", isDefault: false  },
]

export const allPositionsColumns: ColumnIds[] = [
  { columnId: 'symbol', name: "Тикер", isDefault: true  },
  { columnId: 'shortName', name: "Имя", isDefault: true  },
  { columnId: 'avgPrice', name: "Средняя", isDefault: true  },
  { columnId: 'qtyT0', name: "T0", isDefault: false  },
  { columnId: 'qtyT1', name: "T1", isDefault: false  },
  { columnId: 'qtyT2', name: "T2", isDefault: true  },
  { columnId: 'qtyTFuture', name: "TFuture", isDefault: false  }
]

export const allTradesColumns: ColumnIds[] = [
  { columnId: 'id', name: "Номер", isDefault: false  },
  { columnId: 'orderno', name: "Заявка", isDefault: false  },
  { columnId: 'symbol', name: "Тикер", isDefault: true  },
  { columnId: 'side', name: "Сторона", isDefault: true  },
  { columnId: 'price', name: "Цена", isDefault: true  },
  { columnId: 'qty', name: "Кол-во", isDefault: true  },
  { columnId: 'date', name: 'Время', isDefault: false  }
]