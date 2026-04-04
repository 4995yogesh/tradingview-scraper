import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';
import { majorIndices, cryptoData, futuresData, forexData, usStocks, economicEvents, brokersData } from '../data/mockData';

const MiniSparkline = ({ data, isUp, width = 60, height = 24 }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={isUp ? '#26A69A' : '#EF5350'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const MarketRow = ({ item, showSparkline = true }) => (
  <div className="flex items-center justify-between py-3 px-4 hover:bg-[#1E222D] transition-colors cursor-pointer group border-b border-[#2A2E39] last:border-b-0">
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div className="w-8 h-8 rounded-full bg-[#2A2E39] flex items-center justify-center shrink-0">
        <span className="text-[10px] font-bold text-[#787B86]">{item.symbol?.slice(0, 2)}</span>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-white truncate">{item.name}</span>
          {item.status && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              item.status === 'open' ? 'bg-[#26A69A20] text-[#26A69A]' : 'bg-[#78787820] text-[#787B86]'
            }`}>
              {item.status === 'open' ? 'R' : 'D'}
            </span>
          )}
        </div>
        <span className="text-[11px] text-[#787B86]">{item.symbol}</span>
      </div>
    </div>

    {showSparkline && item.sparkline && (
      <div className="hidden sm:block mx-4">
        <MiniSparkline data={item.sparkline} isUp={item.isUp} />
      </div>
    )}

    <div className="text-right shrink-0">
      <div className="text-[13px] text-white font-medium">{item.price}<span className="text-[11px] text-[#787B86] ml-1">{item.currency || item.unit || ''}</span></div>
      <div className={`text-[12px] font-medium flex items-center justify-end gap-0.5 ${item.isUp ? 'text-[#26A69A]' : 'text-[#EF5350]'}`}>
        {item.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {item.change}
      </div>
    </div>
  </div>
);

const MarketSummaryTab = () => (
  <div>
    {/* Main index card */}
    <div className="bg-[#1E222D] rounded-xl p-5 mb-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-[#EF535020] flex items-center justify-center">
              <span className="text-[9px] font-bold text-[#EF5350]">SP</span>
            </div>
            <div>
              <span className="text-[14px] font-semibold text-white">S&P 500</span>
              <span className="text-[11px] text-[#787B86] ml-2">SPX</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[20px] font-bold text-white">6,147.43</div>
          <div className="text-[13px] text-[#EF5350] flex items-center justify-end gap-0.5">
            <ArrowDownRight size={14} />
            −1.67%
          </div>
        </div>
      </div>
      {/* Simple SVG chart */}
      <svg width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="none" className="overflow-visible">
        <defs>
          <linearGradient id="spxGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EF5350" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#EF5350" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 60 Q50 40, 80 35 T160 25 T240 30 T320 50 T400 65" fill="url(#spxGrad)" />
        <path d="M0 60 Q50 40, 80 35 T160 25 T240 30 T320 50 T400 65" fill="none" stroke="#EF5350" strokeWidth="2" />
      </svg>
    </div>

    {/* Major Indices label */}
    <h3 className="text-[13px] font-semibold text-[#787B86] uppercase tracking-wider mb-2 px-1">Major indices</h3>

    {/* Index list */}
    <div className="bg-[#1E222D] rounded-xl overflow-hidden">
      {majorIndices.map((item) => (
        <MarketRow key={item.symbol} item={item} />
      ))}
    </div>

    <button className="mt-3 text-[13px] text-[#2962FF] hover:text-[#5B8DEF] flex items-center gap-1 transition-colors">
      See all major indices <ExternalLink size={12} />
    </button>
  </div>
);

const CryptoTab = () => (
  <div>
    <div className="bg-[#1E222D] rounded-xl p-5 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[12px] text-[#787B86] mb-1">Crypto market cap</div>
          <div className="text-[20px] font-bold text-white">$3.45T</div>
        </div>
        <div className="text-[13px] text-[#26A69A] flex items-center gap-0.5">
          <ArrowUpRight size={14} />
          +2.49%
        </div>
      </div>
      <div className="flex gap-4 text-[12px]">
        <div><span className="text-[#F7931A]">●</span> <span className="text-[#787B86]">Bitcoin 58.55%</span></div>
        <div><span className="text-[#627EEA]">●</span> <span className="text-[#787B86]">Ethereum 10.72%</span></div>
        <div><span className="text-[#787B86]">●</span> <span className="text-[#787B86]">Others 30.73%</span></div>
      </div>
    </div>
    <div className="bg-[#1E222D] rounded-xl overflow-hidden">
      {cryptoData.map((item) => (
        <MarketRow key={item.symbol} item={item} />
      ))}
    </div>
    <button className="mt-3 text-[13px] text-[#2962FF] hover:text-[#5B8DEF] flex items-center gap-1 transition-colors">
      See all crypto coins <ExternalLink size={12} />
    </button>
  </div>
);

const USStocksTab = () => (
  <div>
    <h3 className="text-[13px] font-semibold text-[#787B86] uppercase tracking-wider mb-2 px-1">Community trends</h3>
    <div className="bg-[#1E222D] rounded-xl overflow-hidden">
      {usStocks.map((item) => (
        <MarketRow key={item.symbol} item={{...item, sparkline: null}} showSparkline={false} />
      ))}
    </div>
    <button className="mt-3 text-[13px] text-[#2962FF] hover:text-[#5B8DEF] flex items-center gap-1 transition-colors">
      See all US stocks <ExternalLink size={12} />
    </button>
  </div>
);

const FuturesTab = () => (
  <div>
    <div className="bg-[#1E222D] rounded-xl p-5 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[12px] text-[#787B86] mb-1">US Dollar index</div>
          <div className="text-[18px] font-bold text-white">DXY 100.075</div>
        </div>
        <div className="text-[13px] text-[#26A69A] flex items-center gap-0.5">
          <ArrowUpRight size={14} />
          +2.38%
        </div>
      </div>
    </div>
    <div className="bg-[#1E222D] rounded-xl overflow-hidden">
      {futuresData.map((item) => (
        <MarketRow key={item.symbol} item={item} />
      ))}
    </div>
    <button className="mt-3 text-[13px] text-[#2962FF] hover:text-[#5B8DEF] flex items-center gap-1 transition-colors">
      See all futures <ExternalLink size={12} />
    </button>
  </div>
);

const ForexTab = () => (
  <div>
    <div className="bg-[#1E222D] rounded-xl overflow-hidden">
      {forexData.map((item) => (
        <MarketRow key={item.symbol} item={item} />
      ))}
    </div>
    <button className="mt-3 text-[13px] text-[#2962FF] hover:text-[#5B8DEF] flex items-center gap-1 transition-colors">
      See all rates <ExternalLink size={12} />
    </button>
  </div>
);

const EconomyTab = () => (
  <div>
    <h3 className="text-[13px] font-semibold text-[#787B86] uppercase tracking-wider mb-3 px-1">Economic Calendar</h3>
    <div className="bg-[#1E222D] rounded-xl overflow-hidden">
      {economicEvents.map((event, i) => (
        <div key={i} className="flex items-center justify-between py-3 px-4 border-b border-[#2A2E39] last:border-b-0 hover:bg-[#252930] transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-[#787B86] font-mono w-12">{event.time}</span>
            <div className="w-6 h-4 rounded-sm bg-[#2A2E39] flex items-center justify-center">
              <span className="text-[8px] font-bold text-[#787B86]">{event.country}</span>
            </div>
            <span className="text-[13px] text-[#D1D4DC]">{event.event}</span>
          </div>
          <div className="flex items-center gap-4 text-[12px]">
            <div className="text-right hidden sm:block">
              <span className="text-[#787B86]">Actual </span>
              <span className="text-white font-medium">{event.actual}</span>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-[#787B86]">Forecast </span>
              <span className="text-[#D1D4DC]">{event.forecast}</span>
            </div>
            <div className="text-right">
              <span className="text-[#787B86]">Prior </span>
              <span className="text-[#D1D4DC]">{event.prior}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
    <button className="mt-3 text-[13px] text-[#2962FF] hover:text-[#5B8DEF] flex items-center gap-1 transition-colors">
      See all economic indicators <ExternalLink size={12} />
    </button>
  </div>
);

const BrokersTab = () => (
  <div>
    <p className="text-[14px] text-[#787B86] mb-4">Trade directly on Supercharts through our supported, fully-verified, and user-reviewed brokers.</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {brokersData.map((broker) => (
        <div key={broker.name} className="bg-[#1E222D] rounded-xl p-4 hover:bg-[#252930] transition-colors cursor-pointer group">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-white">{broker.name}</span>
                {broker.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2962FF20] text-[#2962FF] font-medium">{broker.badge}</span>
                )}
              </div>
              <span className="text-[12px] text-[#787B86]">{broker.type}</span>
            </div>
            {broker.featured && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#F7931A20] text-[#F7931A] font-medium">Featured</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-bold text-white">{broker.rating}</span>
            <div className="flex">
              {[...Array(5)].map((_, j) => (
                <svg key={j} width="12" height="12" viewBox="0 0 12 12">
                  <path
                    d="M6 1l1.5 3.1 3.4.5-2.5 2.4.6 3.4L6 8.9 3 10.4l.6-3.4L1.1 4.6l3.4-.5z"
                    fill={j < Math.floor(parseFloat(broker.rating)) ? '#F7931A' : '#2A2E39'}
                  />
                </svg>
              ))}
            </div>
            <span className="text-[11px] text-[#787B86]">{broker.ratingLabel}</span>
          </div>
        </div>
      ))}
    </div>
    <button className="mt-3 text-[13px] text-[#2962FF] hover:text-[#5B8DEF] flex items-center gap-1 transition-colors">
      See all brokers <ExternalLink size={12} />
    </button>
  </div>
);

const tabs = [
  { id: 'summary', label: 'Market summary', component: MarketSummaryTab },
  { id: 'stocks', label: 'US stocks', component: USStocksTab },
  { id: 'crypto', label: 'Crypto', component: CryptoTab },
  { id: 'futures', label: 'Futures', component: FuturesTab },
  { id: 'forex', label: 'Forex', component: ForexTab },
  { id: 'economy', label: 'Economy', component: EconomyTab },
];

const MarketOverview = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || MarketSummaryTab;

  return (
    <section className="bg-[#131722] py-8">
      <div className="max-w-[800px] mx-auto px-4">
        {/* Tab bar */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-[13px] font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#2962FF] text-white'
                  : 'text-[#787B86] hover:text-[#D1D4DC] hover:bg-[#1E222D]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active tab content */}
        <div className="min-h-[400px]">
          <ActiveComponent />
        </div>
      </div>
    </section>
  );
};

export default MarketOverview;
