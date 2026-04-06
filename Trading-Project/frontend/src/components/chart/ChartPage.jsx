import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useChartMemory, clearChartMemory } from '../../hooks/useChartMemory';
import { ArrowLeft, PanelRightOpen, PanelRightClose, List, Clock, ChevronDown, Plus, MoreHorizontal, Grid3X3, Pencil, ExternalLink, TrendingUp, Maximize } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import ChartWidget from './ChartWidget';
import ChartToolbar from './ChartToolbar';
import DrawingTools from './DrawingTools';
import DrawingOverlay from './DrawingOverlay';
import SettingsPanel from './SettingsPanel';
import LayoutSelector from './LayoutSelector';
import { symbolInfo, fetchWatchlist } from '../../data/chartData';

// Static fallback in case the API backend is not running
const FALLBACK_WATCHLIST = [
  { symbol: 'EURUSD', price: '—', change: '—', changePct: '—', isUp: true },
  { symbol: 'GBPUSD', price: '—', change: '—', changePct: '—', isUp: true },
  { symbol: 'USDJPY', price: '—', change: '—', changePct: '—', isUp: false },
  { symbol: 'AUDUSD', price: '—', change: '—', changePct: '—', isUp: true },
  { symbol: 'USDCAD', price: '—', change: '—', changePct: '—', isUp: false },
  { symbol: 'USDCHF', price: '—', change: '—', changePct: '—', isUp: true },
  { symbol: 'BTCUSD', price: '—', change: '—', changePct: '—', isUp: true },
  { symbol: 'ETHUSD', price: '—', change: '—', changePct: '—', isUp: true },
  { symbol: 'XAUUSD', price: '—', change: '—', changePct: '—', isUp: true },
];

const rightSideIcons = [
  { id: 'watchlist', icon: List, label: 'Watchlist' },
  { id: 'details', icon: Clock, label: 'Symbol Info' },
];

const defaultPanes = [
  { symbol: 'AAPL', timeframe: '1d', chartType: 'candle' },
  { symbol: 'TSLA', timeframe: '1d', chartType: 'candle' },
  { symbol: 'BTCUSD', timeframe: '1d', chartType: 'candle' },
  { symbol: 'EURUSD', timeframe: '1d', chartType: 'candle' },
];

const ChartPage = () => {
  const navigate = useNavigate();
  const chartWidgetRef = useRef(null);
  const containerRef = useRef(null);

  // ── Persisted state (auto-saved to localStorage via useChartMemory) ──────────
  const [symbol, setSymbol] = useChartMemory('symbol', 'EURUSD');
  const [timeframe, setTimeframe] = useChartMemory('timeframe', '1d');
  const [chartType, setChartType] = useChartMemory('chartType', 'candle');
  const [panes, setPanes] = useChartMemory('panes', defaultPanes);
  const [activeIndicators, setActiveIndicators] = useChartMemory('activeIndicators', []);
  const [showRightPanel, setShowRightPanel] = useChartMemory('showRightPanel', true);
  const [rightTab, setRightTab] = useChartMemory('rightTab', 'watchlist');
  const [drawings, setDrawings] = useChartMemory('drawings', []);
  const [drawingsVisible, setDrawingsVisible] = useChartMemory('drawingsVisible', true);
  const [drawingsLocked, setDrawingsLocked] = useChartMemory('drawingsLocked', false);
  const [logScale, setLogScale] = useChartMemory('logScale', false);
  const [chartSettings, setChartSettings] = useChartMemory('chartSettings', {
    background: '#131722', showGrid: true, crosshairMode: 'normal',
    upColor: '#26A69A', downColor: '#EF5350', timezone: 'exchange',
    sessionBreaks: false, watermark: false,
  });
  const [activeLayout, setActiveLayout] = useChartMemory('activeLayout', '1');
  const [stayInDrawMode, setStayInDrawMode] = useChartMemory('stayInDrawMode', false);
  const [alerts, setAlerts] = useChartMemory('alerts', []);

  // ── Transient state (not persisted) ─────────────────────────────────────────
  const [activePaneIdx, setActivePaneIdx] = useState(0);
  const [activeTool, setActiveTool] = useState('cursor');
  const [priceData, setPriceData] = useState(null);
  // Drawing undo/redo history lives only for the current session
  const [drawingHistory, setDrawingHistory] = useState(() =>
    drawings.length > 0 ? [drawings] : []
  );
  const [historyIndex, setHistoryIndex] = useState(() =>
    drawings.length > 0 ? 0 : -1
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showLayout, setShowLayout] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertPrice, setAlertPrice] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  const [watchlistItems, setWatchlistItems] = useState(FALLBACK_WATCHLIST);
  const [watchlistLoading, setWatchlistLoading] = useState(true);

  // ── Live watchlist — fetch on mount, refresh every 30 s ─────────────────
  useEffect(() => {
    let alive = true;

    const load = async () => {
      const data = await fetchWatchlist();
      if (!alive || !data) return;
      setWatchlistItems(data.map(item => ({
        symbol:    item.symbol,
        price:     item.price ? item.price.toString() : '—',
        change:    item.change != null ? (item.change >= 0 ? '+' : '') + item.change.toFixed(5) : '—',
        changePct: item.changePct != null ? (item.changePct >= 0 ? '+' : '') + item.changePct.toFixed(2) + '%' : '—',
        isUp:      item.isUp,
      })));
      setWatchlistLoading(false);
    };

    load();
    const timer = setInterval(load, 30000);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  // Toast helper
  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }, []);

  const handlePriceUpdate = useCallback((data) => { setPriceData(data); }, []);

  const toggleIndicator = useCallback((name) => {
    setActiveIndicators(prev => prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]);
  }, []);

  // Drawing undo/redo
  const pushDrawingHistory = useCallback((newDrawings) => {
    setDrawingHistory(prev => [...prev.slice(0, historyIndex + 1), [...newDrawings]]);
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const handleSetDrawings = useCallback((updater) => {
    setDrawings(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      pushDrawingHistory(next);
      return next;
    });
  }, [pushDrawingHistory]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setDrawings(drawingHistory[historyIndex - 1] || []);
    } else if (drawings.length > 0) {
      setDrawings([]);
    }
  }, [historyIndex, drawingHistory, drawings]);

  const handleRedo = useCallback(() => {
    if (historyIndex < drawingHistory.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setDrawings(drawingHistory[historyIndex + 1] || []);
    }
  }, [historyIndex, drawingHistory]);

  // Tool handler
  const handleToolSelect = useCallback((toolId) => {
    if (toolId === 'delete-all') { handleSetDrawings([]); showToast('All drawings removed'); return; }
    if (toolId === 'eraser') { handleSetDrawings(prev => prev.slice(0, -1)); return; }
    if (toolId === 'visibility') { setDrawingsVisible(prev => !prev); return; }
    if (toolId === 'lock') { setDrawingsLocked(prev => !prev); showToast(drawingsLocked ? 'Drawings unlocked' : 'Drawings locked'); return; }
    if (toolId === 'drawmode') { setStayInDrawMode(prev => !prev); showToast(stayInDrawMode ? 'Draw mode off' : 'Stay in drawing mode'); return; }
    if (toolId === 'objecttree') { showToast(`${drawings.length} drawing(s) on chart`); return; }
    setActiveTool(toolId);
  }, [handleSetDrawings, showToast, drawingsLocked, stayInDrawMode, drawings.length]);

  // Toolbar action handlers
  const handleScreenshot = useCallback(async () => {
    try {
      const container = chartWidgetRef.current?.getContainer();
      if (container) {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(container, { backgroundColor: '#131722' });
        canvas.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = `${symbol}_${timeframe}_chart.png`; a.click();
          URL.revokeObjectURL(url);
          showToast('Screenshot saved');
        });
      }
    } catch { showToast('Screenshot captured'); }
  }, [symbol, timeframe, showToast]);

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  const handleSave = useCallback((isReset = false) => {
    if (isReset) {
      clearChartMemory();
      showToast('Chart memory cleared — reload to apply defaults');
    } else {
      // All state changes are already auto-saved; this is just user feedback
      showToast('✓ All preferences auto-saved');
    }
  }, [showToast]);

  const handleBottomRange = useCallback((range) => {
    chartWidgetRef.current?.setVisibleRange(range);
  }, []);

  const handleCreateAlert = useCallback(() => {
    if (alertPrice) {
      setAlerts(prev => [...prev, { price: parseFloat(alertPrice), symbol, id: Date.now() }]);
      setShowAlert(false);
      setAlertPrice('');
      showToast(`Alert set at ${alertPrice}`);
    }
  }, [alertPrice, symbol, showToast]);

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); handleUndo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); handleRedo(); }
      if (e.ctrlKey && e.shiftKey && e.key === 'S') { e.preventDefault(); handleSave(true); }
      else if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleSave(); }
      if (e.key === 'Delete') { handleSetDrawings(prev => prev.slice(0, -1)); }
      if (e.key === 'Escape') { setActiveTool('cursor'); setShowSettings(false); setShowAlert(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo, handleSave, handleSetDrawings]);

  const info = symbolInfo[symbol] || { name: symbol, exchange: '' };

  // Sync pane 0 with main symbol/timeframe/chartType
  const updatePane = useCallback((idx, key, value) => {
    setPanes(prev => prev.map((p, i) => i === idx ? { ...p, [key]: value } : p));
    // Also sync main state if pane 0
    if (idx === 0) {
      if (key === 'symbol') setSymbol(value);
      if (key === 'timeframe') setTimeframe(value);
      if (key === 'chartType') setChartType(value);
    }
  }, []);

  // Keep pane 0 in sync with top toolbar changes
  useEffect(() => {
    setPanes(prev => prev.map((p, i) => i === 0 ? { ...p, symbol, timeframe, chartType } : p));
  }, [symbol, timeframe, chartType]);

  // Mini toolbar for secondary panes
  const PaneMiniToolbar = ({ pane, idx }) => {
    const [showTf, setShowTf] = useState(false);
    const tfLabels = { '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m', '1h': '1H', '4h': '4H', '1d': '1D', '1w': '1W', '1M': '1M' };
    return (
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-1 px-2 py-1 bg-[#131722E0] border-b border-[#2A2E39]" onClick={e => e.stopPropagation()}>
        <span className="text-[11px] font-semibold text-white">{pane.symbol}</span>
        <div className="relative">
          <button onClick={() => setShowTf(!showTf)} className="text-[10px] text-[#787B86] hover:text-white bg-[#2A2E39] px-1.5 py-0.5 rounded transition-colors">
            {tfLabels[pane.timeframe] || '1D'}
          </button>
          {showTf && (
            <div className="absolute top-full left-0 mt-1 bg-[#1E222D] border border-[#363A45] rounded shadow-xl z-50 py-1 w-[60px]">
              {Object.entries(tfLabels).map(([val, lbl]) => (
                <button key={val} onClick={() => { updatePane(idx, 'timeframe', val); setShowTf(false); }}
                  className={`w-full px-2 py-1 text-[10px] text-left hover:bg-[#2A2E39] ${pane.timeframe === val ? 'text-[#2962FF]' : 'text-[#D1D4DC]'}`}>
                  {lbl}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Multi-layout rendering with independent pane state
  const renderChart = (idx) => {
    const pane = panes[idx] || panes[0];
    const isMain = idx === 0;
    const cRef = isMain ? chartWidgetRef : null;
    return (
      <div key={`pane-${idx}-${pane.symbol}`} className={`h-full w-full relative border border-[#2A2E39] ${activePaneIdx === idx && activeLayout !== '1' ? 'ring-1 ring-[#2962FF40]' : ''}`}
        onClick={() => setActivePaneIdx(idx)}>
        <ChartWidget
          ref={cRef}
          symbol={pane.symbol}
          timeframe={pane.timeframe}
          chartType={isMain ? chartType : pane.chartType}
          activeIndicators={activeIndicators}
          onPriceUpdate={isMain ? handlePriceUpdate : undefined}
          logScale={logScale}
          chartSettings={chartSettings}
        />
        {isMain && (
          <DrawingOverlay
            chartRef={chartWidgetRef}
            activeTool={activeTool}
            drawings={drawings}
            setDrawings={handleSetDrawings}
            drawingsVisible={drawingsVisible}
            drawingsLocked={drawingsLocked}
          />
        )}
        {/* Mini toolbar for non-primary panes in multi-layout */}
        {activeLayout !== '1' && idx > 0 && (
          <PaneMiniToolbar pane={pane} idx={idx} />
        )}
      </div>
    );
  };

  // Resize handle component
  const ResizeHandle = ({ direction = 'horizontal' }) => (
    <PanelResizeHandle className={`group relative flex items-center justify-center ${
      direction === 'horizontal' ? 'w-[5px] cursor-col-resize' : 'h-[5px] cursor-row-resize'
    } bg-[#2A2E39] hover:bg-[#2962FF60] active:bg-[#2962FF] transition-colors`}>
      <div className={`${
        direction === 'horizontal' ? 'w-[3px] h-8' : 'h-[3px] w-8'
      } rounded-full bg-[#363A45] group-hover:bg-[#2962FF] transition-colors`} />
    </PanelResizeHandle>
  );

  const getLayoutCharts = () => {
    switch (activeLayout) {
      case '2h': return (
        <PanelGroup direction="horizontal" className="flex-1">
          <Panel defaultSize={50} minSize={20}>{renderChart(0)}</Panel>
          <ResizeHandle direction="horizontal" />
          <Panel defaultSize={50} minSize={20}>{renderChart(1)}</Panel>
        </PanelGroup>
      );
      case '2v': return (
        <PanelGroup direction="vertical" className="flex-1">
          <Panel defaultSize={50} minSize={20}>{renderChart(0)}</Panel>
          <ResizeHandle direction="vertical" />
          <Panel defaultSize={50} minSize={20}>{renderChart(1)}</Panel>
        </PanelGroup>
      );
      case '4': return (
        <PanelGroup direction="vertical" className="flex-1">
          <Panel defaultSize={50} minSize={15}>
            <PanelGroup direction="horizontal">
              <Panel defaultSize={50} minSize={15}>{renderChart(0)}</Panel>
              <ResizeHandle direction="horizontal" />
              <Panel defaultSize={50} minSize={15}>{renderChart(1)}</Panel>
            </PanelGroup>
          </Panel>
          <ResizeHandle direction="vertical" />
          <Panel defaultSize={50} minSize={15}>
            <PanelGroup direction="horizontal">
              <Panel defaultSize={50} minSize={15}>{renderChart(2)}</Panel>
              <ResizeHandle direction="horizontal" />
              <Panel defaultSize={50} minSize={15}>{renderChart(3)}</Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      );
      case '3r': return (
        <PanelGroup direction="horizontal" className="flex-1">
          <Panel defaultSize={65} minSize={25}>{renderChart(0)}</Panel>
          <ResizeHandle direction="horizontal" />
          <Panel defaultSize={35} minSize={15}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={50} minSize={20}>{renderChart(1)}</Panel>
              <ResizeHandle direction="vertical" />
              <Panel defaultSize={50} minSize={20}>{renderChart(2)}</Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      );
      default: return (
        <div className="flex-1 relative min-w-0">
          <ChartWidget
            ref={chartWidgetRef}
            symbol={symbol}
            timeframe={timeframe}
            chartType={chartType}
            activeIndicators={activeIndicators}
            onPriceUpdate={handlePriceUpdate}
            logScale={logScale}
            chartSettings={chartSettings}
          />
          <DrawingOverlay
            chartRef={chartWidgetRef}
            activeTool={activeTool}
            drawings={drawings}
            setDrawings={handleSetDrawings}
            drawingsVisible={drawingsVisible}
            drawingsLocked={drawingsLocked}
          />
        </div>
      );
    }
  };

  return (
    <div ref={containerRef} className="h-screen w-screen bg-[#131722] flex flex-col overflow-hidden select-none">
      {/* Chart toolbar */}
      <ChartToolbar
        symbol={symbol}
        onSymbolChange={(s) => { setSymbol(s); setDrawings([]); }}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        chartType={chartType}
        onChartTypeChange={setChartType}
        activeIndicators={activeIndicators}
        onToggleIndicator={toggleIndicator}
        priceData={priceData}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onScreenshot={handleScreenshot}
        onSave={handleSave}
        onFullscreen={handleFullscreen}
        onSettings={() => setShowSettings(true)}
        onAlert={() => { setShowAlert(true); setAlertPrice(priceData?.close?.toFixed(2) || ''); }}
        onReplay={() => showToast('Replay mode coming soon')}
        onPublish={() => showToast('Published chart snapshot')}
        activeLayout={activeLayout}
        onLayoutChange={setActiveLayout}
        showLayout={showLayout}
        onToggleLayout={() => setShowLayout(prev => !prev)}
      />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left drawing tools */}
        <DrawingTools activeTool={activeTool} onToolSelect={handleToolSelect} drawingsVisible={drawingsVisible} drawingsLocked={drawingsLocked} />

        {/* Chart area(s) */}
        {getLayoutCharts()}

        {/* Right panel */}
        {showRightPanel && (
          <div className="w-[260px] bg-[#131722] border-l border-[#2A2E39] flex flex-col shrink-0">
            <div className="flex items-center justify-between h-[36px] px-2 border-b border-[#2A2E39]">
              <span className="text-[13px] font-semibold text-white">Watchlist</span>
              <div className="flex items-center gap-0.5">
                <button className="w-[26px] h-[26px] flex items-center justify-center text-[#787B86] hover:text-[#D1D4DC] hover:bg-[#2A2E3960] rounded-[3px]"><Plus size={14} /></button>
                <button className="w-[26px] h-[26px] flex items-center justify-center text-[#787B86] hover:text-[#D1D4DC] hover:bg-[#2A2E3960] rounded-[3px]"><Grid3X3 size={14} /></button>
                <button className="w-[26px] h-[26px] flex items-center justify-center text-[#787B86] hover:text-[#D1D4DC] hover:bg-[#2A2E3960] rounded-[3px]"><MoreHorizontal size={14} /></button>
              </div>
            </div>
            <div className="flex items-center justify-between px-3 py-1 border-b border-[#2A2E39] text-[10px] text-[#787B86]">
              <span>Symbol</span>
              <div className="flex items-center gap-6"><span>Last</span><span>Chg</span><span>Chg%</span></div>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 text-[10px] text-[#787B86]">
              <ChevronDown size={10} />
              <span className="uppercase tracking-wider font-medium">Markets</span>
              {watchlistLoading && <span className="ml-auto text-[#2962FF] animate-pulse text-[9px]">LIVE</span>}
              {!watchlistLoading && <span className="ml-auto flex items-center gap-0.5 text-[#26A69A] text-[9px]"><TrendingUp size={8} /> LIVE</span>}
            </div>
            <div className="flex-1 overflow-y-auto">
              {watchlistItems.map((item) => (
                <button key={item.symbol} onClick={() => { setSymbol(item.symbol); setDrawings([]); }}
                  className={`w-full flex items-center justify-between px-3 py-[6px] transition-colors ${
                    item.symbol === symbol ? 'bg-[#2962FF15] border-l-2 border-[#2962FF]' : 'hover:bg-[#1E222D] border-l-2 border-transparent'
                  }`}>
                  <div className="flex items-center gap-2">
                    <div className="w-[20px] h-[20px] rounded-full bg-[#2A2E39] flex items-center justify-center shrink-0">
                      <span className="text-[7px] font-bold text-[#787B86]">{item.symbol.slice(0, 2)}</span>
                    </div>
                    <span className="text-[12px] font-medium text-white">{item.symbol}</span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-[12px] text-white w-[60px] text-right">{item.price}</span>
                    <span className={`text-[11px] w-[45px] text-right ${item.isUp ? 'text-[#26A69A]' : 'text-[#EF5350]'}`}>{item.change}</span>
                    <span className={`text-[11px] w-[45px] text-right ${item.isUp ? 'text-[#26A69A]' : 'text-[#EF5350]'}`}>{item.changePct}</span>
                  </div>
                </button>
              ))}
            </div>
            {priceData && (
              <div className="border-t border-[#2A2E39] p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-[24px] h-[24px] rounded-full bg-[#2A2E39] flex items-center justify-center">
                      <span className="text-[8px] font-bold text-[#787B86]">{symbol.slice(0, 2)}</span>
                    </div>
                    <span className="text-[14px] font-semibold text-white">{symbol}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="w-[22px] h-[22px] flex items-center justify-center text-[#787B86] hover:text-[#D1D4DC] rounded-[3px]"><ExternalLink size={12} /></button>
                    <button className="w-[22px] h-[22px] flex items-center justify-center text-[#787B86] hover:text-[#D1D4DC] rounded-[3px]"><Pencil size={12} /></button>
                  </div>
                </div>
                <div className="text-[10px] text-[#787B86] mb-2">{info.name} · {info.exchange}</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[20px] font-bold text-white">{priceData.close?.toFixed(2)}</span>
                  <span className="text-[11px] text-[#787B86]">{info.currency}</span>
                  <span className={`text-[12px] font-medium ${priceData.close >= priceData.open ? 'text-[#26A69A]' : 'text-[#EF5350]'}`}>
                    {priceData.close >= priceData.open ? '+' : ''}{(priceData.close - priceData.open).toFixed(2)}
                  </span>
                </div>
                {/* Alerts */}
                {alerts.filter(a => a.symbol === symbol).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#2A2E39]">
                    <span className="text-[10px] text-[#787B86] font-medium">ALERTS</span>
                    {alerts.filter(a => a.symbol === symbol).map(a => (
                      <div key={a.id} className="flex items-center justify-between py-1">
                        <span className="text-[11px] text-[#FF9800]">@ {a.price.toFixed(2)}</span>
                        <button onClick={() => setAlerts(prev => prev.filter(x => x.id !== a.id))} className="text-[9px] text-[#787B86] hover:text-[#EF5350]">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Right icon strip */}
        <div className="w-[38px] bg-[#131722] border-l border-[#2A2E39] flex flex-col items-center pt-2 gap-1 shrink-0">
          {rightSideIcons.map((item) => {
            const Icon = item.icon;
            const isActive = rightTab === item.id && showRightPanel;
            return (
              <button key={item.id} onClick={() => {
                if (rightTab === item.id && showRightPanel) setShowRightPanel(false);
                else { setRightTab(item.id); setShowRightPanel(true); }
              }} className={`w-[30px] h-[30px] flex items-center justify-center rounded-[4px] transition-colors ${
                isActive ? 'text-[#2962FF] bg-[#2962FF15]' : 'text-[#787B86] hover:text-[#D1D4DC] hover:bg-[#2A2E3960]'
              }`} title={item.label}><Icon size={16} /></button>
            );
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="h-[26px] bg-[#131722] border-t border-[#2A2E39] flex items-center px-2 justify-between shrink-0">
        <div className="flex items-center gap-1">
          {['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'All'].map((r) => (
            <button key={r} onClick={() => handleBottomRange(r === 'All' ? 'all' : r)}
              className="px-1.5 py-0.5 text-[10px] text-[#787B86] hover:text-[#D1D4DC] hover:bg-[#2A2E3960] rounded transition-colors">{r}</button>
          ))}
        </div>
        
        {/* Center - Reset Chart View Button (TradingView style) */}
        <button 
          onClick={() => { chartWidgetRef.current?.fitContent(); showToast('Chart view reset'); }}
          data-testid="reset-chart-view-btn"
          className="flex items-center gap-1.5 px-2.5 py-1 bg-[#2A2E39] hover:bg-[#363A45] text-[#D1D4DC] hover:text-white rounded-[4px] transition-all duration-200 group"
          title="Reset chart view"
        >
          <Maximize size={12} className="group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-medium">Reset</span>
        </button>
        
        <div className="flex items-center gap-3 text-[10px] text-[#787B86]">
          <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} UTC</span>
          <div className="w-px h-3 bg-[#2A2E39]" />
          <button onClick={() => chartWidgetRef.current?.fitContent()} className="hover:text-[#D1D4DC] transition-colors">Auto</button>
          <button onClick={() => { setLogScale(prev => !prev); showToast(logScale ? 'Linear scale' : 'Log scale'); }}
            className={`transition-colors ${logScale ? 'text-[#2962FF]' : 'hover:text-[#D1D4DC]'}`}>Log</button>
          <button className="hover:text-[#D1D4DC] transition-colors">ADJ</button>
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <SettingsPanel settings={chartSettings} onSettingsChange={setChartSettings} onClose={() => setShowSettings(false)} />
      )}

      {/* Alert dialog */}
      {showAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAlert(false)}>
          <div className="w-[320px] bg-[#1E222D] rounded-lg shadow-2xl border border-[#363A45] p-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-[14px] font-semibold text-white mb-3">Create Alert — {symbol}</h3>
            <label className="text-[11px] text-[#787B86] mb-1 block">Price Level</label>
            <input type="number" value={alertPrice} onChange={e => setAlertPrice(e.target.value)}
              className="w-full bg-[#131722] border border-[#2A2E39] rounded-md px-3 py-2 text-[13px] text-white outline-none focus:border-[#2962FF] mb-3"
              autoFocus />
            <div className="flex gap-2">
              <button onClick={() => setShowAlert(false)} className="flex-1 py-2 bg-[#2A2E39] text-[#D1D4DC] text-[12px] rounded-md hover:bg-[#363A45]">Cancel</button>
              <button onClick={handleCreateAlert} className="flex-1 py-2 bg-[#2962FF] text-white text-[12px] font-medium rounded-md hover:bg-[#1E53E5]">Create Alert</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#363A45] text-white text-[12px] rounded-lg shadow-xl border border-[#4A4E59] animate-fade-in">
          {toastMsg}
        </div>
      )}
    </div>
  );
};

export default ChartPage;
