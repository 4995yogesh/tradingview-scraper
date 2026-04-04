import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-[#0C0E15] border-t border-[#2A2E39]">
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="flex items-center gap-3">
          <svg width="24" height="14" viewBox="0 0 36 20" fill="none">
            <path d="M14 0L14 6L20 6L20 0L14 0Z" fill="#2962FF" />
            <path d="M14 7L14 20L20 20L20 7L14 7Z" fill="#2962FF" />
            <path d="M21 4L21 20L27 20L27 4L21 4Z" fill="#2962FF" />
            <path d="M28 0L28 20L34 20L34 0L28 0Z" fill="#2962FF" />
            <path d="M0 10L0 20L6 20L6 10L0 10Z" fill="#2962FF" />
            <path d="M7 6L7 20L13 20L13 6L7 6Z" fill="#2962FF" />
          </svg>
          <span className="text-[12px] text-[#787B86]">TradingView</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
