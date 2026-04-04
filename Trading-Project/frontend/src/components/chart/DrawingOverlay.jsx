import React, { useRef, useEffect, useCallback, useState } from 'react';

const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const FIB_COLORS = ['#787B86', '#F44336', '#FF9800', '#4CAF50', '#2196F3', '#9C27B0', '#787B86'];

const DrawingOverlay = ({ chartRef, activeTool, drawings, setDrawings, drawingsVisible, drawingsLocked }) => {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentPoint, setCurrentPoint] = useState(null);
  const [brushPoints, setBrushPoints] = useState([]);
  const [textInput, setTextInput] = useState(null);
  const [textValue, setTextValue] = useState('');

  // Convert pixel coords to chart logical coords (price/time)
  const pixelToLogical = useCallback((x, y) => {
    const chart = chartRef.current?.getChart();
    const series = chartRef.current?.getSeries();
    if (!chart || !series) return null;
    try {
      const time = chart.timeScale().coordinateToTime(x);
      const price = series.coordinateToPrice(y);
      if (time == null || price == null) return null;
      return { time, price };
    } catch { return null; }
  }, [chartRef]);

  // Convert chart logical coords to pixel coords
  const logicalToPixel = useCallback((time, price) => {
    const chart = chartRef.current?.getChart();
    const series = chartRef.current?.getSeries();
    if (!chart || !series) return null;
    try {
      const x = chart.timeScale().timeToCoordinate(time);
      const y = series.priceToCoordinate(price);
      if (x == null || y == null) return null;
      return { x, y };
    } catch { return null; }
  }, [chartRef]);

  // Resize canvas to match container
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = chartRef.current?.getContainer();
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
  }, [chartRef]);

  // Master render function
  const renderDrawings = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);

    if (!drawingsVisible) return;

    // Render completed drawings
    drawings.forEach((d) => {
      switch (d.type) {
        case 'trendline': renderTrendLine(ctx, d, w); break;
        case 'horizontal': renderHorizontalLine(ctx, d, w); break;
        case 'ray': renderRay(ctx, d, w); break;
        case 'rectangle': renderRectangle(ctx, d); break;
        case 'fibonacci': renderFibonacci(ctx, d, w); break;
        case 'brush': renderBrush(ctx, d); break;
        case 'text': renderText(ctx, d); break;
        case 'measure': renderMeasure(ctx, d); break;
        case 'arrow': renderArrow(ctx, d); break;
        case 'circle': renderCircle(ctx, d); break;
        case 'triangle-shape': renderTriangleShape(ctx, d); break;
        case 'channel': renderChannel(ctx, d, w); break;
        default: break;
      }
    });

    // Render in-progress drawing
    if (isDrawing && startPoint && currentPoint) {
      const sp = logicalToPixel(startPoint.time, startPoint.price);
      const cp = logicalToPixel(currentPoint.time, currentPoint.price);
      if (sp && cp) {
        ctx.save();
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = '#2962FF';
        ctx.lineWidth = 1.5;

        switch (activeTool) {
          case 'trendline':
            ctx.beginPath(); ctx.moveTo(sp.x, sp.y); ctx.lineTo(cp.x, cp.y); ctx.stroke();
            drawHandle(ctx, sp.x, sp.y); drawHandle(ctx, cp.x, cp.y);
            break;
          case 'horizontal':
            ctx.beginPath(); ctx.moveTo(0, cp.y); ctx.lineTo(w, cp.y); ctx.stroke();
            drawPriceLabel(ctx, w, cp.y, currentPoint.price);
            break;
          case 'ray':
            const dx = cp.x - sp.x; const dy = cp.y - sp.y;
            const ext = Math.max(w, h) * 3;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            ctx.beginPath(); ctx.moveTo(sp.x, sp.y);
            ctx.lineTo(sp.x + (dx / len) * ext, sp.y + (dy / len) * ext); ctx.stroke();
            drawHandle(ctx, sp.x, sp.y);
            break;
          case 'rectangle':
            ctx.fillStyle = 'rgba(41,98,255,0.1)';
            ctx.fillRect(sp.x, sp.y, cp.x - sp.x, cp.y - sp.y);
            ctx.strokeRect(sp.x, sp.y, cp.x - sp.x, cp.y - sp.y);
            break;
          case 'fibonacci':
            renderFibPreview(ctx, sp, cp, w);
            break;
          case 'measure':
            renderMeasurePreview(ctx, sp, cp, startPoint, currentPoint);
            break;
          case 'arrow':
            drawArrowLine(ctx, sp.x, sp.y, cp.x, cp.y, '#2962FF');
            break;
          case 'circle':
            const radius = Math.sqrt((cp.x - sp.x) ** 2 + (cp.y - sp.y) ** 2);
            ctx.beginPath(); ctx.arc(sp.x, sp.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(41,98,255,0.08)'; ctx.fill(); ctx.stroke();
            break;
          case 'triangle':
            const mx = (sp.x + cp.x) / 2;
            ctx.beginPath(); ctx.moveTo(mx, sp.y); ctx.lineTo(sp.x, cp.y); ctx.lineTo(cp.x, cp.y);
            ctx.closePath(); ctx.fillStyle = 'rgba(41,98,255,0.08)'; ctx.fill(); ctx.stroke();
            break;
          case 'channel':
            ctx.beginPath(); ctx.moveTo(sp.x, sp.y); ctx.lineTo(cp.x, cp.y); ctx.stroke();
            const offset = 40;
            ctx.beginPath(); ctx.moveTo(sp.x, sp.y - offset); ctx.lineTo(cp.x, cp.y - offset); ctx.stroke();
            ctx.fillStyle = 'rgba(41,98,255,0.05)';
            ctx.beginPath(); ctx.moveTo(sp.x, sp.y); ctx.lineTo(cp.x, cp.y);
            ctx.lineTo(cp.x, cp.y - offset); ctx.lineTo(sp.x, sp.y - offset); ctx.closePath(); ctx.fill();
            break;
          default: break;
        }
        ctx.restore();
      }
    }

    // Render brush in progress
    if (isDrawing && activeTool === 'brush' && brushPoints.length > 1) {
      ctx.save();
      ctx.strokeStyle = '#2962FF';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i < brushPoints.length; i++) {
        const p = logicalToPixel(brushPoints[i].time, brushPoints[i].price);
        if (!p) continue;
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }, [drawings, isDrawing, startPoint, currentPoint, activeTool, brushPoints, drawingsVisible, logicalToPixel]);

  // Helper: draw handle dot
  function drawHandle(ctx, x, y) {
    ctx.save();
    ctx.setLineDash([]);
    ctx.fillStyle = '#2962FF';
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  // Helper: draw price label
  function drawPriceLabel(ctx, xPos, y, price) {
    ctx.save();
    ctx.setLineDash([]);
    const text = price.toFixed(2);
    ctx.font = '10px Inter, sans-serif';
    const tw = ctx.measureText(text).width + 8;
    ctx.fillStyle = '#2962FF';
    ctx.fillRect(xPos - tw - 5, y - 9, tw, 18);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, xPos - 9, y);
    ctx.restore();
  }

  // Render completed trendline
  function renderTrendLine(ctx, d, w) {
    const p1 = logicalToPixel(d.p1.time, d.p1.price);
    const p2 = logicalToPixel(d.p2.time, d.p2.price);
    if (!p1 || !p2) return;
    ctx.save();
    ctx.strokeStyle = d.color || '#2962FF';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    drawHandle(ctx, p1.x, p1.y); drawHandle(ctx, p2.x, p2.y);
    ctx.restore();
  }

  // Render horizontal line
  function renderHorizontalLine(ctx, d, w) {
    const p = logicalToPixel(d.p1.time, d.p1.price);
    if (!p) return;
    ctx.save();
    ctx.strokeStyle = d.color || '#FF9800';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 3]);
    ctx.beginPath(); ctx.moveTo(0, p.y); ctx.lineTo(w, p.y); ctx.stroke();
    drawPriceLabel(ctx, w, p.y, d.p1.price);
    ctx.restore();
  }

  // Render ray
  function renderRay(ctx, d, w) {
    const p1 = logicalToPixel(d.p1.time, d.p1.price);
    const p2 = logicalToPixel(d.p2.time, d.p2.price);
    if (!p1 || !p2) return;
    ctx.save();
    ctx.strokeStyle = d.color || '#26A69A';
    ctx.lineWidth = 1.5;
    const dx = p2.x - p1.x; const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ext = Math.max(w, 2000) * 3;
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p1.x + (dx / len) * ext, p1.y + (dy / len) * ext); ctx.stroke();
    drawHandle(ctx, p1.x, p1.y);
    ctx.restore();
  }

  // Render rectangle
  function renderRectangle(ctx, d) {
    const p1 = logicalToPixel(d.p1.time, d.p1.price);
    const p2 = logicalToPixel(d.p2.time, d.p2.price);
    if (!p1 || !p2) return;
    ctx.save();
    ctx.fillStyle = d.fill || 'rgba(41,98,255,0.08)';
    ctx.strokeStyle = d.color || '#2962FF';
    ctx.lineWidth = 1;
    ctx.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    ctx.restore();
  }

  // Render fibonacci
  function renderFibonacci(ctx, d, w) {
    const p1 = logicalToPixel(d.p1.time, d.p1.price);
    const p2 = logicalToPixel(d.p2.time, d.p2.price);
    if (!p1 || !p2) return;
    const priceRange = d.p1.price - d.p2.price;
    ctx.save();
    FIB_LEVELS.forEach((level, i) => {
      const price = d.p2.price + priceRange * level;
      const pp = logicalToPixel(d.p1.time, price);
      if (!pp) return;
      ctx.strokeStyle = FIB_COLORS[i];
      ctx.lineWidth = 1;
      ctx.setLineDash(level === 0 || level === 1 ? [] : [4, 3]);
      ctx.beginPath(); ctx.moveTo(0, pp.y); ctx.lineTo(w, pp.y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = FIB_COLORS[i];
      ctx.textAlign = 'left';
      ctx.fillText(`${(level * 100).toFixed(1)}%  ${price.toFixed(2)}`, 8, pp.y - 4);
    });
    // Fill between 0.382 and 0.618
    const p382 = logicalToPixel(d.p1.time, d.p2.price + priceRange * 0.382);
    const p618 = logicalToPixel(d.p1.time, d.p2.price + priceRange * 0.618);
    if (p382 && p618) {
      ctx.fillStyle = 'rgba(33,150,243,0.05)';
      ctx.fillRect(0, Math.min(p382.y, p618.y), w, Math.abs(p618.y - p382.y));
    }
    ctx.restore();
  }

  function renderFibPreview(ctx, sp, cp, w) {
    const priceRange = sp.y - cp.y;
    ctx.save();
    FIB_LEVELS.forEach((level, i) => {
      const y = cp.y + priceRange * (1 - level);
      ctx.strokeStyle = FIB_COLORS[i];
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = FIB_COLORS[i];
      ctx.fillText(`${(level * 100).toFixed(1)}%`, 8, y - 4);
    });
    ctx.restore();
  }

  // Render brush
  function renderBrush(ctx, d) {
    if (!d.points || d.points.length < 2) return;
    ctx.save();
    ctx.strokeStyle = d.color || '#2962FF';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < d.points.length; i++) {
      const p = logicalToPixel(d.points[i].time, d.points[i].price);
      if (!p) continue;
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Render text
  function renderText(ctx, d) {
    const p = logicalToPixel(d.p1.time, d.p1.price);
    if (!p) return;
    ctx.save();
    ctx.font = '13px Inter, sans-serif';
    ctx.fillStyle = d.color || '#D1D4DC';
    ctx.textBaseline = 'top';
    ctx.fillText(d.text || '', p.x, p.y);
    ctx.restore();
  }

  // Render measure
  function renderMeasure(ctx, d) {
    const p1 = logicalToPixel(d.p1.time, d.p1.price);
    const p2 = logicalToPixel(d.p2.time, d.p2.price);
    if (!p1 || !p2) return;
    renderMeasurePreview(ctx, p1, p2, d.p1, d.p2);
  }

  function renderMeasurePreview(ctx, sp, cp, lp1, lp2) {
    ctx.save();
    ctx.setLineDash([3, 2]);
    ctx.strokeStyle = '#787B86';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sp.x, sp.y); ctx.lineTo(cp.x, sp.y); ctx.lineTo(cp.x, cp.y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#2962FF';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(sp.x, sp.y); ctx.lineTo(cp.x, cp.y); ctx.stroke();
    drawHandle(ctx, sp.x, sp.y); drawHandle(ctx, cp.x, cp.y);
    // Info box
    const priceDiff = lp2.price - lp1.price;
    const pctDiff = lp1.price ? ((priceDiff / lp1.price) * 100) : 0;
    const mx = (sp.x + cp.x) / 2;
    const my = (sp.y + cp.y) / 2;
    const label = `${priceDiff >= 0 ? '+' : ''}${priceDiff.toFixed(2)} (${pctDiff >= 0 ? '+' : ''}${pctDiff.toFixed(2)}%)`;
    ctx.font = '11px Inter, sans-serif';
    const tw = ctx.measureText(label).width + 12;
    ctx.fillStyle = '#1E222D';
    ctx.strokeStyle = '#2A2E39';
    ctx.lineWidth = 1;
    const bx = mx - tw / 2; const by = my - 12;
    ctx.beginPath();
    ctx.roundRect(bx, by, tw, 22, 4);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = priceDiff >= 0 ? '#26A69A' : '#EF5350';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, mx, my);
    ctx.restore();
  }

  // Render arrow
  function renderArrow(ctx, d) {
    const p1 = logicalToPixel(d.p1.time, d.p1.price);
    const p2 = logicalToPixel(d.p2.time, d.p2.price);
    if (!p1 || !p2) return;
    drawArrowLine(ctx, p1.x, p1.y, p2.x, p2.y, d.color || '#2962FF');
  }

  function drawArrowLine(ctx, x1, y1, x2, y2, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 10;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath(); ctx.fill();
    drawHandle(ctx, x1, y1);
    ctx.restore();
  }

  // Render circle
  function renderCircle(ctx, d) {
    const p1 = logicalToPixel(d.p1.time, d.p1.price);
    const p2 = logicalToPixel(d.p2.time, d.p2.price);
    if (!p1 || !p2) return;
    const radius = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    ctx.save();
    ctx.strokeStyle = d.color || '#2962FF';
    ctx.fillStyle = 'rgba(41,98,255,0.06)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(p1.x, p1.y, radius, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // Render triangle shape
  function renderTriangleShape(ctx, d) {
    const p1 = logicalToPixel(d.p1.time, d.p1.price);
    const p2 = logicalToPixel(d.p2.time, d.p2.price);
    if (!p1 || !p2) return;
    const mx = (p1.x + p2.x) / 2;
    ctx.save();
    ctx.strokeStyle = d.color || '#2962FF';
    ctx.fillStyle = 'rgba(41,98,255,0.06)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(mx, p1.y); ctx.lineTo(p1.x, p2.y); ctx.lineTo(p2.x, p2.y);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // Render channel
  function renderChannel(ctx, d, w) {
    const p1 = logicalToPixel(d.p1.time, d.p1.price);
    const p2 = logicalToPixel(d.p2.time, d.p2.price);
    if (!p1 || !p2) return;
    const offset = d.offset || 40;
    ctx.save();
    ctx.strokeStyle = d.color || '#2962FF';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y - offset); ctx.lineTo(p2.x, p2.y - offset); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(41,98,255,0.04)';
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p2.x, p2.y - offset); ctx.lineTo(p1.x, p1.y - offset);
    ctx.closePath(); ctx.fill();
    drawHandle(ctx, p1.x, p1.y); drawHandle(ctx, p2.x, p2.y);
    ctx.restore();
  }

  // Map tool name to drawing type
  const toolToType = {
    trendline: 'trendline', horizontal: 'horizontal', ray: 'ray',
    rectangle: 'rectangle', fibonacci: 'fibonacci', brush: 'brush',
    text: 'text', measure: 'measure', arrow: 'arrow',
    circle: 'circle', triangle: 'triangle-shape', channel: 'channel',
  };

  // Should we intercept mouse events?
  const isDrawingTool = activeTool in toolToType;

  // Mouse handlers
  const handleMouseDown = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isDrawingTool || drawingsLocked) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const logical = pixelToLogical(x, y);
    if (!logical) return;

    if (activeTool === 'text') {
      setTextInput({ x: e.clientX, y: e.clientY, logical });
      setTextValue('');
      return;
    }

    if (activeTool === 'horizontal') {
      setDrawings(prev => [...prev, { type: 'horizontal', p1: logical, color: '#FF9800', id: Date.now() }]);
      return;
    }

    if (activeTool === 'brush') {
      setIsDrawing(true);
      setBrushPoints([logical]);
      return;
    }

    setIsDrawing(true);
    setStartPoint(logical);
    setCurrentPoint(logical);
  }, [isDrawingTool, activeTool, pixelToLogical, drawingsLocked, setDrawings]);

  const handleMouseMove = useCallback((e) => {
    if (!isDrawing) return;
    e.stopPropagation();
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const logical = pixelToLogical(x, y);
    if (!logical) return;

    if (activeTool === 'brush') {
      setBrushPoints(prev => [...prev, logical]);
    } else {
      setCurrentPoint(logical);
    }
  }, [isDrawing, activeTool, pixelToLogical]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;

    if (activeTool === 'brush' && brushPoints.length > 1) {
      setDrawings(prev => [...prev, { type: 'brush', points: [...brushPoints], color: '#2962FF', id: Date.now() }]);
      setBrushPoints([]);
    } else if (startPoint && currentPoint && activeTool !== 'brush') {
      const type = toolToType[activeTool];
      if (type) {
        const newDrawing = { type, p1: startPoint, p2: currentPoint, color: '#2962FF', id: Date.now() };
        if (type === 'channel') newDrawing.offset = 40;
        setDrawings(prev => [...prev, newDrawing]);
      }
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  }, [isDrawing, startPoint, currentPoint, activeTool, brushPoints, setDrawings]);

  // Text input submit
  const handleTextSubmit = useCallback(() => {
    if (textInput && textValue.trim()) {
      setDrawings(prev => [...prev, { type: 'text', p1: textInput.logical, text: textValue.trim(), color: '#D1D4DC', id: Date.now() }]);
    }
    setTextInput(null);
    setTextValue('');
  }, [textInput, textValue, setDrawings]);

  // Setup canvas and animation loop
  useEffect(() => {
    resizeCanvas();
    const loop = () => {
      renderDrawings();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => resizeCanvas());
    const container = chartRef.current?.getContainer();
    if (container) ro.observe(container);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      ro.disconnect();
    };
  }, [resizeCanvas, renderDrawings, chartRef]);

  // Determine pointer-events
  const pointerEvents = isDrawingTool && !drawingsLocked ? 'all' : 'none';

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10"
        style={{ pointerEvents, cursor: isDrawingTool ? 'crosshair' : 'default' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {/* Floating text input */}
      {textInput && (
        <div
          className="fixed z-50 bg-[#1E222D] border border-[#2A2E39] rounded-md p-1 shadow-xl"
          style={{ left: textInput.x, top: textInput.y }}
        >
          <input
            type="text"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleTextSubmit(); if (e.key === 'Escape') setTextInput(null); }}
            placeholder="Type text..."
            className="bg-[#131722] text-white text-[13px] px-2 py-1 rounded outline-none border border-[#2A2E39] focus:border-[#2962FF] w-[180px]"
            autoFocus
          />
        </div>
      )}
    </>
  );
};

export default DrawingOverlay;
