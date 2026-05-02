export type Symbol = 
  | 'BTCUSDT' | 'ETHUSDT' | 'SOLUSDT' 
  | 'EURUSD' | 'GBPUSD' | 'AUDUSD' | 'USDJPY' | 'USDCAD' | 'USDCHF' | 'NZDUSD'
  | 'EURGBP' | 'EURJPY' | 'GBPJPY' | 'EURCHF'
  | 'XAUUSD';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface Trade {
  id: string;
  symbol: Symbol;
  type: 'BUY' | 'SELL';
  lotSize: number;
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  status: 'OPEN' | 'CLOSED' | 'BREACHED';
  pnl: number;
  timestamp: number;
}

export interface Challenge {
  id: string;
  title: string;
  size: number;
  price: string;
  profitTarget: number;
  dailyDrawdown: number;
  maxDrawdown: number;
  leverage: number;
  status: 'ACTIVE' | 'BREACHED' | 'SUCCESS' | 'PENDING_VERIFICATION';
  initialBalance: number;
  currentBalance: number;
  equity: number;
  maxEquityToday: number;
  startDate: number;
  history: Trade[];
}
