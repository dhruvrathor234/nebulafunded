import React, { useEffect, useRef } from 'react';
import { Symbol } from '../types';

interface TradingViewWidgetProps {
  symbol: Symbol;
  interval?: string;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({ symbol, interval = "1" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  // Map our symbols to TradingView symbols
  const getTVSymbol = (s: Symbol) => {
    const mapping: Record<string, string> = {
      'BTCUSDT': 'BINANCE:BTCUSDT',
      'ETHUSDT': 'BINANCE:ETHUSDT',
      'SOLUSDT': 'BINANCE:SOLUSDT',
      'EURUSD': 'FX:EURUSD',
      'GBPUSD': 'FX:GBPUSD',
      'AUDUSD': 'FX:AUDUSD',
      'USDJPY': 'FX:USDJPY',
      'USDCAD': 'FX:USDCAD',
      'USDCHF': 'FX:USDCHF',
      'NZDUSD': 'FX:NZDUSD',
      'EURGBP': 'FX:EURGBP',
      'EURJPY': 'FX:EURJPY',
      'GBPJPY': 'FX:GBPJPY',
      'EURCHF': 'FX:EURCHF',
      'XAUUSD': 'OANDA:XAUUSD'
    };
    return mapping[s] || `BINANCE:${s}`;
  };

  useEffect(() => {
    const containerId = `tradingview_${symbol}_${interval}`;
    if (containerRef.current) {
      containerRef.current.id = containerId;
    }

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (containerRef.current && window.TradingView) {
        widgetRef.current = new window.TradingView.widget({
          "autosize": true,
          "symbol": getTVSymbol(symbol),
          "interval": interval,
          "timezone": "Etc/UTC",
          "theme": "dark",
          "style": "1",
          "locale": "en",
          "toolbar_bg": "#0b0f1a",
          "enable_publishing": false,
          "hide_side_toolbar": false,
          "allow_symbol_change": true,
          "container_id": containerId,
          "backgroundColor": "#0b0f1a",
          "gridColor": "rgba(255, 255, 255, 0.02)",
          "loading_screen": { "backgroundColor": "#0b0f1a" },
          "withdateranges": true,
          "hide_top_toolbar": false,
          "save_image": false,
          "details": true,
          "hotlist": true,
          "calendar": true,
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, [symbol, interval]);

  return (
    <div className="h-full w-full bg-[#0b0f1a]">
      <div 
        ref={containerRef} 
        className="h-full w-full" 
      />
    </div>
  );
};

export default TradingViewWidget;
