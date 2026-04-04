import React, { useState } from 'react';
import { MessageSquare, Heart, ArrowUpRight, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { communityIdeas } from '../data/mockData';

const IdeaCard = ({ idea }) => {
  const [liked, setLiked] = useState(false);

  // Generate a simple chart path
  const chartPath = idea.direction === 'Long'
    ? 'M10 70 Q50 65, 90 50 T170 30 T250 20 T330 15'
    : idea.chartColor === '#EF5350'
      ? 'M10 20 Q50 25, 90 40 T170 55 T250 65 T330 72'
      : 'M10 40 Q50 35, 90 45 T170 35 T250 50 T330 38';

  return (
    <div className="bg-[#1E222D] rounded-xl overflow-hidden hover:bg-[#252930] transition-all cursor-pointer group">
      {/* Chart preview */}
      <div className="relative h-[140px] bg-[#131722] overflow-hidden">
        <svg width="100%" height="140" viewBox="0 0 340 80" preserveAspectRatio="none" className="opacity-60 group-hover:opacity-80 transition-opacity">
          <defs>
            <linearGradient id={`grad-${idea.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={idea.chartColor} stopOpacity="0.2" />
              <stop offset="100%" stopColor={idea.chartColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={chartPath} fill={`url(#grad-${idea.id})`} />
          <path d={chartPath} fill="none" stroke={idea.chartColor} strokeWidth="2" />
        </svg>
        {/* Direction badge */}
        {idea.direction && (
          <div className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${
            idea.direction === 'Long'
              ? 'bg-[#26A69A30] text-[#26A69A]'
              : 'bg-[#EF535030] text-[#EF5350]'
          }`}>
            {idea.direction === 'Long' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {idea.direction}
          </div>
        )}
        {/* Symbol badge */}
        <div className="absolute top-2 left-2 px-2 py-1 rounded bg-[#1E222D99] text-[10px] font-bold text-[#D1D4DC] backdrop-blur-sm">
          {idea.symbol}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-[14px] font-semibold text-white mb-2 line-clamp-2 group-hover:text-[#2962FF] transition-colors">
          {idea.title}
        </h3>
        <p className="text-[12px] text-[#787B86] line-clamp-2 mb-3">
          {idea.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#2962FF30] flex items-center justify-center">
              <span className="text-[8px] font-bold text-[#2962FF]">{idea.author[0]}</span>
            </div>
            <span className="text-[11px] text-[#787B86]">{idea.author}</span>
            <span className="text-[11px] text-[#787B86]">{idea.date}</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1 text-[#787B86] hover:text-[#D1D4DC] transition-colors">
              <MessageSquare size={12} />
              <span className="text-[11px]">{idea.comments}</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
              className={`flex items-center gap-1 transition-colors ${liked ? 'text-[#EF5350]' : 'text-[#787B86] hover:text-[#D1D4DC]'}`}
            >
              <Heart size={12} fill={liked ? '#EF5350' : 'none'} />
              <span className="text-[11px]">{liked ? idea.likes + 1 : idea.likes}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CommunityIdeas = () => {
  const [filter, setFilter] = useState('editors');

  return (
    <section className="bg-[#131722] py-12">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-[22px] font-bold text-white">Community ideas</h2>
            <ArrowUpRight size={18} className="text-[#787B86]" />
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setFilter('editors')}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                filter === 'editors' ? 'bg-[#2A2E39] text-white' : 'text-[#787B86] hover:text-[#D1D4DC]'
              }`}
            >
              Editors' picks
            </button>
            <button
              onClick={() => setFilter('popular')}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                filter === 'popular' ? 'bg-[#2A2E39] text-white' : 'text-[#787B86] hover:text-[#D1D4DC]'
              }`}
            >
              Popular
            </button>
          </div>
        </div>

        {/* Ideas grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {communityIdeas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>

        <div className="mt-6 text-center">
          <button className="text-[13px] text-[#2962FF] hover:text-[#5B8DEF] flex items-center gap-1 mx-auto transition-colors">
            See all editors' picks ideas <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default CommunityIdeas;
