import React, { useState } from 'react';
import { Search, ChevronDown, Globe, Menu, X } from 'lucide-react';
import { navItems } from '../data/mockData';

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#131722] border-b border-[#2A2E39]">
      <div className="max-w-[1440px] mx-auto px-4 h-[52px] flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center gap-1">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 mr-4 shrink-0">
            <svg width="36" height="20" viewBox="0 0 36 20" fill="none">
              <path d="M14 0L14 6L20 6L20 0L14 0Z" fill="#2962FF"/>
              <path d="M14 7L14 20L20 20L20 7L14 7Z" fill="#2962FF"/>
              <path d="M21 4L21 20L27 20L27 4L21 4Z" fill="#2962FF"/>
              <path d="M28 0L28 20L34 20L34 0L28 0Z" fill="#2962FF"/>
              <path d="M0 10L0 20L6 20L6 10L0 10Z" fill="#2962FF"/>
              <path d="M7 6L7 20L13 20L13 6L7 6Z" fill="#2962FF"/>
            </svg>
            <span className="text-white font-bold text-[18px] tracking-tight hidden sm:block">TradingView</span>
          </a>

          {/* Nav Items - Desktop */}
          <div className="hidden lg:flex items-center">
            {navItems.map((item) => (
              <button
                key={item.label}
                className="flex items-center gap-0.5 px-3 py-1.5 text-[13px] text-[#D1D4DC] hover:text-white transition-colors rounded hover:bg-[#2A2E39]"
              >
                {item.label}
                {item.hasDropdown && <ChevronDown size={14} className="text-[#787B86]" />}
              </button>
            ))}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1">
          {/* Search */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 text-[#787B86] hover:text-white hover:bg-[#2A2E39] rounded transition-colors"
          >
            <Search size={18} />
          </button>

          {/* Language */}
          <button className="hidden md:flex items-center gap-1 px-2 py-1.5 text-[13px] text-[#787B86] hover:text-white hover:bg-[#2A2E39] rounded transition-colors">
            <Globe size={16} />
            <span>EN</span>
            <ChevronDown size={12} />
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-[#787B86] hover:text-white hover:bg-[#2A2E39] rounded transition-colors ml-1"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="absolute top-[52px] left-0 right-0 bg-[#1E222D] border-b border-[#2A2E39] p-4">
          <div className="max-w-[600px] mx-auto">
            <div className="flex items-center gap-3 bg-[#131722] border border-[#2A2E39] rounded-lg px-4 py-3">
              <Search size={18} className="text-[#787B86]" />
              <input
                type="text"
                placeholder="Search symbols, ideas, scripts..."
                className="bg-transparent text-white text-[14px] outline-none flex-1 placeholder-[#787B86]"
                autoFocus
              />
              <kbd className="text-[11px] text-[#787B86] bg-[#2A2E39] px-2 py-0.5 rounded">ESC</kbd>
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden absolute top-[52px] left-0 right-0 bg-[#1E222D] border-b border-[#2A2E39] py-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              className="flex items-center justify-between w-full px-4 py-3 text-[14px] text-[#D1D4DC] hover:text-white hover:bg-[#2A2E39] transition-colors"
            >
              {item.label}
              {item.hasDropdown && <ChevronDown size={16} className="text-[#787B86]" />}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
