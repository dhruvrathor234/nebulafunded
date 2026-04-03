import { Symbol, Candle } from '../types';

const cache: Record<string, Candle[]> = {};

export const ASSETS: Symbol[] = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 
  'EURUSD', 'GBPUSD', 'AUDUSD', 'USDJPY', 'USDCAD', 'USDCHF', 'NZDUSD',
  'EURGBP', 'EURJPY', 'GBPJPY', 'EURCHF',
  'XAUUSD'
];

// Binance API Mapping
const BINANCE_MAPPING: Record<string, string> = {
  'BTCUSDT': 'BTCUSDT',
  'ETHUSDT': 'ETHUSDT',
  'SOLUSDT': 'SOLUSDT',
  'EURUSD': 'EURUSDT',
  'GBPUSD': 'GBPUSDT',
  'AUDUSD': 'AUDUSDT',
  'USDJPY': 'USDJPY',
  'USDCAD': 'USDCAD',
  'USDCHF': 'USDCHF',
  'NZDUSD': 'NZDUSDT',
  'EURGBP': 'EURGBP',
  'EURJPY': 'EURJPY',
  'GBPJPY': 'GBPJPY',
  'EURCHF': 'EURCHF',
  'XAUUSD': 'PAXGUSDT'
};

export const getCachedCandlesSync = (symbol: Symbol, timeframe: string): Candle[] | null => {
  return cache[`${symbol}_${timeframe}`] || null;
};

export const fetchCandles = async (symbol: Symbol, timeframe: string, count: number = 500): Promise<Candle[]> => {
  const key = `${symbol}_${timeframe}`;
  const binanceSymbol = BINANCE_MAPPING[symbol] || symbol;
  
  try {
    const intervalMap: Record<string, string> = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '30m': '30m',
      '45m': '1h',
      '1h': '1h',
      '2h': '2h',
      '4h': '4h',
      '1d': '1d',
      '1w': '1w'
    };

    const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${intervalMap[timeframe] || '1m'}&limit=${count}`);
    const data = await response.json();

    const candles: Candle[] = data.map((d: any) => ({
      time: d[0],
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4])
    }));

    cache[key] = candles;
    return candles;
  } catch (error) {
    console.error('Error fetching candles:', error);
    // Fallback to simulation if API fails
    return [];
  }
};

export type PriceCallback = (symbol: Symbol, price: number, candle?: Candle) => void;

class PriceWebSocket {
  private ws: WebSocket | null = null;
  private callbacks: Set<PriceCallback> = new Set();
  private isConnecting: boolean = false;

  connect(symbols: Symbol[], callback: PriceCallback, timeframe: string = '1m') {
    this.callbacks.add(callback);
    
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) return;

    this.isConnecting = true;
    const intervalMap: Record<string, string> = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '30m': '30m',
      '45m': '1h',
      '1h': '1h',
      '2h': '2h',
      '4h': '4h',
      '1d': '1d',
      '1w': '1w'
    };
    const interval = intervalMap[timeframe] || '1m';

    const streams = ASSETS.flatMap(s => [
      `${(BINANCE_MAPPING[s] || s).toLowerCase()}@kline_${interval}`,
      `${(BINANCE_MAPPING[s] || s).toLowerCase()}@aggTrade`
    ]).join('/');
    this.ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`);

    this.ws.onopen = () => {
      this.isConnecting = false;
      console.log('Binance WebSocket Connected');
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.e === 'kline') {
        const k = data.k;
        const symbol = Object.keys(BINANCE_MAPPING).find(key => BINANCE_MAPPING[key] === data.s) as Symbol || data.s;
        
        const candle: Candle = {
          time: k.t,
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c)
        };

        this.callbacks.forEach(cb => cb(symbol, candle.close, candle));
      } else if (data.e === 'aggTrade') {
        const symbol = Object.keys(BINANCE_MAPPING).find(key => BINANCE_MAPPING[key] === data.s) as Symbol || data.s;
        const price = parseFloat(data.p);
        this.callbacks.forEach(cb => cb(symbol, price));
      }
    };

    this.ws.onclose = () => {
      this.isConnecting = false;
      this.ws = null;
      if (this.callbacks.size > 0) {
        setTimeout(() => this.connect(ASSETS, Array.from(this.callbacks)[0]), 5000);
      }
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket Error:', err);
      this.ws?.close();
    };
  }

  disconnect(callback: PriceCallback) {
    this.callbacks.delete(callback);
    if (this.callbacks.size === 0 && this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const priceWS = new PriceWebSocket();
