import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi, LineStyle, IPriceLine, CandlestickSeries } from 'lightweight-charts';
import { Symbol, Trade } from '../types';
import { fetchCandles, getCachedCandlesSync, priceWS, PriceCallback } from '../services/priceService';
import { X } from 'lucide-react';

interface CandlestickChartProps {
  symbol: Symbol;
  currentPrice: number;
  timeframe: string;
  trades?: Trade[];
  onUpdateTrade?: (id: string, sl: number, tp: number) => void;
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({ symbol, currentPrice, timeframe, trades = [], onUpdateTrade }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const isFirstLoad = useRef(true);
  
  const [dragTarget, setDragTarget] = useState<{ id: string, type: 'SL' | 'TP', price: number } | null>(null);
  const [pendingModify, setPendingModify] = useState<{ trade: Trade, type: 'SL' | 'TP', newPrice: number } | null>(null);
  const priceLinesRef = useRef<Record<string, IPriceLine>>({});

  // 1. Chart Instance Lifecycle
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    
    const chart = createChart(containerRef.current, {
      layout: { 
        background: { type: ColorType.Solid, color: '#0b0f1a' }, 
        textColor: '#64748b',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
      },
      grid: { 
        vertLines: { color: 'rgba(255, 255, 255, 0.02)' }, 
        horzLines: { color: 'rgba(255, 255, 255, 0.02)' } 
      },
      width: containerRef.current.clientWidth || 800,
      height: containerRef.current.clientHeight || 500,
      crosshair: { 
        mode: CrosshairMode.Normal,
        vertLine: { color: '#3b82f6', width: 1, style: LineStyle.Dashed },
        horzLine: { color: '#3b82f6', width: 1, style: LineStyle.Dashed },
      },
      timeScale: { 
        borderColor: 'rgba(255, 255, 255, 0.05)', 
        timeVisible: true,
        rightOffset: 12,
        barSpacing: 10,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.05)',
        scaleMargins: { top: 0.1, bottom: 0.2 },
        autoScale: true,
      },
    });

    const series = chart.addSeries(CandlestickSeries, { 
        upColor: '#10b981', 
        downColor: '#ef4444', 
        borderVisible: false, 
        wickUpColor: '#10b981', 
        wickDownColor: '#ef4444' 
    });
    
    chartRef.current = chart;
    seriesRef.current = series;

    // Real-time WebSocket listener for the chart
    const callback: PriceCallback = (s, p, candle) => {
      if (s === symbol && candle && seriesRef.current) {
        seriesRef.current.update({
          time: (candle.time / 1000) as any,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close
        });
      }
    };
    priceWS.connect([symbol], callback);

    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || !chartRef.current || !containerRef.current) return;
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        chartRef.current.applyOptions({ width, height });
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => { 
        resizeObserver.disconnect();
        priceWS.disconnect(callback);
        chart.remove(); 
    };
  }, [symbol]); // Re-connect WS when symbol changes

  // 2. High Speed Symbol/Timeframe Switching
  useLayoutEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;
    
    // Step A: Immediate update from cache
    const syncData = getCachedCandlesSync(symbol, timeframe);
    if (syncData) {
        seriesRef.current.setData(syncData.map(c => ({ 
            time: (c.time / 1000) as any, 
            open: c.open, high: c.high, low: c.low, close: c.close 
        })));
        if (isFirstLoad.current) {
            chartRef.current.timeScale().fitContent();
            isFirstLoad.current = false;
        }
    }

    // Step B: Fetch/Refresh in background
    fetchCandles(symbol, timeframe as any, 1000).then(candles => {
        if (seriesRef.current) {
            seriesRef.current.setData(candles.map(c => ({ 
                time: (c.time / 1000) as any, 
                open: c.open, high: c.high, low: c.low, close: c.close 
            })));
        }
    });
  }, [symbol, timeframe]);

  // 3. Trade Lines Overlay
  useEffect(() => {
    if (!seriesRef.current) return;
    Object.values(priceLinesRef.current).forEach(line => {
        try { seriesRef.current?.removePriceLine(line); } catch (e) {}
    });
    priceLinesRef.current = {};

    trades.filter(t => t.symbol === symbol && t.status === 'OPEN').forEach(t => {
        const slPrice = (dragTarget?.id === t.id && dragTarget?.type === 'SL') ? dragTarget.price : t.stopLoss;
        const tpPrice = (dragTarget?.id === t.id && dragTarget?.type === 'TP') ? dragTarget.price : t.takeProfit;

        priceLinesRef.current[`${t.id}_entry`] = seriesRef.current!.createPriceLine({ 
            price: t.entryPrice, 
            color: '#3b82f6', 
            lineWidth: 2, 
            title: `${t.type} ${t.lotSize}`,
            axisLabelVisible: true,
        });
        
        if (t.stopLoss) {
            priceLinesRef.current[`${t.id}_sl`] = seriesRef.current!.createPriceLine({ 
                price: slPrice || 0, 
                color: '#ef4444', 
                lineWidth: 1, 
                lineStyle: LineStyle.Dashed, 
                title: 'SL',
                axisLabelVisible: true,
            });
        }
        if (t.takeProfit) {
            priceLinesRef.current[`${t.id}_tp`] = seriesRef.current!.createPriceLine({ 
                price: tpPrice || 0, 
                color: '#10b981', 
                lineWidth: 1, 
                lineStyle: LineStyle.Dashed, 
                title: 'TP',
                axisLabelVisible: true,
            });
        }
    });
  }, [trades, symbol, dragTarget]);

  return (
    <div className="h-full w-full relative select-none overflow-hidden">
        <div ref={containerRef} className="h-full w-full" />
        {pendingModify && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] z-[500] animate-fade-in">
                <div className="glass-panel border-blue-500/20 bg-[#121418] rounded-xl overflow-hidden shadow-2xl border border-blue-500/10">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <span className="text-[11px] font-black text-white uppercase tracking-widest">Modify Order</span>
                        <button onClick={() => setPendingModify(null)} className="text-slate-500 hover:text-white"><X size={16}/></button>
                    </div>
                    <div className="p-6 space-y-6 text-center">
                        <div className="flex flex-col">
                            <span className="text-[9px] text-zinc-500 uppercase font-black">{pendingModify.type === 'SL' ? 'Stop Loss' : 'Take Profit'}</span>
                            <span className="text-xl font-mono font-bold text-white">{pendingModify.newPrice.toFixed(2)}</span>
                        </div>
                        <button 
                          onClick={() => { onUpdateTrade?.(pendingModify.trade.id, pendingModify.type === 'SL' ? pendingModify.newPrice : (pendingModify.trade.stopLoss || 0), pendingModify.type === 'TP' ? pendingModify.newPrice : (pendingModify.trade.takeProfit || 0)); setPendingModify(null); }}
                          className="w-full py-4 bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-lg hover:bg-blue-500 shadow-xl shadow-blue-500/10 transition-all active:scale-[0.98]"
                        >
                            Confirm Update
                        </button>
                    </div>
                </div>
            </div>
        )}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-l shadow-lg z-50 pointer-events-none">
            {currentPrice.toFixed(2)}
        </div>
    </div>
  );
};

export default CandlestickChart;
