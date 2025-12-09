import React, { useState, useEffect } from 'react';
import { AppState, ProcessedArt, AIAnalysis } from './types';
import { processImage } from './services/processor';
import { analyzeImageWithGemini } from './services/gemini';
import ImageUploader from './components/ImageUploader';
import ColorPalette from './components/ColorPalette';
import DrawingCanvas from './components/DrawingCanvas';
import { Brush, Palette, Sparkles, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.UPLOAD);
  const [art, setArt] = useState<ProcessedArt | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Complexity Settings
  const [colorCount, setColorCount] = useState(16);

  // Editor State
  const [activeColorId, setActiveColorId] = useState<number | null>(null);
  const [filledRegions, setFilledRegions] = useState<{ [key: number]: boolean }>({});
  const [completedColors, setCompletedColors] = useState<number[]>([]);

  // Check for completed colors whenever a region is filled
  useEffect(() => {
    if (!art) return;
    
    const newCompletedColors: number[] = [];
    art.palette.forEach(color => {
      // Find all regions for this color
      const colorRegionsIndices = art.regions
        .map((r, idx) => r.colorId === color.id ? idx : -1)
        .filter(idx => idx !== -1);
      
      const allFilled = colorRegionsIndices.every(idx => filledRegions[idx]);
      if (allFilled && colorRegionsIndices.length > 0) {
        newCompletedColors.push(color.id);
      }
    });
    setCompletedColors(newCompletedColors);
  }, [filledRegions, art]);

  const handleImageSelected = async (file: File) => {
    setIsProcessing(true);
    setState(AppState.PROCESSING);
    setFilledRegions({});
    setActiveColorId(null);
    setAnalysis(null);

    try {
      // 1. Convert File to Base64 for Gemini
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
      });

      const [base64, processedData] = await Promise.all([
        base64Promise,
        processImage(URL.createObjectURL(file), colorCount)
      ]);

      setArt(processedData);

      // 2. Start AI Analysis in background
      analyzeImageWithGemini(base64)
        .then(setAnalysis)
        .catch(console.error);

      setState(AppState.EDITOR);
    } catch (error) {
      console.error(error);
      alert('Failed to process image. Please try a simpler image.');
      setState(AppState.UPLOAD);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegionClick = (regionIndex: number) => {
    if (!art || !activeColorId) return;
    const region = art.regions[regionIndex];
    
    // Logic: Can only paint if correct color is selected? 
    // Or auto-select color? Let's do: Must select correct color to fill, game-style.
    if (region.colorId === activeColorId) {
       setFilledRegions(prev => ({ ...prev, [regionIndex]: true }));
    } else {
       // Optional: Shake effect or feedback for wrong color
       // For now, just auto-switch to help user (easier UX)
       setActiveColorId(region.colorId);
    }
  };

  const reset = () => {
    setState(AppState.UPLOAD);
    setArt(null);
    setAnalysis(null);
    setFilledRegions({});
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Brush className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Gemini <span className="text-indigo-400">Paint</span>
            </h1>
          </div>
          
          {state === AppState.EDITOR && (
             <button 
               onClick={reset}
               className="flex items-center space-x-2 text-sm text-slate-400 hover:text-white transition-colors"
             >
               <ArrowLeft className="w-4 h-4" />
               <span>Start Over</span>
             </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        
        {state === AppState.UPLOAD && (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="mb-8 text-center space-y-2">
              <h2 className="text-4xl font-bold text-white">Create Your Masterpiece</h2>
              <p className="text-slate-400">Turn any memory into a paint-by-numbers canvas in seconds.</p>
            </div>
            
            <ImageUploader onImageSelected={handleImageSelected} isProcessing={isProcessing} />

            <div className="mt-12 flex items-center space-x-4">
              <label className="text-slate-400 text-sm">Palette Complexity:</label>
              <div className="flex bg-slate-800 p-1 rounded-lg">
                 {[12, 16, 24, 32].map(num => (
                   <button
                     key={num}
                     onClick={() => setColorCount(num)}
                     className={`px-3 py-1 rounded text-sm font-medium transition-all ${colorCount === num ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                   >
                     {num}
                   </button>
                 ))}
              </div>
            </div>
          </div>
        )}

        {state === AppState.PROCESSING && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center space-y-4 animate-pulse">
               <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-indigo-400 font-medium">Analyzing geometry & generating palette...</p>
            </div>
          </div>
        )}

        {state === AppState.EDITOR && art && (
          <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden">
            
            {/* Left Sidebar: Info & Palette */}
            <div className="w-full lg:w-80 bg-slate-900 border-r border-slate-800 flex flex-col z-10">
              
              {/* AI Analysis Card */}
              <div className="p-4 border-b border-slate-800 bg-slate-800/30">
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Gemini Analysis</span>
                </div>
                
                {analysis ? (
                  <div className="space-y-3">
                    <h3 className="text-white font-bold leading-tight">{analysis.title}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">{analysis.description}</p>
                    <div className="flex items-center space-x-2 text-xs">
                        <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                           Difficulty: <span className={analysis.difficulty === 'Hard' ? 'text-red-400' : analysis.difficulty === 'Medium' ? 'text-yellow-400' : 'text-green-400'}>{analysis.difficulty}</span>
                        </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                    <div className="h-10 bg-slate-700 rounded w-full"></div>
                  </div>
                )}
              </div>

              {/* Palette */}
              <div className="flex-1 overflow-hidden p-4">
                 <ColorPalette 
                    palette={art.palette} 
                    activeColorId={activeColorId} 
                    onColorSelect={setActiveColorId}
                    completedColors={completedColors}
                 />
              </div>
            </div>

            {/* Center: Canvas */}
            <div className="flex-1 bg-slate-950 relative overflow-hidden p-4 flex flex-col">
              <div className="flex-1 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50 shadow-2xl relative">
                  {!activeColorId && (
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium animate-bounce pointer-events-none flex items-center">
                         <Palette className="w-4 h-4 mr-2" />
                         Select a color to start painting!
                      </div>
                  )}
                  <DrawingCanvas 
                    art={art} 
                    activeColorId={activeColorId} 
                    filledRegions={filledRegions}
                    onRegionClick={handleRegionClick}
                  />
              </div>
              <div className="mt-2 flex justify-between text-xs text-slate-500 px-2">
                 <span>Scroll to zoom • Drag to pan</span>
                 <span>{Math.round((Object.keys(filledRegions).length / art.regions.length) * 100)}% Complete</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
