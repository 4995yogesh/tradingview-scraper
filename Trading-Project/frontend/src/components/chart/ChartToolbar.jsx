import React, { useState, useRef, useEffect } from 'react';
import {
  Search, ChevronDown, Menu, Plus, CircleDot,
  Activity, Bell, Settings, Maximize2, Camera, Undo2, Redo2,
  Layout, Save, Eye, Play, ChevronRight, BarChart3
} from 'lucide-react';
import { symbolInfo, timeframes, indicators } from '../../data/chartData';
import LayoutSelector from './LayoutSelector';

// Candlestick icon SVG component
const CandleIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.2">
    <line x1="4" y1="2" x2="4" y2="14" />
    <rect x="2" y="5" width="4" height="5" rx="0.5" fill="currentColor" opacity="0.3" />
    <line x1="12" y1="1" x2="12" y2="15" />
    <rect x="10" y="4" width="4" height="6" rx="0.5" fill="currentColor" opacity="0.3" />
  </svg>
);

// Line chart icon
const LineIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1,12 5,6 9,9 15,3" />
  </svg>
);

// Area chart icon
const AreaIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={className} fill="none">
    <path d="M1,12 L5,6 L9,9 L15,3 V15 H1 Z" fill="currentColor" opacity="0.15" />
    <polyline points="1,12 5,6 9,9 15,3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Bar chart icon
const BarIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.2">
    <line x1="4" y1="3" x2="4" y2="13" />
    <line x1="2" y1="5" x2="4" y2="5" />
    <line x1="4" y1="10" x2="6" y2="10" />
    <line x1="10" y1="2" x2="10" y2="14" />
    <line x1="8" y1="4" x2="10" y2="4" />
    <line x1="10" y1="11" x2="12" y2="11" />
  </svg>
);

// Hollow candle icon
const HollowCandleIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.2">
    <line x1="4" y1="2" x2="4" y2="14" />
    <rect x="2" y="5" width="4" height="5" rx="0.5" />
    <line x1="12" y1="1" x2="12" y2="15" />
    <rect x="10" y="4" width="4" height="6" rx="0.5" fill="currentColor" opacity="0.4" />
  </svg>
);

// Heikin Ashi icon
const HeikinAshiIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.2">
    <line x1="4" y1="2" x2="4" y2="14" />
    <rect x="2.5" y="5" width="3" height="4" rx="0.3" fill="currentColor" opacity="0.5" />
    <line x1="11" y1="1" x2="11" y2="13" />
    <rect x="9.5" y="3" width="3" height="5" rx="0.3" />
  </svg>
);

const ChartToolbar = ({
  symbol, onSymbolChange, timeframe, onTimeframeChange,
  chartType, onChartTypeChange, activeIndicators, onToggleIndicator,
  priceData, onUndo, onRedo, onScreenshot, onSave, onFullscreen,
  onSettings, onAlert, onReplay, onPublish,
  activeLayout, onLayoutChange, showLayout, onToggleLayout
}) => {
  const [showSymbolSearch, setShowSymbolSearch] = useState(false);
  const [showChartTypes, setShowChartTypes] = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);
  const [showTimeframes, setShowTimeframes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef(null);
  const chartTypeRef = useRef(null);
  const indicatorsRef = useRef(null);
  const tfRef = useRef(null);

  const info = symbolInfo[symbol] || { name: symbol, exchange: '', type: '' };
  const lastPrice = priceData?.close || priceData?.value || 0;
  const prevClose = priceData?.open || lastPrice;
  const change = lastPrice - prevClose;
  const changePct = prevClose ? ((change / prevClose) * 100) : 0;
  const isUp = change >= 0;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSymbolSearch(false);
      if (chartTypeRef.current && !chartTypeRef.current.contains(e.target)) setShowChartTypes(false);
      if (indicatorsRef.current && !indicatorsRef.current.contains(e.target)) setShowIndicators(false);
      if (tfRef.current && !tfRef.current.contains(e.target)) setShowTimeframes(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSymbols = Object.keys(symbolInfo).filter(s =>
    s.toLowerCase().includes(searchQuery.toLowerCase()) ||
    symbolInfo[s].name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chartTypes = [
    { id: 'bar', label: 'Bars', icon: BarIcon },
    { id: 'candle', label: 'Candles', icon: CandleIcon },
    { id: 'hollow', label: 'Hollow Candles', icon: HollowCandleIcon },
    { id: 'line', label: 'Line', icon: LineIcon },
    { id: 'area', label: 'Area', icon: AreaIcon },
    { id: 'heikinashi', label: 'Heikin Ashi', icon: HeikinAshiIcon },
  ];

  const getActiveChartIcon = () => {
    const found = chartTypes.find(c => c.id === chartType);
    return found ? found.icon : CandleIcon;
  };
  const ActiveChartIcon = getActiveChartIcon();

  // Get display label for current timeframe
  const currentTfLabel = timeframes.find(t => t.value === timeframe)?.label || 'D';

  return (
    <div className="bg-[#131722] border-b border-[#2A2E39] shrink-0">
      {/* Main toolbar row */}
      <div className="h-[38px] flex items-center px-1 gap-[2px]">
        {/* Hamburger menu */}
        <button className="w-[34px] h-[30px] flex items-center justify-center text-[#787B86] hover:text-[#D1D4DC] hover:bg-[#2A2E3960] rounded-[4px] transition-colors">
          <Menu size={16} />
        </button>

        <div className="w-px h-[22px] bg-[#2A2E39] mx-[2px]" />

        {/* Symbol selector */}
        <div className="relative" ref={searchRef}>
          <button
            onClick={() => setShowSymbolSearch(!showSymbolSearch)}
            className="flex items-center gap-1 px-2 h-[30px] rounded-[4px] hover:bg-[#2A2E3960] transition-colors"
          >
            <span className="text-[13px] font-semibold text-white">{symbol}</span>
            <ChevronDown size={11} className="text-[#787B86]" />
          </button>

          {showSymbolSearch && (
            <div className="absolute top-full left-0 mt-1 w-[320px] bg-[#1E222D] rounded-md shadow-2xl border border-[#363A45] z-50 overflow-hidden">
              <div className="p-2 border-b border-[#2A2E39]">
                <div className="flex items-center gap-2 bg-[#131722] rounded-md px-3 py-2 border border-[#2A2E39] focus-within:border-[#2962FF]">
                  <Search size={14} className="text-[#787B86]" />
                  <input
                    type="text"
                    placeholder="Symbol Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent text-[13px] text-white outline-none flex-1 placeholder-[#787B86]"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-[350px] overflow-y-auto">
                {filteredSymbols.map((sym) => (
                  <button
                    key={sym}
                    onClick={() => { onSymbolChange(sym); setShowSymbolSearch(false); setSearchQuery(''); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[#2A2E39] transition-colors ${
                      sym === symbol ? 'bg-[#2962FF10]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-[28px] h-[28px] rounded-full bg-[#2A2E39] flex items-center justify-center">
                        <span className="text-[9px] font-bold text-[#787B86]">{sym.slice(0, 2)}</span>
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-white">{sym}</div>
                        <div className="text-[11px] text-[#787B86]">{symbolInfo[sym].name}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#787B86] bg-[#2A2E39] px-1.5 py-0.5 rounded">
                      {symbolInfo[sym].exchange}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Compare */}
        <button className="w-[30px] h-[30px] flex items-center justify-center text-[#787B86] hover:text-[#D1D4DC] hover:bg-[#2A2E3960] rounded-[4px] transition-colors" title="Compare or Add Symbol">
          <CircleDot size={15} />
        </button>

        {/* Add */}
        <button className="w-[30px] h-[30px] flex items-center justify-center text-[#787B86] hover:text-[#D1D4DC] hover:bg-[#2A2E3960] rounded-[4px] transition-colors" title="Add">
          <Plus size={15} />
        </button>

        <div className="w-px h-[22px] bg-[#2A2E39] mx-[2px]" />

        {/* Timeframe - shows current as button, click to dropdown */}
        <div className="relative" ref={tfRef}>
          <button
            onClick={() => setShowTimeframes(!showTimeframes)}
            className={`flex items-center gap-0.5 px-2 h-[30px] rounded-[4px] transition-colors text-[13px] font-medium ${
              showTimeframes ? 'bg-[#2962FF20] text-[#2962FF]' : 'text-[#D1D4DC] hover:bg-[#2A2E3960]'
            }`}
          >
            {currentTfLabel}
            <ChevronDown size={11} className="text-[#787B86] ml-0.5" />
          </button>

          {showTimeframes && (
            <div className="absolute top-full left-0 mt-1 w-[200px] bg-[#1E222D] rounded-md shadow-2xl border border-[#363A45] z-50 py-1">
              <div className="px-3 py-1.5 text-[10px] text-[#787B86] font-medium uppercase tracking-wider">Time Interval</div>
              {timeframes.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => { onTimeframeChange(tf.value); setShowTimeframes(false); }}
                  className={`w-full flex items-center justify-between px-3 py-[6px] text-[12px] hover:bg-[#2A2E39] transition-colors ${
                    timeframe === tf.value ? 'text-[#2962FF]' : 'text-[#D1D4DC]'
                  }`}
                >
                  <span>{tf.label}</span>
                  {timeframe === tf.value && (
                    <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="#2962FF" strokeWidth="1.5" fill="none" /></svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-[22px] bg-[#2A2E39] mx-[2px]" />

        {/* Chart type */}
        <div className="relative" ref={chartTypeRef}>
          <button
            onClick={() => setShowChartTypes(!showChartTypes)}
            className={`flex items-center gap-1 px-1.5 h-[30px] rounded-[4px] transition-colors ${
              showChartTypes ? 'bg-[#2962FF20] text-[#2962FF]' : 'text-[#787B86] hover:text-[#D1D4DC] hover:bg-[#2A2E3960]'
            }`}
          >
            <ActiveChartIcon size={16} />
            <ChevronDown size={10} className="text-[#787B86]" />
          </button>

          {showChartTypes && (
            <div className="absolute top-full left-0 mt-1 w-[180px] bg-[#1E222D] rounded-md shadow-2xl border border-[#363A45] z-50 py-1">
              <div className="px-3 py-1.5 text-[10px] text-[#787B86] font-medium uppercase tracking-wider">Chart Type</div>
              {chartTypes.map((ct) => {
                const CtIcon = ct.icon;
                return (
                  <button
                    key={ct.id}
                    onClick={() => { onChartTypeChange(ct.id === 'heikinashi' ? 'candle' : ct.id); setShowChartTypes(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-[7px] text-[12px] hover:bg-[#2A2E39] transition-colors ${
                      chartType === ct.id ? 'text-[#2962FF]' : 'text-[#D1D4DC]'
                    }`}
                  >
                    <CtIcon size={15} />
                    {ct.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="w-px h-[22px] bg-[#2A2E39] mx-[2px]" />

        {/* Indicators */}
        <div className="relative" ref={indicatorsRef}>
          <button
            onClick={() => setShowIndicators(!showIndicators)}
            className={`flex items-center gap-1.5 px-2 h-[30px] rounded-[4px] transition-colors text-[13px] ${
              showIndicators ? 'bg-[#2962FF20] text-[#2962FF]' : 'text-[#787B86] hover:text-[#D1D4DC] hover:bg-[#2A2E3960]'
            }`}
          >
            <Activity size={14} />
            <span className="hidden sm:inline">Indicators</span>
            {activeIndicators.length > 0 && (
              <span className="text-[9px] bg-[#2962FF] text-white rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                {activeIndicators.length}
              </span>
            )}
          </button>

          {showIndicators && (
            <div className="absolute top-full left-0 mt-1 w-[300px] bg-[#1E222D] rounded-md shadow-2xl border border-[#363A45] z-50">
              <div className="p-2 border-b border-[#2A2E39]">
                <div className="flex items-center gap-2 bg-[#131722] rounded-md px-3 py-2 border border-[#2A2E39] focus-within:border-[#2962FF]">
                  <Search size={14} className="text-[#787B86]" />
                  <input
                    type="text"
                    placeholder="Search indicators..."
                    className="bg-transparent text-[12px] text-white outline-none flex-1 placeholder-[#787B86]"
                  />
                </div>
              </div>
              <div className="max-h-[350px] overflow-y-auto py-1">
                {indicators.map((ind) => {
                  const isActive = activeIndicators.includes(ind.name);
                  return (
                    <button
                      key={ind.name}
                      onClick={() => onToggleIndicator(ind.name)}
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[#2A2E39] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-[18px] h-[18px] rounded-[3px] border flex items-center justify-center ${
                          isActive ? 'bg-[#2962FF] border-[#2962FF]' : 'border-[#4A4E59]'
                        }`}>
                          {isActive && (
                            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
                          )}
                        </div>
                        <div>
                          <div className={`text-[12px] font-medium ${isActive ? 'text-[#2962FF]' : 'text-[#D1D4DC]'}`}>
                            {ind.label}
                          </div>
                          <div className="text-[10px] text-[#787B86]">{ind.category}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Template */}
        <button className="w-[30px] h-[30px] flex items-center justify-center text-[#787B86] hover:text-[#D1D4DC] hover:bg-[#2A2E3960] rounded-[4px] transition-colors" title="Templates">
          <BarChart3 size={14} />
        </button>

        <div className="w-px h-[22px] bg-[#2A2E39] mx-[2px]" />

        {/* Alert */}
        <button onClick={onAlert} className="flex items-center gap-1 px-2 h-[30px] text-[13px] text-[#787B86] hover:text-[#D1D4DC] hover:bg-[#2A2E3960] rounded-[4px] transition-colors">
          <Bell size={14} />
          <span className="hidden md:inline">Alert</span>
        </button>

        {/* Replay */}
        <button onClick={onReplay} className="flex items-center gap-1 px-2 h-[30px] text-[13px] text-[#787B86] hover:text-[#D1D4DC] hover:bg-[#2A2E3960] rounded-[4px] transition-colors">
          <Play size={14} />
          <span className="hidden md:inline">Replay</span>
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side actions */}
        <button onClick={onUndo} className="w-[30px] h-[30px] flex items-center justify-center text-[#787B86] hover:text-[#D1D4DC] hover:bg-[#2A2E3960] rounded-[4px] transition-colors" title="Undo (Ctrl+Z)">
          <Undo2 size={14} />
        </button>
        <button onClick={onRedo} className="w-[30px] h-[30px] flex items-center justify-center text-[#787B86] hover:text-[#D1D4DC] hover:bg-[#2A2E3960] rounded-[4px] transition-colors" title="Redo (Ctrl+Y)">
          <Redo2 size={14} />
        </button>

        <div className="w-px h-[22px] bg-[#2A2E39] mx-[2px]" />

        <div className="relative">
          <button onClick={onToggleLayout} className={`w-[30px] h-[30px] flex items-center justify-center rounded-[4px] transition-colors ${showLayout ? 'text-[#2962FF] bg-[#2962FF15]' : 'text-[#787B86] hover:text-[#D1D4DC] hover:bg-[#2A2E3960]'}`} title="Layout">
            <Layout size={14} />
          </button>
          {showLayout && (
            <LayoutSelector activeLayout={activeLayout} onLayoutChange={onLayoutChange} isOpen={showLayout} onToggle={onToggleLayout} />
          )}
        </div>
        <button onClick={onScreenshot} className="w-[30px] h-[30px] flex items-center justify-center text-[#787B86] hover:text-[#D1D4DC] hover:bg-[#2A2E3960] rounded-[4px] transition-colors" title="Screenshot">
          <Camera size={14} />
        </button>
        <button onClick={onSettings} className="w-[30px] h-[30px] flex items-center justify-center text-[#787B86] hover:text-[#D1D4DC] hover:bg-[#2A2E3960] rounded-[4px] transition-colors" title="Settings">
          <Settings size={14} />
        </button>
        <button onClick={onFullscreen} className="w-[30px] h-[30px] flex items-center justify-center text-[#787B86] hover:text-[#D1D4DC] hover:bg-[#2A2E3960] rounded-[4px] transition-colors" title="Fullscreen">
          <Maximize2 size={14} />
        </button>

        <div className="w-px h-[22px] bg-[#2A2E39] mx-[2px]" />

        {/* Save */}
        <button onClick={onSave} className="flex items-center gap-1 px-2.5 h-[30px] text-[13px] text-[#787B86] hover:text-[#D1D4DC] hover:bg-[#2A2E3960] rounded-[4px] transition-colors">
          <Save size={14} />
          <span className="hidden lg:inline">Save</span>
        </button>

        {/* Publish */}
        <button onClick={onPublish} className="flex items-center gap-1 px-3 h-[28px] text-[12px] font-medium text-white bg-[#2962FF] hover:bg-[#1E53E5] rounded-[4px] transition-colors ml-1">
          Publish
        </button>
      </div>

      {/* Sub-header: Symbol info + OHLC */}
      <div className="h-[24px] flex items-center px-3 gap-3 border-b border-[#2A2E39] text-[11px]">
        <div className="flex items-center gap-1.5">
          <div className="w-[14px] h-[14px] rounded-full bg-[#2A2E39] flex items-center justify-center">
            <span className="text-[6px] font-bold text-[#787B86]">{symbol.slice(0, 1)}</span>
          </div>
          <span className="text-[#D1D4DC] font-medium">{info.name}</span>
          <span className="text-[#787B86]">·</span>
          <span className="text-[#787B86]">{currentTfLabel}</span>
          <span className="text-[#787B86]">·</span>
          <span className="text-[#787B86]">{info.exchange}</span>
        </div>
        {priceData && priceData.open !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-[#787B86]">O</span>
            <span className={priceData.close >= priceData.open ? 'text-[#26A69A]' : 'text-[#EF5350]'}>{priceData.open?.toFixed(2)}</span>
            <span className="text-[#787B86]">H</span>
            <span className={priceData.close >= priceData.open ? 'text-[#26A69A]' : 'text-[#EF5350]'}>{priceData.high?.toFixed(2)}</span>
            <span className="text-[#787B86]">L</span>
            <span className={priceData.close >= priceData.open ? 'text-[#26A69A]' : 'text-[#EF5350]'}>{priceData.low?.toFixed(2)}</span>
            <span className="text-[#787B86]">C</span>
            <span className={priceData.close >= priceData.open ? 'text-[#26A69A]' : 'text-[#EF5350]'}>{priceData.close?.toFixed(2)}</span>
            <span className={`font-medium ${isUp ? 'text-[#26A69A]' : 'text-[#EF5350]'}`}>
              {isUp ? '+' : ''}{change.toFixed(2)} ({isUp ? '+' : ''}{changePct.toFixed(2)}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartToolbar;
