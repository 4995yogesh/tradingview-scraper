import React from 'react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative">
      {/* Hero content */}
      <div className="relative bg-[#131722] overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[10%] left-[50%] translate-x-[-50%] w-[800px] h-[800px] rounded-full bg-[#2962FF] opacity-[0.04] blur-[120px]" />
          <div className="absolute bottom-0 left-0 right-0 h-[300px] bg-gradient-to-t from-[#131722] to-transparent" />
          {/* Stars/dots background */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(1px 1px at 20px 30px, #2A2E39, transparent), radial-gradient(1px 1px at 40px 70px, #2A2E39, transparent), radial-gradient(1px 1px at 80px 40px, #2A2E39, transparent), radial-gradient(1px 1px at 120px 90px, #2A2E39, transparent), radial-gradient(1px 1px at 160px 20px, #2A2E39, transparent)',
            backgroundSize: '200px 100px',
          }} />
        </div>

        <div className="relative max-w-[1200px] mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="text-center">
            {/* Main headline */}
            <h1 className="text-[40px] md:text-[56px] lg:text-[72px] font-bold text-white leading-[1.1] tracking-tight mb-6">
              The best trades require<br />
              <span className="text-[#D1D4DC]">research, then commitment.</span>
            </h1>

            {/* CTA */}
            <div className="flex flex-col items-center gap-3 mb-12">
              <button
                onClick={() => navigate('/chart')}
                className="px-8 py-3.5 bg-[#2962FF] hover:bg-[#1E53E5] text-white text-[16px] font-semibold rounded-lg transition-all hover:shadow-[0_0_30px_rgba(41,98,255,0.3)] active:scale-[0.98]"
              >
                Launch Chart
              </button>
              <p className="text-[13px] text-[#787B86]">
                Full charting platform with professional tools
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              <div className="text-center">
                <div className="text-[28px] md:text-[36px] font-bold text-white">100M+</div>
                <div className="text-[13px] text-[#787B86] mt-1">Traders and Investors</div>
              </div>
              <div className="text-center">
                <div className="text-[28px] md:text-[36px] font-bold text-white">1.5M+</div>
                <div className="text-[13px] text-[#787B86] mt-1">Ideas shared daily</div>
              </div>
              <div className="text-center">
                <div className="text-[28px] md:text-[36px] font-bold text-white">250+</div>
                <div className="text-[13px] text-[#787B86] mt-1">Data feeds & exchanges</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* "Where the world does markets" tagline */}
      <div className="bg-[#131722] pb-8">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-[28px] md:text-[36px] font-bold text-white mb-3">
              Where the world does markets
            </h2>
            <p className="text-[15px] text-[#787B86] max-w-[500px] mx-auto">
              Join 100 million traders and investors taking the future into their own hands.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
