import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Symbol, Candle, Trade } from '../types';

interface NebulaChartProps {
  symbol: Symbol;
  candles: Candle[];
  activeTrades: Trade[];
  currentPrice: number;
  timeframe: string;
}

const NebulaChart: React.FC<NebulaChartProps> = ({ symbol, candles, activeTrades, currentPrice, timeframe }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoomTransform, setZoomTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);

  const resetZoom = () => {
    setZoomTransform(d3.zoomIdentity);
    if (svgRef.current) {
      d3.select(svgRef.current).transition().duration(750).call(d3.zoom<SVGSVGElement, unknown>().transform, d3.zoomIdentity);
    }
  };

  const margin = { top: 20, right: 80, bottom: 30, left: 20 };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || candles.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create main groups
    const chartGroup = svg.append('g');
    const xAxisGroup = svg.append('g').attr('class', 'x-axis');
    const yAxisGroup = svg.append('g').attr('class', 'y-axis');
    const overlayGroup = svg.append('g').attr('class', 'overlay');

    // Scales
    const x = d3.scaleBand<string>()
      .domain(candles.map(d => d.time.toString()))
      .range([margin.left, width - margin.right])
      .padding(0.2);

    const yMin = d3.min(candles, (d: Candle) => d.low) as number || 0;
    const yMax = d3.max(candles, (d: Candle) => d.high) || 0;
    const padding = (yMax - yMin) * 0.1;

    const y = d3.scaleLinear()
      .domain([yMin - padding, yMax + padding])
      .range([height - margin.bottom, margin.top]);

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 20])
      .translateExtent([[0, 0], [width, height]])
      .on('zoom', (event) => {
        setZoomTransform(event.transform);
      });

    svg.call(zoom);

    // Apply transform to chart group
    chartGroup.attr('transform', zoomTransform.toString());

    // Grid lines (static)
    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(${width - margin.right}, 0)`)
      .call(d3.axisLeft(y)
        .tickSize(width - margin.left - margin.right)
        .tickFormat(() => '')
      )
      .style('stroke-dasharray', '2,2')
      .style('stroke-opacity', 0.1)
      .style('color', '#ffffff');

    // X Axis (Time) - Needs to handle zoom if we wanted but band scale is tricky
    // For now, let's just keep axes static or simple
    const xAxis = d3.axisBottom(x)
      .tickValues(x.domain().filter((d, i) => i % Math.ceil(candles.length / 10) === 0))
      .tickFormat(d => {
        const date = new Date(parseInt(d));
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      });

    xAxisGroup
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(xAxis)
      .style('color', 'rgba(255,255,255,0.2)')
      .selectAll('text')
      .style('font-size', '10px');

    // Y Axis (Price)
    const yAxis = d3.axisRight(y)
      .ticks(10)
      .tickFormat(d => `$${d.toLocaleString()}`);

    yAxisGroup
      .attr('transform', `translate(${width - margin.right}, 0)`)
      .call(yAxis)
      .style('color', 'rgba(255,255,255,0.4)')
      .selectAll('text')
      .style('font-size', '10px')
      .style('font-family', 'monospace');

    // Candlesticks
    const candleGroup = chartGroup.append('g');

    candleGroup.selectAll('.wick')
      .data(candles)
      .enter()
      .append('line')
      .attr('class', 'wick')
      .attr('x1', (d: Candle) => (x(d.time.toString()) || 0) + x.bandwidth() / 2)
      .attr('x2', (d: Candle) => (x(d.time.toString()) || 0) + x.bandwidth() / 2)
      .attr('y1', (d: Candle) => y(d.high))
      .attr('y2', (d: Candle) => y(d.low))
      .attr('stroke', (d: Candle) => d.close >= d.open ? '#22c55e' : '#ef4444')
      .attr('stroke-width', 1);

    candleGroup.selectAll('.body')
      .data(candles)
      .enter()
      .append('rect')
      .attr('class', 'body')
      .attr('x', (d: Candle) => x(d.time.toString()) || 0)
      .attr('y', (d: Candle) => y(Math.max(d.open, d.close)))
      .attr('width', x.bandwidth())
      .attr('height', (d: Candle) => Math.max(1, Math.abs(y(d.open) - y(d.close))))
      .attr('fill', (d: Candle) => d.close >= d.open ? '#22c55e' : '#ef4444')
      .attr('rx', 1);

    // Current Price Line (Overlay - static on Y, dynamic on X if needed)
    const currentPriceLine = overlayGroup.append('g');
    currentPriceLine.append('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', y(currentPrice))
      .attr('y2', y(currentPrice))
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4');

    currentPriceLine.append('rect')
      .attr('x', width - margin.right)
      .attr('y', y(currentPrice) - 10)
      .attr('width', 80)
      .attr('height', 20)
      .attr('fill', '#3b82f6')
      .attr('rx', 4);

    currentPriceLine.append('text')
      .attr('x', width - margin.right + 5)
      .attr('y', y(currentPrice) + 4)
      .attr('fill', '#000')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('font-family', 'monospace')
      .text(`$${currentPrice.toLocaleString()}`);

    // Active Trades Visualization (Part of chart group to move with zoom)
    const tradesGroup = chartGroup.append('g');
    activeTrades.filter(t => t.symbol === symbol).forEach(trade => {
      // Entry Line
      tradesGroup.append('line')
        .attr('x1', margin.left)
        .attr('x2', width - margin.right)
        .attr('y1', y(trade.entryPrice))
        .attr('y2', y(trade.entryPrice))
        .attr('stroke', trade.type === 'BUY' ? '#22c55e' : '#ef4444')
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.5);

      tradesGroup.append('text')
        .attr('x', margin.left + 5)
        .attr('y', y(trade.entryPrice) - 5)
        .attr('fill', trade.type === 'BUY' ? '#22c55e' : '#ef4444')
        .style('font-size', '9px')
        .style('font-weight', 'bold')
        .text(`${trade.type} @ $${trade.entryPrice.toFixed(2)}`);

      // SL Line
      if (trade.stopLoss) {
        tradesGroup.append('line')
          .attr('x1', margin.left)
          .attr('x2', width - margin.right)
          .attr('y1', y(trade.stopLoss))
          .attr('y2', y(trade.stopLoss))
          .attr('stroke', '#ef4444')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '2,2');

        tradesGroup.append('text')
          .attr('x', margin.left + 5)
          .attr('y', y(trade.stopLoss) + 12)
          .attr('fill', '#ef4444')
          .style('font-size', '9px')
          .style('font-weight', 'bold')
          .text(`SL: $${trade.stopLoss.toFixed(2)}`);
      }

      // TP Line
      if (trade.takeProfit) {
        tradesGroup.append('line')
          .attr('x1', margin.left)
          .attr('x2', width - margin.right)
          .attr('y1', y(trade.takeProfit))
          .attr('y2', y(trade.takeProfit))
          .attr('stroke', '#22c55e')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '2,2');

        tradesGroup.append('text')
          .attr('x', margin.left + 5)
          .attr('y', y(trade.takeProfit) - 5)
          .attr('fill', '#22c55e')
          .style('font-size', '9px')
          .style('font-weight', 'bold')
          .text(`TP: $${trade.takeProfit.toFixed(2)}`);
      }
    });

  }, [candles, currentPrice, activeTrades, symbol, zoomTransform]);

  return (
    <div ref={containerRef} className="w-full h-full bg-[#0b0f1a] overflow-hidden cursor-crosshair relative group">
      <svg ref={svgRef} className="w-full h-full" />
      
      {/* Chart Controls Overlay */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={resetZoom}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-white/40 hover:text-white transition-all backdrop-blur-md"
          title="Reset Zoom"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="absolute bottom-4 left-4 pointer-events-none">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/10">
          Nebula Chart Engine v1.0 • {symbol} • {timeframe}
        </span>
      </div>
    </div>
  );
};

export default NebulaChart;
