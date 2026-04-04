import React from 'react';
import { Monitor, Smartphone, BarChart3, TrendingUp, Globe } from 'lucide-react';

const PricingSection = () => {
  const plans = [
    {
      name: 'Basic',
      price: 'Free',
      period: '',
      description: 'For casual investors looking to stay informed',
      features: ['1 chart per tab', 'Up to 3 indicators per chart', 'Basic chart types', 'Community access', '12 bar types'],
      cta: 'Get started',
      highlighted: false,
    },
    {
      name: 'Essential',
      price: '$14.95',
      period: '/mo',
      description: 'For active traders with essential tools',
      features: ['2 charts per tab', 'Up to 5 indicators per chart', 'All chart types', 'No ads', '10 alerts', 'Volume profile'],
      cta: 'Try free for 30 days',
      highlighted: false,
    },
    {
      name: 'Plus',
      price: '$29.95',
      period: '/mo',
      description: 'For experienced traders needing more power',
      features: ['4 charts per tab', 'Up to 10 indicators per chart', 'All chart types', 'No ads', '50 alerts', 'Custom timeframes', 'Export data'],
      cta: 'Try free for 30 days',
      highlighted: true,
    },
    {
      name: 'Premium',
      price: '$59.95',
      period: '/mo',
      description: 'For professional traders with maximum tools',
      features: ['8 charts per tab', 'Up to 25 indicators per chart', 'All chart types', 'No ads', '400 alerts', 'Second-based intervals', 'Priority support'],
      cta: 'Try free for 30 days',
      highlighted: false,
    },
  ];

  return (
    <section className="bg-[#131722] py-16 border-t border-[#2A2E39]">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-[28px] md:text-[36px] font-bold text-white mb-3">
            Start for free, upgrade anytime
          </h2>
          <p className="text-[15px] text-[#787B86] max-w-[480px] mx-auto">
            Flexible plans to match your trading style. All plans include core features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl p-5 transition-all hover:translate-y-[-2px] ${
                plan.highlighted
                  ? 'bg-[#2962FF15] border-2 border-[#2962FF40] relative'
                  : 'bg-[#1E222D] border border-[#2A2E39]'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#2962FF] text-white text-[10px] font-bold rounded-full">
                  MOST POPULAR
                </div>
              )}
              <div className="mb-4">
                <h3 className="text-[16px] font-semibold text-white mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[28px] font-bold text-white">{plan.price}</span>
                  {plan.period && <span className="text-[13px] text-[#787B86]">{plan.period}</span>}
                </div>
                <p className="text-[12px] text-[#787B86] mt-2">{plan.description}</p>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-[12px] text-[#D1D4DC]">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#26A69A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-2.5 rounded-lg text-[13px] font-semibold transition-colors ${
                  plan.highlighted
                    ? 'bg-[#2962FF] hover:bg-[#1E53E5] text-white'
                    : 'bg-[#2A2E39] hover:bg-[#363A45] text-[#D1D4DC]'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Devices section */}
        <div className="mt-16 text-center">
          <h3 className="text-[20px] font-bold text-white mb-3">Available everywhere</h3>
          <p className="text-[14px] text-[#787B86] mb-8">Access your charts and ideas from any device</p>
          <div className="flex justify-center gap-8">
            {[
              { icon: Monitor, label: 'Desktop' },
              { icon: Smartphone, label: 'Mobile' },
              { icon: Globe, label: 'Web' },
              { icon: BarChart3, label: 'Tablet' },
              { icon: TrendingUp, label: 'Apple Watch' },
            ].map((device) => {
              const Icon = device.icon;
              return (
                <div key={device.label} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-[#1E222D] flex items-center justify-center hover:bg-[#2A2E39] transition-colors cursor-pointer">
                    <Icon size={22} className="text-[#787B86]" />
                  </div>
                  <span className="text-[11px] text-[#787B86]">{device.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
