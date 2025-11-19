import React, { useEffect, useRef, useState } from 'react';
import { FlowchartData, FlowchartNode, NodeShape } from '../types';

interface DiagramCanvasProps {
  data: FlowchartData | null;
  onNodeUpdate?: (nodeId: string, newLabel: string) => void;
}

// Inline colors for export safety
const COLORS = {
  slate900: '#0f172a',
  slate700: '#334155',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate200: '#e2e8f0',
  white: '#ffffff',
  indigo500: '#6366f1',
  indigo50: '#eef2ff',
  amber500: '#f59e0b',
  amber50: '#fffbeb',
  emerald500: '#10b981',
  emerald50: '#ecfdf5',
  purple500: '#a855f7',
  purple50: '#faf5ff',
};

const DiagramCanvas: React.FC<DiagramCanvasProps> = ({ data, onNodeUpdate }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  const [lastTouch, setLastTouch] = useState<{x: number, y: number} | null>(null);
  const [initialPinchDist, setInitialPinchDist] = useState<number | null>(null);
  const [initialZoom, setInitialZoom] = useState<number>(1);

  // Editing State
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Auto-fit when data changes
  useEffect(() => {
    if (data && data.nodes.length > 0) {
       const xs = data.nodes.map(n => n.x || 0);
       const ys = data.nodes.map(n => n.y || 0);
       const minX = Math.min(...xs);
       const maxX = Math.max(...xs);
       const minY = Math.min(...ys);
       const maxY = Math.max(...ys);
       
       const width = maxX - minX + 300;
       const height = maxY - minY + 300;
       
       const container = document.getElementById('canvas-container');
       if (container) {
         const scaleX = container.clientWidth / width;
         const scaleY = container.clientHeight / height;
         const newZoom = Math.min(scaleX, scaleY, 1.2) * 0.9; // slightly tighter fit
         
         setZoom(newZoom);
         setPan({x: 50, y: 50}); // Reset pan to top-left with padding
       }
    }
  }, [data]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't drag if clicking on an input
    if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Handlers
  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // Don't drag if touching an input
    if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;

    if (e.touches.length === 1) {
      // Single touch - Pan
      setLastTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
      // Double touch - Pinch Zoom
      const dist = getDistance(e.touches[0], e.touches[1]);
      setInitialPinchDist(dist);
      setInitialZoom(zoom);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Don't drag if touching an input
    if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;

    e.preventDefault(); // Prevent scrolling the page while interacting with canvas
    
    if (e.touches.length === 1 && lastTouch) {
      // Pan
      const dx = e.touches[0].clientX - lastTouch.x;
      const dy = e.touches[0].clientY - lastTouch.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      setLastTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2 && initialPinchDist) {
      // Pinch Zoom
      const dist = getDistance(e.touches[0], e.touches[1]);
      const scale = dist / initialPinchDist;
      setZoom(Math.max(0.1, Math.min(3, initialZoom * scale)));
    }
  };

  const handleTouchEnd = () => {
    setLastTouch(null);
    setInitialPinchDist(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomFactor = 0.1;
    const delta = e.deltaY > 0 ? -zoomFactor : zoomFactor;
    setZoom(z => Math.max(0.1, Math.min(3, z + delta)));
  };

  // Editing Handlers
  const handleNodeDoubleClick = (e: React.MouseEvent, node: FlowchartNode) => {
    e.stopPropagation();
    setEditingNodeId(node.id);
    setEditValue(node.label);
  };

  const handleInputBlur = () => {
    if (editingNodeId && onNodeUpdate) {
      onNodeUpdate(editingNodeId, editValue);
    }
    setEditingNodeId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInputBlur();
    }
  };

  if (!data || data.nodes.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 border-l border-slate-200">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
        <p className="text-lg font-medium">Flowchart Area</p>
        <p className="text-sm">Enter a prompt to generate</p>
      </div>
    );
  }

  // SVG Text Wrapping Helper
  const wrapText = (text: string, maxCharsPerLine: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      if (currentLine.length + 1 + words[i].length <= maxCharsPerLine) {
        currentLine += ' ' + words[i];
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  const renderShape = (node: FlowchartNode) => {
    const w = 180; 
    const h = 90;
    const cx = node.x || 0;
    const cy = node.y || 0;
    const isEditing = editingNodeId === node.id;

    // Wrap text logic
    const maxChars = 22; 
    const lines = wrapText(node.label, maxChars);
    const lineHeight = 14;
    const startY = cy - ((lines.length - 1) * lineHeight) / 2;

    let shapeJsx;
    let fill = COLORS.white;
    let stroke = COLORS.indigo500;

    switch (node.shape) {
      case NodeShape.DIAMOND:
        fill = COLORS.amber50;
        stroke = COLORS.amber500;
        // Diamond shape
        shapeJsx = (
          <polygon 
            points={`${cx},${cy - h/2 - 5} ${cx + w/2 + 5},${cy} ${cx},${cy + h/2 + 5} ${cx - w/2 - 5},${cy}`} 
            fill={fill} stroke={stroke} strokeWidth="2"
          />
        );
        break;
      case NodeShape.PILL:
        fill = COLORS.emerald50;
        stroke = COLORS.emerald500;
        // Pill shape (rounded rect with high radius)
        shapeJsx = (
          <rect 
            x={cx - w/2} y={cy - h/2} width={w} height={h} rx={h/2} 
            fill={fill} stroke={stroke} strokeWidth="2"
          />
        );
        break;
      case NodeShape.PARALLELOGRAM:
        fill = COLORS.purple50;
        stroke = COLORS.purple500;
        // Parallelogram
        shapeJsx = (
          <polygon 
            points={`${cx - w/2 + 15},${cy - h/2} ${cx + w/2},${cy - h/2} ${cx + w/2 - 15},${cy + h/2} ${cx - w/2},${cy + h/2}`} 
            fill={fill} stroke={stroke} strokeWidth="2"
          />
        );
        break;
      default: // RECTANGLE
        shapeJsx = (
          <rect 
            x={cx - w/2} y={cy - h/2} width={w} height={h} rx={6} 
            fill={fill} stroke={stroke} strokeWidth="2"
          />
        );
    }

    return (
      <g 
        key={node.id} 
        onDoubleClick={(e) => handleNodeDoubleClick(e, node)}
        className="cursor-pointer hover:opacity-90 transition-opacity"
      >
        {shapeJsx}
        
        {isEditing ? (
          <foreignObject x={cx - w/2 + 10} y={cy - h/2 + 10} width={w - 20} height={h - 20}>
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              enterKeyHint="done"
              className="w-full h-full bg-transparent text-center text-xs font-medium text-slate-800 resize-none outline-none border-none overflow-hidden"
              style={{ fontFamily: 'sans-serif' }}
            />
          </foreignObject>
        ) : (
          <text 
            x={cx} 
            y={startY} 
            textAnchor="middle" 
            dominantBaseline="middle"
            fill={COLORS.slate700}
            fontSize="12"
            fontFamily="sans-serif" 
            fontWeight="500"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {lines.map((line, i) => (
              <tspan key={i} x={cx} dy={i === 0 ? 3 : lineHeight}>
                {line}
              </tspan>
            ))}
          </text>
        )}
      </g>
    );
  };

  const defs = (
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill={COLORS.slate400} />
      </marker>
    </defs>
  );

  return (
    <div className="w-full h-full bg-slate-50 overflow-hidden relative" id="canvas-container">
       {/* Zoom Controls */}
       <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur p-1.5 rounded-lg shadow-sm border border-slate-200 text-xs text-slate-500 flex gap-2">
          <button onClick={() => setZoom(z => z + 0.1)} className="hover:bg-slate-100 w-6 h-6 rounded flex items-center justify-center font-bold">+</button>
          <span className="flex items-center px-1">{(zoom * 100).toFixed(0)}%</span>
          <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="hover:bg-slate-100 w-6 h-6 rounded flex items-center justify-center font-bold">-</button>
          <div className="w-px bg-slate-200 mx-1"></div>
          <button onClick={() => {setZoom(0.8); setPan({x:50, y:50})}} className="hover:bg-slate-100 px-2 rounded">Fit</button>
       </div>

      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none block"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        style={{ backgroundColor: '#f8fafc' }} // Inline style for background check
      >
        {/* Big white background rect ensures exported PNG is not transparent/black */}
        <rect x="-50000" y="-50000" width="100000" height="100000" fill="#f8fafc" />
        
        {defs}
        
        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
          {/* Edges */}
          {data.edges.map((edge, i) => {
            const src = data.nodes.find(n => n.id === edge.source);
            const trg = data.nodes.find(n => n.id === edge.target);
            if (!src || !trg) return null;
            
            const sx = src.x || 0;
            const sy = src.y || 0;
            const tx = trg.x || 0;
            const ty = trg.y || 0;

            // Simple routing logic
            let x1 = sx, y1 = sy, x2 = tx, y2 = ty;
            let isVertical = false;

            if (Math.abs(tx - sx) < 20) {
               // Vertical
               isVertical = true;
               if (ty > sy) { y1 += 45; y2 -= 45; } // Down
               else { y1 -= 45; y2 += 45; } // Up
            } else {
               // Horizontal
               if (tx > sx) { x1 += 90; x2 -= 90; } // Right
               else { x1 -= 90; x2 += 90; } // Left
            }

            // Orthogonal Path Calculation
            let d = '';
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            if (isVertical) {
                // Vertical start: Go Y first, then X, then Y
                d = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
            } else {
                // Horizontal start: Go X first, then Y, then X
                d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
            }

            // Label position (approximate middle of the path)
            const labelX = isVertical ? (x1 + x2) / 2 : midX;
            const labelY = isVertical ? midY : (y1 + y2) / 2;

            return (
              <g key={i}>
                <path 
                  d={d}
                  fill="none"
                  stroke={COLORS.slate400}
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                {edge.label && (
                   <rect 
                     x={labelX - 20} y={labelY - 10} width={40} height={20} rx={4} 
                     fill={COLORS.white} stroke={COLORS.slate200} strokeWidth="1"
                   />
                )}
                {edge.label && (
                  <text 
                    x={labelX} y={labelY + 4} 
                    textAnchor="middle" 
                    fill={COLORS.slate500}
                    fontSize="10"
                    fontFamily="sans-serif"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {data.nodes.map(renderShape)}
        </g>
      </svg>
    </div>
  );
};

export default DiagramCanvas;