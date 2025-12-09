import React from 'react';
import { PaletteColor } from '../types';
import { Check } from 'lucide-react';

interface Props {
  palette: PaletteColor[];
  activeColorId: number | null;
  onColorSelect: (id: number) => void;
  completedColors: number[];
}

const ColorPalette: React.FC<Props> = ({ palette, activeColorId, onColorSelect, completedColors }) => {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 h-full flex flex-col">
      <h3 className="text-white font-semibold mb-4 flex items-center justify-between">
        <span>Palette</span>
        <span className="text-xs font-normal text-slate-400">{palette.length} colors</span>
      </h3>
      
      <div className="overflow-y-auto flex-1 pr-2 space-y-2">
        {palette.map((color) => {
          const isCompleted = completedColors.includes(color.id);
          const isActive = activeColorId === color.id;
          
          return (
            <button
              key={color.id}
              onClick={() => onColorSelect(color.id)}
              className={`w-full flex items-center p-2 rounded-lg transition-all duration-200 
                ${isActive 
                  ? 'bg-indigo-600/20 border-indigo-500/50 border' 
                  : 'hover:bg-slate-700/50 border border-transparent'
                }
                ${isCompleted ? 'opacity-50' : 'opacity-100'}
              `}
            >
              <div 
                className="w-8 h-8 rounded-full shadow-sm border border-slate-600 flex items-center justify-center shrink-0"
                style={{ backgroundColor: color.hex }}
              >
                 {isCompleted && <Check className="w-4 h-4 text-white drop-shadow-md" />}
              </div>
              
              <div className="ml-3 flex-1 text-left">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${isActive ? 'text-indigo-300' : 'text-slate-300'}`}>
                    Color {color.id}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {color.hex.toUpperCase()}
                  </span>
                </div>
                {isActive && (
                    <div className="text-[10px] text-indigo-400 mt-0.5">Selected</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ColorPalette;
