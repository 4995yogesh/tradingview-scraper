import React from 'react';
import { ExternalLink, Clock } from 'lucide-react';
import { topStories } from '../data/mockData';

const TopStories = () => {
  return (
    <section className="bg-[#131722] py-12 border-t border-[#2A2E39]">
      <div className="max-w-[800px] mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-[22px] font-bold text-white">Top stories</h2>
            <ExternalLink size={16} className="text-[#787B86]" />
          </div>
        </div>

        <div className="bg-[#1E222D] rounded-xl overflow-hidden">
          {topStories.map((story, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 border-b border-[#2A2E39] last:border-b-0 hover:bg-[#252930] transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#2A2E39] flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[9px] font-bold text-[#787B86]">{story.symbol?.slice(0, 3)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] text-[#D1D4DC] font-medium group-hover:text-white transition-colors line-clamp-2 leading-snug">
                  {story.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <Clock size={11} className="text-[#787B86]" />
                  <span className="text-[11px] text-[#787B86]">{story.time}</span>
                  <span className="text-[11px] text-[#787B86]">·</span>
                  <span className="text-[11px] text-[#787B86]">{story.source}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <button className="text-[13px] text-[#2962FF] hover:text-[#5B8DEF] flex items-center gap-1 mx-auto transition-colors">
            Keep reading <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default TopStories;
