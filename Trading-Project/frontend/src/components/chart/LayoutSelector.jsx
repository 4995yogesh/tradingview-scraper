import React, { useState } from 'react';
import { Layout } from 'lucide-react';

const layouts = [
  { id: '1', label: 'Single', grid: [[1]], icon: (active) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="1" y="1" width="18" height="18" rx="2" stroke={active ? '#2962FF' : '#787B86'} strokeWidth="1.5" />
    </svg>
  )},
  { id: '2h', label: '2 Horizontal', grid: [[1, 1]], icon: (active) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="1" y="1" width="8" height="18" rx="1" stroke={active ? '#2962FF' : '#787B86'} strokeWidth="1.2" />
      <rect x="11" y="1" width="8" height="18" rx="1" stroke={active ? '#2962FF' : '#787B86'} strokeWidth="1.2" />
    </svg>
  )},
  { id: '2v', label: '2 Vertical', grid: [[1], [1]], icon: (active) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="1" y="1" width="18" height="8" rx="1" stroke={active ? '#2962FF' : '#787B86'} strokeWidth="1.2" />
      <rect x="1" y="11" width="18" height="8" rx="1" stroke={active ? '#2962FF' : '#787B86'} strokeWidth="1.2" />
    </svg>
  )},
  { id: '4', label: '4 Grid', grid: [[1, 1], [1, 1]], icon: (active) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="1" y="1" width="8" height="8" rx="1" stroke={active ? '#2962FF' : '#787B86'} strokeWidth="1.2" />
      <rect x="11" y="1" width="8" height="8" rx="1" stroke={active ? '#2962FF' : '#787B86'} strokeWidth="1.2" />
      <rect x="1" y="11" width="8" height="8" rx="1" stroke={active ? '#2962FF' : '#787B86'} strokeWidth="1.2" />
      <rect x="11" y="11" width="8" height="8" rx="1" stroke={active ? '#2962FF' : '#787B86'} strokeWidth="1.2" />
    </svg>
  )},
  { id: '3r', label: '1+2 Right', grid: 'custom', icon: (active) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="1" y="1" width="11" height="18" rx="1" stroke={active ? '#2962FF' : '#787B86'} strokeWidth="1.2" />
      <rect x="14" y="1" width="5" height="8" rx="1" stroke={active ? '#2962FF' : '#787B86'} strokeWidth="1.2" />
      <rect x="14" y="11" width="5" height="8" rx="1" stroke={active ? '#2962FF' : '#787B86'} strokeWidth="1.2" />
    </svg>
  )},
];

const LayoutSelector = ({ activeLayout, onLayoutChange, isOpen, onToggle }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full right-0 mt-1 w-[200px] bg-[#1E222D] rounded-md shadow-2xl border border-[#363A45] z-50 py-2">
      <div className="px-3 py-1.5 text-[10px] text-[#787B86] font-medium uppercase tracking-wider">Chart Layout</div>
      {layouts.map(layout => (
        <button
          key={layout.id}
          onClick={() => { onLayoutChange(layout.id); onToggle(); }}
          className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-[#2A2E39] transition-colors ${
            activeLayout === layout.id ? 'text-[#2962FF]' : 'text-[#D1D4DC]'
          }`}
        >
          {layout.icon(activeLayout === layout.id)}
          <span className="text-[12px]">{layout.label}</span>
        </button>
      ))}
    </div>
  );
};

export default LayoutSelector;
export { layouts };
