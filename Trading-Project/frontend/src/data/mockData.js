// Mock data for TradingView clone

export const tickerData = [
  { symbol: 'SPX', name: 'S&P 500', price: '6,147.43', change: '-1.67%', isUp: false },
  { symbol: 'NDX', name: 'Nasdaq 100', price: '21,478.05', change: '-1.93%', isUp: false },
  { symbol: 'DJI', name: 'Dow 30', price: '42,112.34', change: '-0.82%', isUp: false },
  { symbol: 'BTCUSD', name: 'Bitcoin', price: '104,387.00', change: '+2.17%', isUp: true },
  { symbol: 'ETHUSD', name: 'Ethereum', price: '2,645.30', change: '+3.16%', isUp: true },
  { symbol: 'EURUSD', name: 'EUR/USD', price: '1.08142', change: '+0.09%', isUp: true },
  { symbol: 'GOLD', name: 'Gold', price: '3,247.50', change: '+1.22%', isUp: true },
  { symbol: 'AAPL', name: 'Apple', price: '248.80', change: '-1.62%', isUp: false },
  { symbol: 'TSLA', name: 'Tesla', price: '271.85', change: '+3.50%', isUp: true },
  { symbol: 'NVDA', name: 'NVIDIA', price: '113.76', change: '-2.10%', isUp: false },
  { symbol: 'AMZN', name: 'Amazon', price: '199.34', change: '-3.95%', isUp: false },
  { symbol: 'CL1!', name: 'Crude Oil', price: '69.84', change: '+1.20%', isUp: true },
  { symbol: 'SI1!', name: 'Silver', price: '34.595', change: '+1.14%', isUp: true },
];

export const majorIndices = [
  { symbol: 'NDX', name: 'Nasdaq 100', exchange: 'NASDAQ', price: '21,478.05', currency: 'USD', change: '-1.93%', isUp: false, status: 'closed', sparkline: [80, 82, 79, 85, 83, 78, 76, 74, 72, 75, 73, 71] },
  { symbol: 'NI225', name: 'Japan 225', exchange: 'TVC', price: '38,741.85', currency: 'JPY', change: '-3.06%', isUp: false, status: 'open', sparkline: [90, 88, 85, 82, 80, 78, 75, 73, 70, 72, 71, 69] },
  { symbol: '000001', name: 'SSE Composite', exchange: 'SSE', price: '3,319.21', currency: 'CNY', change: '+0.14%', isUp: true, status: 'open', sparkline: [50, 51, 50, 52, 53, 52, 54, 53, 55, 54, 53, 54] },
  { symbol: 'UKX', name: 'FTSE 100', exchange: 'FTSE', price: '8,667.35', currency: 'GBP', change: '-0.05%', isUp: false, status: 'closed', sparkline: [70, 71, 70, 69, 70, 71, 70, 69, 70, 69, 70, 69] },
  { symbol: 'DAX', name: 'DAX', exchange: 'XETR', price: '22,300.75', currency: 'EUR', change: '-1.38%', isUp: false, status: 'closed', sparkline: [85, 84, 83, 81, 82, 80, 78, 77, 79, 78, 76, 75] },
  { symbol: 'PX1', name: 'CAC 40', exchange: 'EURONEXT', price: '7,701.95', currency: 'EUR', change: '-0.87%', isUp: false, status: 'closed', sparkline: [75, 74, 73, 72, 73, 71, 70, 72, 71, 70, 69, 68] },
];

export const cryptoData = [
  { symbol: 'BTCUSD', name: 'Bitcoin', price: '104,387', currency: 'USD', change: '+2.17%', isUp: true, status: 'open', sparkline: [60, 62, 65, 63, 67, 70, 68, 72, 74, 73, 75, 77] },
  { symbol: 'ETHUSD', name: 'Ethereum', price: '2,645.3', currency: 'USD', change: '+3.16%', isUp: true, status: 'open', sparkline: [40, 42, 44, 43, 46, 48, 47, 50, 52, 51, 53, 55] },
  { symbol: 'SOLUSD', name: 'Solana', price: '189.42', currency: 'USD', change: '+4.23%', isUp: true, status: 'open', sparkline: [30, 33, 35, 34, 38, 40, 39, 42, 44, 43, 46, 48] },
  { symbol: 'XRPUSD', name: 'XRP', price: '2.34', currency: 'USD', change: '-1.05%', isUp: false, status: 'open', sparkline: [55, 54, 53, 52, 51, 50, 51, 49, 48, 49, 48, 47] },
  { symbol: 'ADAUSD', name: 'Cardano', price: '0.7821', currency: 'USD', change: '+1.87%', isUp: true, status: 'open', sparkline: [20, 21, 22, 21, 23, 24, 23, 25, 26, 25, 27, 28] },
  { symbol: 'DOTUSD', name: 'Polkadot', price: '7.45', currency: 'USD', change: '-0.53%', isUp: false, status: 'open', sparkline: [45, 44, 43, 44, 42, 41, 42, 40, 39, 40, 39, 38] },
];

export const futuresData = [
  { symbol: 'CL1!', name: 'Crude Oil', price: '69.84', unit: 'USD / barrel', change: '+1.20%', isUp: true, status: 'open', sparkline: [60, 62, 63, 61, 65, 67, 66, 68, 70, 69, 71, 72] },
  { symbol: 'NG1!', name: 'Natural Gas', price: '2.926', unit: 'USD / million BTUs', change: '-3.27%', isUp: false, status: 'open', sparkline: [50, 48, 47, 46, 44, 45, 43, 42, 41, 40, 39, 38] },
  { symbol: 'GC1!', name: 'Gold', price: '3,247.5', unit: 'USD / troy ounce', change: '+1.22%', isUp: true, status: 'open', sparkline: [55, 57, 58, 60, 59, 62, 64, 63, 66, 65, 67, 68] },
  { symbol: 'HG1!', name: 'Copper', price: '5.5035', unit: 'USD / pound', change: '+0.16%', isUp: true, status: 'open', sparkline: [50, 51, 50, 52, 51, 53, 52, 54, 53, 55, 54, 55] },
  { symbol: 'SI1!', name: 'Silver', price: '34.595', unit: 'USD / troy ounce', change: '+1.14%', isUp: true, status: 'open', sparkline: [40, 42, 43, 44, 43, 46, 45, 47, 48, 47, 49, 50] },
  { symbol: 'PA1!', name: 'Palladium', price: '1,024.0', unit: 'USD / troy ounce', change: '+1.27%', isUp: true, status: 'open', sparkline: [35, 37, 36, 38, 39, 38, 40, 41, 40, 42, 43, 44] },
];

export const forexData = [
  { symbol: 'EURUSD', name: 'EUR/USD', price: '1.08142', change: '+0.09%', isUp: true, status: 'open', sparkline: [50, 51, 50, 52, 51, 53, 52, 51, 53, 52, 54, 53] },
  { symbol: 'USDJPY', name: 'USD/JPY', price: '149.850', change: '-0.38%', isUp: false, status: 'open', sparkline: [60, 59, 58, 59, 57, 56, 57, 55, 56, 55, 54, 53] },
  { symbol: 'GBPUSD', name: 'GBP/USD', price: '1.29420', change: '+0.16%', isUp: true, status: 'open', sparkline: [45, 46, 47, 46, 48, 47, 49, 48, 50, 49, 51, 50] },
  { symbol: 'AUDUSD', name: 'AUD/USD', price: '0.63150', change: '-0.01%', isUp: false, status: 'open', sparkline: [40, 39, 40, 38, 39, 37, 38, 36, 37, 36, 35, 36] },
  { symbol: 'USDCAD', name: 'USD/CAD', price: '1.38540', change: '+0.22%', isUp: true, status: 'open', sparkline: [50, 51, 52, 51, 53, 54, 53, 55, 54, 56, 55, 56] },
  { symbol: 'USDCHF', name: 'USD/CHF', price: '0.88320', change: '-0.08%', isUp: false, status: 'open', sparkline: [55, 54, 53, 54, 52, 53, 51, 52, 50, 51, 50, 49] },
];

export const usStocks = [
  { symbol: 'AAPL', name: 'Apple Inc', price: '248.80', currency: 'USD', change: '-1.62%', isUp: false },
  { symbol: 'MSFT', name: 'Microsoft Corp', price: '383.67', currency: 'USD', change: '-0.87%', isUp: false },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', price: '199.34', currency: 'USD', change: '-3.95%', isUp: false },
  { symbol: 'NVDA', name: 'NVIDIA Corp', price: '113.76', currency: 'USD', change: '-2.10%', isUp: false },
  { symbol: 'TSLA', name: 'Tesla, Inc.', price: '271.85', currency: 'USD', change: '+3.50%', isUp: true },
  { symbol: 'META', name: 'Meta Platforms', price: '596.25', currency: 'USD', change: '-1.23%', isUp: false },
  { symbol: 'GOOGL', name: 'Alphabet Inc', price: '167.89', currency: 'USD', change: '-0.95%', isUp: false },
  { symbol: 'AMD', name: 'Advanced Micro Devices', price: '121.99', currency: 'USD', change: '-0.87%', isUp: false },
  { symbol: 'AVGO', name: 'Broadcom Inc.', price: '200.68', currency: 'USD', change: '-2.82%', isUp: false },
  { symbol: 'COIN', name: 'Coinbase Global', price: '261.14', currency: 'USD', change: '-7.06%', isUp: false },
];

export const communityIdeas = [
  {
    id: 1,
    title: 'USD/JPY: The 150.00 Test',
    description: 'For the first time since October USD/JPY has pushed above the 150.00 handle. The move hit around 1am Tokyo time so we could still see a response from Japanese policymakers...',
    author: 'FOREX.com',
    authorHandle: 'FOREXcom',
    symbol: 'USDJPY',
    type: 'editors-pick',
    date: 'Mar 27',
    comments: 1,
    likes: 45,
    direction: null,
    chartColor: '#2962FF',
  },
  {
    id: 2,
    title: 'Bitcoin Key Support Level at 100,000',
    description: 'It has fallen from recent highs, but technical support could be near, and also supported by several fundamental factors including new SEC rules and upcoming legislation...',
    author: 'konhow',
    authorHandle: 'konhow',
    symbol: 'BTC1!',
    type: 'editors-pick',
    date: 'Mar 25',
    comments: 12,
    likes: 108,
    direction: 'Long',
    chartColor: '#26A69A',
  },
  {
    id: 3,
    title: 'NVDA - On Verge of Breakdown',
    description: 'I have been monitoring this trendline for quite some time, and with Friday close, NVDA has broken below a trendline it has been holding for the past six to seven months...',
    author: 'VIAQUANT',
    authorHandle: 'VIAQUANT',
    symbol: 'NVDA',
    type: 'editors-pick',
    date: 'Mar 22',
    comments: 19,
    likes: 79,
    direction: null,
    chartColor: '#EF5350',
  },
  {
    id: 4,
    title: 'Silver Analysis: Which Direction Is Next?',
    description: 'Before anything else, it is important to note that silver, unlike gold, tends to have sharp and aggressive corrective moves. This makes it a bit more challenging to trade...',
    author: 'behdark',
    authorHandle: 'behdark',
    symbol: 'XAGUSD',
    type: 'editors-pick',
    date: 'Mar 24',
    comments: 25,
    likes: 137,
    direction: null,
    chartColor: '#2962FF',
  },
  {
    id: 5,
    title: 'Super Micro Stock Under $20 After Brutal 33% Rout',
    description: 'The board of directors at Super Micro got together one day in the boardroom and decided it is a good idea to bring back the same executive who had already resigned once...',
    author: 'TradingView',
    authorHandle: 'TradingView',
    symbol: 'SMCI',
    type: 'editors-pick',
    date: 'Mar 23',
    comments: 20,
    likes: 215,
    direction: null,
    chartColor: '#EF5350',
  },
  {
    id: 6,
    title: 'Gold Weekly Chart Mid/Long Term Route Map',
    description: 'Please take a look at my weekly chart idea, which highlights our unique ascending Goldturn channel. Previously we saw the channel floor tested with precision...',
    author: 'Goldviewfx',
    authorHandle: 'Goldviewfx',
    symbol: 'XAUUSD',
    type: 'editors-pick',
    date: '19 hours ago',
    comments: 8,
    likes: 95,
    direction: 'Long',
    chartColor: '#26A69A',
  },
];

export const topStories = [
  { title: 'NFLX: Netflix Stock Adds 1% After Streamer Raises Prices Again', source: 'TradingView', time: '2 days ago', symbol: 'NFLX' },
  { title: 'META: Meta Stock Plunges 8% After Company Loses 2 Child Safety Court Trials', source: 'TradingView', time: '2 days ago', symbol: 'META' },
  { title: 'IXIC: Nasdaq Composite Dives into Correction, Erasing 10% from Peak Levels', source: 'TradingView', time: '2 days ago', symbol: 'IXIC' },
  { title: 'ARM: Arm Stock Pops 16% on Plans to Challenge Nvidia and Sell Its Own Chips', source: 'TradingView', time: '3 days ago', symbol: 'ARM' },
  { title: 'MSFT: Microsoft Stock Slumps 33% from Record. Big Support Looms at $369.', source: 'TradingView', time: '3 days ago', symbol: 'MSFT' },
  { title: 'TSLA: Tesla Stock Jumps 3.5% After Musk Unveils Terafab Joint Venture Project', source: 'TradingView', time: '5 days ago', symbol: 'TSLA' },
  { title: 'SPX: S&P 500 Futures Drop as Markets React to Latest Economic Data', source: 'TradingView', time: '5 days ago', symbol: 'SPX' },
  { title: 'XAU/USD: Gold Extends Rally with Prices Pushing Above $3,200', source: 'TradingView', time: '6 days ago', symbol: 'XAUUSD' },
];

export const brokersData = [
  { name: 'OKX', type: 'Crypto', rating: '4.9', ratingLabel: 'Excellent', featured: true, color: '#000' },
  { name: 'AMP Futures', type: 'Futures', rating: '4.6', ratingLabel: 'Excellent', featured: false, color: '#1a73e8' },
  { name: 'OANDA', type: 'Forex', rating: '4.5', ratingLabel: 'Great', featured: false, color: '#00a0e3', badge: 'Best 2023' },
  { name: 'FOREX.com', type: 'Forex', rating: '4.5', ratingLabel: 'Great', featured: false, color: '#0066cc' },
  { name: 'Interactive Brokers', type: 'Stocks, Crypto, Forex', rating: '4.2', ratingLabel: 'Good', featured: false, color: '#dc143c' },
  { name: 'TradeStation', type: 'Stocks, Futures, Options', rating: '4.3', ratingLabel: 'Good', featured: false, color: '#e31e24', badge: 'Best 2025' },
];

export const navItems = [
  { label: 'Products', hasDropdown: true },
  { label: 'Community', hasDropdown: true },
  { label: 'Markets', hasDropdown: true },
  { label: 'News', hasDropdown: true },
  { label: 'Brokers', hasDropdown: true },
  { label: 'More', hasDropdown: true },
];

export const footerLinks = {
  products: [
    'Supercharts', 'Pine Script', 'Stock Screener', 'ETF Screener',
    'Forex Screener', 'Crypto Screener', 'DEX Screener', 'Stock Heatmap',
    'ETF Heatmap', 'Crypto Heatmap'
  ],
  company: [
    'About', 'Features', 'Pricing', 'Wall of Love',
    'Athletes', 'Manifesto', 'Careers', 'Blog'
  ],
  community: [
    'Refer a friend', 'Ideas', 'Scripts', 'House Rules',
    'Moderators'
  ],
  forBusiness: [
    'Widgets', 'Charting Library', 'Lightweight Charts',
    'Advanced Charts', 'Trading Terminal', 'Brokerage Integration'
  ],
};

export const economicEvents = [
  { time: '08:30', country: 'US', event: 'GDP Growth Rate QoQ', actual: '2.8%', forecast: '2.6%', prior: '3.0%' },
  { time: '10:00', country: 'US', event: 'Consumer Confidence', actual: '-', forecast: '104.5', prior: '104.7' },
  { time: '14:00', country: 'US', event: 'Fed Interest Rate Decision', actual: '-', forecast: '5.25%', prior: '5.25%' },
  { time: '03:00', country: 'DE', event: 'CPI MoM', actual: '-', forecast: '0.3%', prior: '0.2%' },
  { time: '04:00', country: 'GB', event: 'Manufacturing PMI', actual: '48.2', forecast: '47.5', prior: '47.0' },
];

export const marketSummaryChart = [
  { date: 'Jan', value: 5800 },
  { date: 'Feb', value: 5950 },
  { date: 'Mar', value: 5850 },
  { date: 'Apr', value: 6050 },
  { date: 'May', value: 6100 },
  { date: 'Jun', value: 6200 },
  { date: 'Jul', value: 6150 },
  { date: 'Aug', value: 6300 },
  { date: 'Sep', value: 6250 },
  { date: 'Oct', value: 6400 },
  { date: 'Nov', value: 6350 },
  { date: 'Dec', value: 6147 },
];

export const cryptoMarketCap = [
  { date: 'W1', value: 2.1 },
  { date: 'W2', value: 2.15 },
  { date: 'W3', value: 2.08 },
  { date: 'W4', value: 2.2 },
  { date: 'W5', value: 2.25 },
  { date: 'W6', value: 2.18 },
  { date: 'W7', value: 2.28 },
  { date: 'W8', value: 2.3 },
];
