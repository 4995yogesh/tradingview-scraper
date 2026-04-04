import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, CandlestickChart, BarChart3, LineChart, AlignLeft, Clock, Scaling, Palette, TrendingUp, Bell, CalendarDays } from 'lucide-react';

const tabs = [
  { id: 'symbol', label: 'Symbol', icon: CandlestickChart },
  { id: 'statusline', label: 'Status line', icon: AlignLeft },
  { id: 'scales', label: 'Scales and lines', icon: Scaling },
  { id: 'canvas', label: 'Canvas', icon: Palette },
  { id: 'trading', label: 'Trading', icon: TrendingUp },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'events', label: 'Events', icon: CalendarDays },
];

const ColorSwatch = ({ color, onChange, label }) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const presets = ['#26A69A', '#4CAF50', '#00E676', '#00BCD4', '#2196F3', '#2962FF',
    '#EF5350', '#F44336', '#FF5252', '#FF7043', '#E91E63', '#9C27B0',
    '#FF9800', '#FFC107', '#FFEB3B', '#8BC34A', '#607D8B', '#795548',
    '#FFFFFF', '#D1D4DC', '#787B86', '#363A45', '#1E222D', '#131722'];

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      // Position dropdown below button, but shift left if near right edge
      let left = rect.left;
      if (left + 168 > window.innerWidth) left = window.innerWidth - 178;
      let top = rect.bottom + 4;
      if (top + 120 > window.innerHeight) top = rect.top - 124;
      setPos({ top, left });
    }
    setOpen(!open);
  };

  return (
    <div className="relative">
      <button ref={btnRef} onClick={handleOpen}
        className="w-[28px] h-[28px] rounded border border-[#363A45] hover:border-[#787B86] transition-colors"
        style={{ backgroundColor: color }} />
      {open && ReactDOM.createPortal(
        <>
          <div className="fixed inset-0 z-[200]" onClick={() => setOpen(false)} />
          <div className="fixed z-[201] bg-[#1E222D] border border-[#363A45] rounded-lg shadow-2xl p-2.5"
            style={{ top: pos.top, left: pos.left, width: 168 }}>
            <div className="grid grid-cols-6 gap-1.5">
              {presets.map(c => (
                <button key={c} onClick={() => { onChange(c); setOpen(false); }}
                  className={`w-[22px] h-[22px] rounded-sm border-2 transition-colors ${color === c ? 'border-white scale-110' : 'border-transparent hover:border-[#787B86]'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

const CheckRow = ({ checked, onChange, label, children }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center gap-3">
      <button onClick={() => onChange(!checked)}
        className={`w-[18px] h-[18px] rounded-[3px] border flex items-center justify-center transition-colors ${
          checked ? 'bg-[#2962FF] border-[#2962FF]' : 'border-[#4A4E59] hover:border-[#787B86]'
        }`}>
        {checked && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>}
      </button>
      <span className="text-[13px] text-[#D1D4DC]">{label}</span>
    </div>
    {children}
  </div>
);

const SettingsPanel = ({ settings, onSettingsChange, onClose }) => {
  const [activeTab, setActiveTab] = useState('symbol');
  const update = (key, value) => onSettingsChange({ ...settings, [key]: value });

  const renderSymbolTab = () => (
    <div>
      <div className="text-[11px] text-[#787B86] font-medium uppercase tracking-wider mb-3">Candles</div>

      <CheckRow checked={settings.colorByPrevClose || false} onChange={v => update('colorByPrevClose', v)}
        label="Color bars based on previous close" />

      <div className="h-px bg-[#2A2E39] my-2" />

      <CheckRow checked={settings.showBody !== false} onChange={v => update('showBody', v)} label="Body">
        <div className="flex gap-2">
          <ColorSwatch color={settings.upColor || '#26A69A'} onChange={c => update('upColor', c)} />
          <ColorSwatch color={settings.downColor || '#EF5350'} onChange={c => update('downColor', c)} />
        </div>
      </CheckRow>

      <CheckRow checked={settings.showBorders !== false} onChange={v => update('showBorders', v)} label="Borders">
        <div className="flex gap-2">
          <ColorSwatch color={settings.borderUpColor || '#26A69A'} onChange={c => update('borderUpColor', c)} />
          <ColorSwatch color={settings.borderDownColor || '#EF5350'} onChange={c => update('borderDownColor', c)} />
        </div>
      </CheckRow>

      <CheckRow checked={settings.showWick !== false} onChange={v => update('showWick', v)} label="Wick">
        <div className="flex gap-2">
          <ColorSwatch color={settings.wickUpColor || '#26A69A'} onChange={c => update('wickUpColor', c)} />
          <ColorSwatch color={settings.wickDownColor || '#EF5350'} onChange={c => update('wickDownColor', c)} />
        </div>
      </CheckRow>

      <div className="h-px bg-[#2A2E39] my-4" />

      <div className="text-[11px] text-[#787B86] font-medium uppercase tracking-wider mb-3">Data Modification</div>

      <CheckRow checked={settings.adjustDividends || false} onChange={v => update('adjustDividends', v)}
        label="Adjust data for dividends" />

      <div className="flex items-center justify-between py-2">
        <span className="text-[13px] text-[#D1D4DC]">Precision</span>
        <select value={settings.precision || 'default'}
          onChange={e => update('precision', e.target.value)}
          className="bg-[#131722] border border-[#2A2E39] rounded px-2 py-1 text-[12px] text-[#D1D4DC] outline-none focus:border-[#2962FF] w-[120px]">
          <option value="default">Default</option>
          <option value="0">0</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>
      </div>

      <div className="flex items-center justify-between py-2">
        <span className="text-[13px] text-[#D1D4DC]">Timezone</span>
        <select value={settings.timezone || 'UTC'}
          onChange={e => update('timezone', e.target.value)}
          className="bg-[#131722] border border-[#2A2E39] rounded px-2 py-1 text-[12px] text-[#D1D4DC] outline-none focus:border-[#2962FF] w-[120px]">
          <option value="UTC">UTC</option>
          <option value="exchange">Exchange</option>
          <option value="America/New_York">New York</option>
          <option value="America/Chicago">Chicago</option>
          <option value="America/Los_Angeles">Los Angeles</option>
          <option value="Europe/London">London</option>
          <option value="Europe/Berlin">Berlin</option>
          <option value="Asia/Tokyo">Tokyo</option>
          <option value="Asia/Hong_Kong">Hong Kong</option>
          <option value="Asia/Kolkata">Kolkata</option>
        </select>
      </div>
    </div>
  );

  const renderStatusLineTab = () => (
    <div>
      <div className="text-[11px] text-[#787B86] font-medium uppercase tracking-wider mb-3">Indicator Values</div>
      <CheckRow checked={settings.showOHLC !== false} onChange={v => update('showOHLC', v)} label="OHLC values" />
      <CheckRow checked={settings.showBarChange !== false} onChange={v => update('showBarChange', v)} label="Bar change values" />
      <CheckRow checked={settings.showVolume !== false} onChange={v => update('showVolume', v)} label="Volume" />
      <CheckRow checked={settings.showIndicatorTitles !== false} onChange={v => update('showIndicatorTitles', v)} label="Indicator titles" />
      <CheckRow checked={settings.showIndicatorValues !== false} onChange={v => update('showIndicatorValues', v)} label="Indicator arguments" />
      <CheckRow checked={settings.showIndicatorLabels !== false} onChange={v => update('showIndicatorLabels', v)} label="Indicator values" />

      <div className="h-px bg-[#2A2E39] my-4" />
      <div className="text-[11px] text-[#787B86] font-medium uppercase tracking-wider mb-3">Appearance</div>
      <CheckRow checked={settings.showSymbolLabels !== false} onChange={v => update('showSymbolLabels', v)} label="Symbol labels" />
      <CheckRow checked={settings.showExchange !== false} onChange={v => update('showExchange', v)} label="Exchange" />
    </div>
  );

  const renderScalesTab = () => (
    <div>
      <div className="text-[11px] text-[#787B86] font-medium uppercase tracking-wider mb-3">Price Scale</div>

      <div className="flex items-center justify-between py-2">
        <span className="text-[13px] text-[#D1D4DC]">Scale mode</span>
        <div className="flex gap-1">
          {[{ id: 'regular', label: 'Regular' }, { id: 'log', label: 'Logarithmic' }, { id: 'percent', label: 'Percentage' }].map(m => (
            <button key={m.id} onClick={() => update('scaleMode', m.id)}
              className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
                (settings.scaleMode || 'regular') === m.id ? 'bg-[#2962FF] text-white' : 'bg-[#2A2E39] text-[#787B86] hover:text-[#D1D4DC]'
              }`}>{m.label}</button>
          ))}
        </div>
      </div>

      <CheckRow checked={settings.autoScale !== false} onChange={v => update('autoScale', v)} label="Auto (fits data to screen)" />
      <CheckRow checked={settings.lockScale || false} onChange={v => update('lockScale', v)} label="Lock scale" />
      <CheckRow checked={settings.invertScale || false} onChange={v => update('invertScale', v)} label="Invert scale" />

      <div className="h-px bg-[#2A2E39] my-4" />
      <div className="text-[11px] text-[#787B86] font-medium uppercase tracking-wider mb-3">Lines</div>
      <CheckRow checked={settings.showCountdown !== false} onChange={v => update('showCountdown', v)} label="Countdown to bar close" />
      <CheckRow checked={settings.showHighLowPrice || false} onChange={v => update('showHighLowPrice', v)} label="High and Low price labels" />
      <CheckRow checked={settings.showAvgLine || false} onChange={v => update('showAvgLine', v)} label="Average close price line" />
      <CheckRow checked={settings.showPrevClose || false} onChange={v => update('showPrevClose', v)} label="Previous day close level" />

      <div className="h-px bg-[#2A2E39] my-4" />
      <div className="text-[11px] text-[#787B86] font-medium uppercase tracking-wider mb-3">Labels on Price Scale</div>
      <CheckRow checked={settings.showBidAsk || false} onChange={v => update('showBidAsk', v)} label="Bid and Ask" />
      <CheckRow checked={settings.showPrePostMkt || false} onChange={v => update('showPrePostMkt', v)} label="Pre/Post market price" />
    </div>
  );

  const renderCanvasTab = () => (
    <div>
      <div className="text-[11px] text-[#787B86] font-medium uppercase tracking-wider mb-3">Background</div>
      <div className="flex items-center justify-between py-2">
        <span className="text-[13px] text-[#D1D4DC]">Background type</span>
        <div className="flex gap-1">
          {['Solid', 'Gradient'].map(t => (
            <button key={t} onClick={() => update('bgType', t.toLowerCase())}
              className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
                (settings.bgType || 'solid') === t.toLowerCase() ? 'bg-[#2962FF] text-white' : 'bg-[#2A2E39] text-[#787B86] hover:text-[#D1D4DC]'
              }`}>{t}</button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between py-2">
        <span className="text-[13px] text-[#D1D4DC]">Color</span>
        <ColorSwatch color={settings.background || '#131722'} onChange={c => update('background', c)} />
      </div>

      <div className="h-px bg-[#2A2E39] my-4" />
      <div className="text-[11px] text-[#787B86] font-medium uppercase tracking-wider mb-3">Grid</div>
      <CheckRow checked={settings.showVertGrid !== false} onChange={v => update('showVertGrid', v)} label="Vertical grid lines">
        <ColorSwatch color={settings.gridColor || '#1E222D'} onChange={c => update('gridColor', c)} />
      </CheckRow>
      <CheckRow checked={settings.showHorzGrid !== false} onChange={v => update('showHorzGrid', v)} label="Horizontal grid lines">
        <ColorSwatch color={settings.gridColor || '#1E222D'} onChange={c => update('gridColor', c)} />
      </CheckRow>

      <div className="h-px bg-[#2A2E39] my-4" />
      <div className="text-[11px] text-[#787B86] font-medium uppercase tracking-wider mb-3">Crosshair</div>
      <div className="flex items-center justify-between py-2">
        <span className="text-[13px] text-[#D1D4DC]">Mode</span>
        <div className="flex gap-1">
          {[{ id: 0, label: 'Normal' }, { id: 1, label: 'Magnet' }].map(m => (
            <button key={m.id} onClick={() => update('crosshairMode', m.id === 1 ? 'magnet' : 'normal')}
              className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
                (settings.crosshairMode || 'normal') === (m.id === 1 ? 'magnet' : 'normal') ? 'bg-[#2962FF] text-white' : 'bg-[#2A2E39] text-[#787B86] hover:text-[#D1D4DC]'
              }`}>{m.label}</button>
          ))}
        </div>
      </div>

      <div className="h-px bg-[#2A2E39] my-4" />
      <div className="text-[11px] text-[#787B86] font-medium uppercase tracking-wider mb-3">Other</div>
      <CheckRow checked={settings.sessionBreaks || false} onChange={v => update('sessionBreaks', v)} label="Session breaks" />
      <CheckRow checked={settings.watermark || false} onChange={v => update('watermark', v)} label="Symbol watermark" />
      <CheckRow checked={settings.showNavigationButtons !== false} onChange={v => update('showNavigationButtons', v)} label="Navigation buttons" />
    </div>
  );

  const renderTradingTab = () => (
    <div>
      <div className="text-[11px] text-[#787B86] font-medium uppercase tracking-wider mb-3">Order Panel</div>
      <CheckRow checked={settings.showOrderPanel || false} onChange={v => update('showOrderPanel', v)} label="Show buy/sell buttons" />
      <CheckRow checked={settings.showPositions || false} onChange={v => update('showPositions', v)} label="Show positions" />
      <CheckRow checked={settings.showOrders || false} onChange={v => update('showOrders', v)} label="Show orders" />
      <CheckRow checked={settings.showExecutions || false} onChange={v => update('showExecutions', v)} label="Show executions" />

      <div className="h-px bg-[#2A2E39] my-4" />
      <div className="text-[11px] text-[#787B86] font-medium uppercase tracking-wider mb-3">Display</div>
      <CheckRow checked={settings.showPnL !== false} onChange={v => update('showPnL', v)} label="Profit and Loss" />
      <CheckRow checked={settings.showNotifications || false} onChange={v => update('showNotifications', v)} label="Notifications" />
    </div>
  );

  const renderAlertsTab = () => (
    <div>
      <div className="text-[11px] text-[#787B86] font-medium uppercase tracking-wider mb-3">Alert Display</div>
      <CheckRow checked={settings.showAlertLabels !== false} onChange={v => update('showAlertLabels', v)} label="Show alert price labels" />
      <CheckRow checked={settings.showAlertLines !== false} onChange={v => update('showAlertLines', v)} label="Show alert lines on chart" />
      <div className="flex items-center justify-between py-2">
        <span className="text-[13px] text-[#D1D4DC]">Alert line color</span>
        <ColorSwatch color={settings.alertColor || '#FF9800'} onChange={c => update('alertColor', c)} />
      </div>
      <div className="flex items-center justify-between py-2">
        <span className="text-[13px] text-[#D1D4DC]">Alert line style</span>
        <select value={settings.alertLineStyle || 'dashed'}
          onChange={e => update('alertLineStyle', e.target.value)}
          className="bg-[#131722] border border-[#2A2E39] rounded px-2 py-1 text-[12px] text-[#D1D4DC] outline-none focus:border-[#2962FF] w-[100px]">
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </div>
    </div>
  );

  const renderEventsTab = () => (
    <div>
      <div className="text-[11px] text-[#787B86] font-medium uppercase tracking-wider mb-3">Events</div>
      <CheckRow checked={settings.showDividends || false} onChange={v => update('showDividends', v)} label="Dividends" />
      <CheckRow checked={settings.showSplits || false} onChange={v => update('showSplits', v)} label="Splits" />
      <CheckRow checked={settings.showEarnings !== false} onChange={v => update('showEarnings', v)} label="Earnings" />
      <CheckRow checked={settings.showEconEvents || false} onChange={v => update('showEconEvents', v)} label="Economic events" />
    </div>
  );

  const tabContent = {
    symbol: renderSymbolTab,
    statusline: renderStatusLineTab,
    scales: renderScalesTab,
    canvas: renderCanvasTab,
    trading: renderTradingTab,
    alerts: renderAlertsTab,
    events: renderEventsTab,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-[680px] max-h-[520px] bg-[#1E222D] rounded-lg shadow-2xl border border-[#363A45] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#2A2E39]">
          <span className="text-[16px] font-semibold text-white">Settings</span>
          <button onClick={onClose} className="p-1 text-[#787B86] hover:text-white hover:bg-[#2A2E3960] rounded transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Left tabs */}
          <div className="w-[180px] border-r border-[#2A2E39] py-2 shrink-0">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-5 py-2.5 text-[13px] transition-colors text-left ${
                    activeTab === tab.id
                      ? 'text-white bg-[#2962FF15] border-l-2 border-[#2962FF]'
                      : 'text-[#787B86] hover:text-[#D1D4DC] hover:bg-[#2A2E3930] border-l-2 border-transparent'
                  }`}>
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Right content */}
          <div className="flex-1 p-5 overflow-y-auto">
            {tabContent[activeTab]?.()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#2A2E39]">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2A2E39] text-[#D1D4DC] text-[12px] rounded hover:bg-[#363A45] transition-colors">
            Template
            <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 3l3 3 3-3" stroke="currentColor" strokeWidth="1.2" fill="none" /></svg>
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-1.5 text-[#D1D4DC] text-[12px] rounded hover:bg-[#2A2E3960] transition-colors">
              Cancel
            </button>
            <button onClick={onClose} className="px-5 py-1.5 bg-[#2962FF] hover:bg-[#1E53E5] text-white text-[12px] font-medium rounded transition-colors">
              Ok
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
