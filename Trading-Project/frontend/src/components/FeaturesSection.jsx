import React from 'react';
import { BarChart3, LineChart, Layers, Code, Bell, Globe, Shield, Users, Zap, TrendingUp, LayoutGrid, Newspaper } from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    title: 'Advanced charts',
    description: 'The world\'s most powerful charting platform with 100+ indicators, 90+ drawing tools, and multiple chart types.',
  },
  {
    icon: LineChart,
    title: 'Technical analysis',
    description: 'Full suite of professional TA tools. From simple trend lines to complex patterns, everything you need.',
  },
  {
    icon: Layers,
    title: 'Multi-layout support',
    description: 'Compare multiple symbols across different timeframes with customizable multi-chart layouts.',
  },
  {
    icon: Code,
    title: 'Pine Script™',
    description: 'Create your own indicators and strategies with our proprietary coding language. 100,000+ community scripts.',
  },
  {
    icon: Bell,
    title: 'Smart alerts',
    description: 'Set alerts on any condition. Price crossing, indicator signals, or custom strategies. Get notified instantly.',
  },
  {
    icon: Globe,
    title: 'Global coverage',
    description: 'Access data from 100+ exchanges worldwide. Stocks, crypto, forex, futures, bonds — all in one platform.',
  },
  {
    icon: Shield,
    title: 'Paper trading',
    description: 'Practice trading with virtual money. Test strategies risk-free before going live with real capital.',
  },
  {
    icon: Users,
    title: 'Social network',
    description: 'Follow top traders, share ideas, and learn from a community of 100 million. The largest trading community.',
  },
  {
    icon: Zap,
    title: 'Real-time data',
    description: 'Lightning-fast real-time data feeds with low latency. Professional-grade data at your fingertips.',
  },
  {
    icon: TrendingUp,
    title: 'Stock screener',
    description: 'Scan the entire market with 100+ filters. Find stocks matching any criteria in seconds.',
  },
  {
    icon: LayoutGrid,
    title: 'Heat maps',
    description: 'Visualize market performance at a glance. See what\'s moving across sectors and industries.',
  },
  {
    icon: Newspaper,
    title: 'Financial news',
    description: 'Integrated news from top providers. Stay informed with real-time headlines and analysis.',
  },
];

const FeaturesSection = () => {
  return (
    <section className="bg-[#131722] py-16 border-t border-[#2A2E39]">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-[28px] md:text-[36px] font-bold text-white mb-3">
            Explore features
          </h2>
          <p className="text-[15px] text-[#787B86] max-w-[520px] mx-auto">
            Everything you need to analyze markets, develop strategies, and make informed trading decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className="group bg-[#1E222D] rounded-xl p-5 hover:bg-[#252930] transition-all cursor-pointer hover:translate-y-[-2px] hover:shadow-lg"
              >
                <div className="w-10 h-10 rounded-lg bg-[#2962FF15] flex items-center justify-center mb-4 group-hover:bg-[#2962FF25] transition-colors">
                  <Icon size={20} className="text-[#2962FF]" />
                </div>
                <h3 className="text-[14px] font-semibold text-white mb-2 group-hover:text-[#2962FF] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-[12px] text-[#787B86] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
