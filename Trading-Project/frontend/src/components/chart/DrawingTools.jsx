import React, { useState } from 'react';
import {
  MousePointer, Crosshair, TrendingUp, Minus, ArrowUpRight,
  GitBranch, Triangle, Square, Type, Ruler, ZoomIn, Magnet,
  Pencil, Circle, Hash, Waves, PenTool, Move, Eraser, Trash2,
  Eye, Lock, List, MoreHorizontal, ArrowDown
} from 'lucide-react';

// Left toolbar tools matching TradingView's exact order
const toolGroups = [
  {
    id: 'pointer-group',
    tools: [
      { id: 'cursor', icon: MousePointer, label: 'Cursor' },
    ],
  },
  {
    id: 'line-group',
    tools: [
      { id: 'trendline', icon: TrendingUp, label: 'Trend Line' },
    ],
  },
  {
    id: 'hline-group',
    tools: [
      { id: 'horizontal', icon: Minus, label: 'Horizontal Line' },
    ],
  },
  {
    id: 'fib-group',
    tools: [
      { id: 'fibonacci', icon: Waves, label: 'Fib Retracement' },
    ],
  },
  {
    id: 'brush-group',
    tools: [
      { id: 'brush', icon: Pencil, label: 'Brush' },
    ],
  },
  {
    id: 'text-group',
    tools: [
      { id: 'text', icon: Type, label: 'Text' },
    ],
  },
  {
    id: 'shape-group',
    tools: [
      { id: 'rectangle', icon: Square, label: 'Rectangle' },
    ],
  },
  {
    id: 'pattern-group',
    tools: [
      { id: 'triangle', icon: Triangle, label: 'Triangle Pattern' },
    ],
  },
  {
    id: 'arrow-group',
    tools: [
      { id: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
    ],
  },
  {
    id: 'channel-group',
    tools: [
      { id: 'channel', icon: GitBranch, label: 'Pitchfork' },
    ],
  },
  {
    id: 'measure-group',
    tools: [
      { id: 'measure', icon: Ruler, label: 'Measure' },
    ],
  },
  {
    id: 'zoom-group',
    tools: [
      { id: 'zoom', icon: ZoomIn, label: 'Zoom In' },
    ],
  },
  {
    id: 'magnet-group',
    tools: [
      { id: 'magnet', icon: Magnet, label: 'Magnet Mode' },
    ],
  },
  {
    id: 'drawmode-group',
    tools: [
      { id: 'drawmode', icon: Move, label: 'Stay in Drawing Mode' },
    ],
  },
  {
    id: 'visibility-group',
    tools: [
      { id: 'visibility', icon: Eye, label: 'Hide All Drawing Tools' },
    ],
  },
  {
    id: 'lock-group',
    tools: [
      { id: 'lock', icon: Lock, label: 'Lock All Drawing Tools' },
    ],
  },
  {
    id: 'object-group',
    tools: [
      { id: 'objecttree', icon: List, label: 'Object Tree' },
    ],
  },
  {
    id: 'delete-group',
    tools: [
      { id: 'delete-all', icon: Trash2, label: 'Remove Drawings' },
    ],
  },
];

const DrawingTools = ({ activeTool, onToolSelect, drawingsVisible, drawingsLocked }) => {
  const [hoveredTool, setHoveredTool] = useState(null);

  return (
    <div className="w-[48px] bg-[#131722] border-r border-[#2A2E39] flex flex-col items-center pt-1 pb-1 gap-[1px] overflow-y-auto scrollbar-hide shrink-0">
      {toolGroups.map((group, gIdx) => {
        const tool = group.tools[0];
        const Icon = tool.icon;
        let isActive = activeTool === tool.id;
        // For toggles, show active based on state
        if (tool.id === 'visibility') isActive = !drawingsVisible;
        if (tool.id === 'lock') isActive = drawingsLocked;
        const isHovered = hoveredTool === tool.id;

        // Add separator before measure, magnet, visibility, and delete groups
        const showSeparatorBefore = ['measure-group', 'magnet-group', 'visibility-group', 'delete-group'].includes(group.id);

        return (
          <React.Fragment key={group.id}>
            {showSeparatorBefore && (
              <div className="w-7 h-px bg-[#2A2E39] my-[3px]" />
            )}
            <div className="relative">
              <button
                onClick={() => onToolSelect(tool.id)}
                onMouseEnter={() => setHoveredTool(tool.id)}
                onMouseLeave={() => setHoveredTool(null)}
                className={`w-[38px] h-[38px] flex items-center justify-center rounded-[4px] transition-colors relative ${
                  isActive
                    ? 'bg-[#2962FF15] text-[#2962FF]'
                    : 'text-[#787B86] hover:text-[#D1D4DC] hover:bg-[#2A2E3950]'
                }`}
              >
                <Icon size={18} strokeWidth={1.5} />
                {/* Small triangle indicator for expandable tools */}
                {['trendline', 'horizontal', 'fibonacci', 'rectangle', 'triangle', 'channel'].includes(tool.id) && (
                  <div className="absolute bottom-[3px] right-[3px]">
                    <svg width="4" height="4" viewBox="0 0 4 4">
                      <path d="M0 0L4 4H0V0Z" fill={isActive ? '#2962FF' : '#787B86'} opacity="0.6" />
                    </svg>
                  </div>
                )}
              </button>
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute left-[50px] top-1/2 -translate-y-1/2 z-[100] px-2 py-1.5 bg-[#363A45] text-[#D1D4DC] text-[11px] rounded shadow-xl whitespace-nowrap pointer-events-none border border-[#4A4E59]">
                  {tool.label}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-[#363A45]" />
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default DrawingTools;
