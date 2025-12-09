import React, { useRef, useEffect, useState } from 'react';
import { ProcessedArt, Region } from '../types';
import { ZoomIn, ZoomOut, Download, Maximize } from 'lucide-react';

interface Props {
  art: ProcessedArt;
  activeColorId: number | null;
  filledRegions: { [key: number]: boolean }; // Index by region index in art.regions array
  onRegionClick: (index: number) => void;
}

const DrawingCanvas: React.FC<Props> = ({ art, activeColorId, filledRegions, onRegionClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Reset zoom on new art
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [art]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSensitivity = 0.001;
    const newScale = Math.min(Math.max(0.5, scale - e.deltaY * zoomSensitivity), 5);
    setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag if middle mouse or space held (optional, here we just drag bg)
    if(e.button === 0) { // Left click
        // if target is svg background, dragging is fine.
        // if target is a path, we might want to fill it. 
        // We handle path click separately. But we need to distinguish pan vs click.
    }
    setIsDragging(true);
    setStartPan({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleRegionClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation(); // Prevent drag start
    if (!isDragging) {
        onRegionClick(index);
    }
  };

  const downloadSVG = () => {
    const svgContent = document.getElementById('paint-by-number-svg')?.outerHTML;
    if (svgContent) {
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'paint-by-numbers.svg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700 flex flex-col">
       {/* Toolbar */}
       <div className="absolute top-4 right-4 z-10 flex space-x-2 bg-slate-800/80 backdrop-blur p-2 rounded-lg border border-slate-700 shadow-lg">
          <button onClick={() => setScale(s => Math.min(s + 0.2, 5))} className="p-2 hover:bg-slate-700 rounded text-white">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button onClick={() => setScale(s => Math.max(s - 0.2, 0.5))} className="p-2 hover:bg-slate-700 rounded text-white">
            <ZoomOut className="w-5 h-5" />
          </button>
          <button onClick={() => { setScale(1); setPosition({x:0, y:0}); }} className="p-2 hover:bg-slate-700 rounded text-white">
            <Maximize className="w-5 h-5" />
          </button>
          <div className="w-px bg-slate-600 mx-2"></div>
          <button onClick={downloadSVG} className="p-2 hover:bg-indigo-600 bg-indigo-500 rounded text-white">
            <Download className="w-5 h-5" />
          </button>
       </div>

      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden cursor-move relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div 
            style={{ 
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: '0 0',
                width: art.width,
                height: art.height,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
            className="absolute top-10 left-10 shadow-2xl origin-top-left"
        >
            <svg 
                id="paint-by-number-svg"
                viewBox={`0 0 ${art.width} ${art.height}`} 
                width={art.width} 
                height={art.height}
                className="bg-white"
            >
                <defs>
                   <style>{`
                     .region { stroke: #ddd; stroke-width: 0.5; fill: #fff; transition: fill 0.2s; cursor: pointer; }
                     .region:hover { fill: #f0f0f0; stroke: #999; }
                     .region.filled { stroke: none; }
                     .label { font-family: sans-serif; font-size: 8px; fill: #999; pointer-events: none; user-select: none; }
                     .highlight { fill: #e0e7ff !important; stroke: #6366f1 !important; stroke-width: 1; }
                   `}</style>
                </defs>
                
                {/* 1. Draw Regions */}
                {art.regions.map((region, idx) => {
                    const isFilled = filledRegions[idx];
                    const color = art.palette.find(p => p.id === region.colorId);
                    const isActive = activeColorId === region.colorId;
                    
                    return (
                        <path
                            key={`path-${idx}`}
                            d={region.path}
                            className={`region ${isActive && !isFilled ? 'highlight' : ''} ${isFilled ? 'filled' : ''}`}
                            fill={isFilled ? color?.hex : 'white'}
                            onClick={(e) => handleRegionClick(e, idx)}
                            // Improve crispness
                            shapeRendering="crispEdges"
                        />
                    );
                })}

                {/* 2. Draw Labels (On top) - Only if not filled and region is large enough */}
                {art.regions.map((region, idx) => {
                    if (filledRegions[idx] || region.area < 20) return null; // Skip small or filled
                    return (
                        <text
                            key={`txt-${idx}`}
                            x={region.labelPoint.x}
                            y={region.labelPoint.y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="label"
                            fontSize={Math.max(6, Math.min(12, Math.sqrt(region.area) / 2))}
                        >
                            {region.colorId}
                        </text>
                    );
                })}
            </svg>
        </div>
      </div>
    </div>
  );
};

export default DrawingCanvas;
