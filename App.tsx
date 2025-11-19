import React, { useState, useCallback } from 'react';
import { Verbosity, FlowchartData, NodeDensity, LayoutDirection } from './types';
import { generateFlowchart } from './services/geminiService';
import { computeLayout } from './utils/layoutUtils';
import DiagramCanvas from './components/DiagramCanvas';
import { Spinner } from './components/Spinner';

enum ExportPreset {
  PNG = 'png',
  A4 = 'a4',
  PPT = 'ppt',
  WORD = 'word'
}

const exportDiagram = (preset: ExportPreset) => {
  const svgElement = document.querySelector('#canvas-container svg') as SVGSVGElement;
  if (!svgElement) return;

  const serializer = new XMLSerializer();
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
  
  let width = 1200;
  let height = 800;
  let suffix = 'diagram';

  if (preset === ExportPreset.A4 || preset === ExportPreset.WORD) {
    // Check orientation of the diagram content
    const contentGroup = svgElement.querySelector('g');
    // Use getBBox if available, otherwise fallback
    const bbox = contentGroup ? (contentGroup as any).getBBox() : { width: 1000, height: 1000 };
    
    if (bbox.width > bbox.height) {
      // Landscape A4 (3508 x 2480 px @ 300 DPI)
      width = 3508;
      height = 2480;
      suffix = 'a4-landscape';
    } else {
      // Portrait A4 (2480 x 3508 px @ 300 DPI)
      width = 2480;
      height = 3508;
      suffix = 'a4-portrait';
    }
  } else if (preset === ExportPreset.PPT) {
    // 16:9 Slide (1920 x 1080 px)
    width = 1920;
    height = 1080;
    suffix = 'slide-16-9';
  }

  clonedSvg.setAttribute('width', width.toString());
  clonedSvg.setAttribute('height', height.toString());
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  // Reset transform to ensure content is visible and centered
  const contentGroup = clonedSvg.querySelector('g');
  if (contentGroup) {
     const origGroup = svgElement.querySelector('g');
     const bbox = origGroup ? (origGroup as any).getBBox() : { x:0, y:0, width: 1000, height: 1000 };
     
     // Reset transform
     contentGroup.setAttribute('transform', '');
     
     // Set viewBox to match content with padding
     const vPadding = 50;
     const vx = bbox.x - vPadding;
     const vy = bbox.y - vPadding;
     const vw = bbox.width + (vPadding * 2);
     const vh = bbox.height + (vPadding * 2);
     
     clonedSvg.setAttribute('viewBox', `${vx} ${vy} ${vw} ${vh}`);
  }

  const svgString = serializer.serializeToString(clonedSvg);
  
  const img = new Image();
  img.crossOrigin = "anonymous";
  
  const svgBlob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
  const url = URL.createObjectURL(svgBlob);
  
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, width, height);
      
      try {
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `geminiflow-${suffix}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      } catch (e) {
        console.error("Export failed:", e);
        alert("Security Error: Browser prevented image export.");
      }
    }
    URL.revokeObjectURL(url);
  };
  
  img.onerror = () => {
    console.error("Failed to load SVG for export");
    URL.revokeObjectURL(url);
  };

  img.src = url;
};

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [verbosity, setVerbosity] = useState<Verbosity>(Verbosity.MODERATE);
  const [density, setDensity] = useState<NodeDensity>(NodeDensity.MODERATE);
  const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>(LayoutDirection.TOP_BOTTOM);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FlowchartData | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleGenerate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setData(null);
    // Close sidebar on mobile after starting generation
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }

    try {
      const rawData = await generateFlowchart(prompt, verbosity, density);
      const layoutData = computeLayout(rawData, layoutDirection);
      setData(layoutData);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [prompt, verbosity, density, layoutDirection]);

  // Re-layout when direction changes without regenerating
  const handleLayoutChange = (newDirection: LayoutDirection) => {
    setLayoutDirection(newDirection);
    if (data) {
      const layoutData = computeLayout(data, newDirection);
      setData({...layoutData}); // Spread to force re-render
    }
  };

  return (
    <div className="flex h-screen w-full bg-white font-sans text-slate-900 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
            GF
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">GeminiFlow</h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50 w-80 md:w-96 bg-white border-r border-slate-200 flex flex-col shadow-xl md:shadow-none transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-100 hidden md:block">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
              GF
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">GeminiFlow</h1>
          </div>
          <p className="text-slate-500 text-xs">AI-Powered Diagram Generation</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 mt-16 md:mt-0">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label htmlFor="prompt" className="block text-sm font-semibold text-slate-700 mb-2">
                Describe your process
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. How to troubleshoot a slow internet connection. Start with checking if the router is on..."
                className="w-full h-40 p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none placeholder:text-slate-400"
              />
              <p className="mt-2 text-xs text-slate-400">
                More detail yields better results.
              </p>
            </div>

            {/* Verbosity */}
            <div>
              <span className="block text-sm font-semibold text-slate-700 mb-3">Verbosity Level</span>
              <div className="space-y-2">
                {[
                  { id: Verbosity.PRECISE, label: 'Precise', desc: 'Concise, short labels' },
                  { id: Verbosity.MODERATE, label: 'Moderate', desc: 'Complete sentences' },
                  { id: Verbosity.EXHAUSTIVE, label: 'Exhaustive', desc: 'Detailed paragraphs' }
                ].map((option) => (
                  <label 
                    key={option.id} 
                    className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all ${
                      verbosity === option.id 
                        ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="verbosity"
                      value={option.id}
                      checked={verbosity === option.id}
                      onChange={() => setVerbosity(option.id as Verbosity)}
                      className="mt-1 h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <div className="ml-3">
                      <span className={`block text-sm font-medium ${verbosity === option.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                        {option.label}
                      </span>
                      <span className={`block text-xs ${verbosity === option.id ? 'text-indigo-700' : 'text-slate-500'}`}>
                        {option.desc}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Node Density */}
            <div>
              <span className="block text-sm font-semibold text-slate-700 mb-3">Node Density</span>
              <div className="space-y-2">
                {[
                  { id: NodeDensity.AGGRESSIVE, label: 'Aggressive', desc: 'Minimal nodes' },
                  { id: NodeDensity.MODERATE, label: 'Moderate', desc: 'Necessary nodes' },
                  { id: NodeDensity.DEFAULT, label: 'Default', desc: 'Standard detail' }
                ].map((option) => (
                  <label 
                    key={option.id} 
                    className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all ${
                      density === option.id 
                        ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="density"
                      value={option.id}
                      checked={density === option.id}
                      onChange={() => setDensity(option.id as NodeDensity)}
                      className="mt-1 h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <div className="ml-3">
                      <span className={`block text-sm font-medium ${density === option.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                        {option.label}
                      </span>
                      <span className={`block text-xs ${density === option.id ? 'text-indigo-700' : 'text-slate-500'}`}>
                        {option.desc}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Layout Direction */}
            <div>
              <span className="block text-sm font-semibold text-slate-700 mb-3">Layout Direction</span>
              <div className="flex gap-2">
                {[
                  { id: LayoutDirection.TOP_BOTTOM, label: 'Top-Bottom' },
                  { id: LayoutDirection.ZIG_ZAG, label: 'Zig-Zag' }
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleLayoutChange(option.id as LayoutDirection)}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg border transition-all ${
                      layoutDirection === option.id
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Spinner />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>Generate Diagram</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
           <p className="text-[10px] text-slate-400">
             GeminiFlow v1.0
           </p>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden pt-16 md:pt-0">
        {/* Toolbar */}
        <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 md:px-6 flex-shrink-0">
           <div className="flex items-center gap-4">
              <h2 className="font-semibold text-slate-800 text-sm md:text-base">Flowchart Canvas</h2>
              {data && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                   {data.nodes.length} Nodes
                </span>
              )}
           </div>
           <div className="flex items-center gap-3 relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={!data}
                className="py-2 px-3 md:px-4 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="hidden md:inline">Export</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showExportMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-100 z-50 overflow-hidden">
                  <div className="py-1">
                    <button 
                      onClick={() => { exportDiagram(ExportPreset.PNG); setShowExportMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <span className="w-6 text-center">🖼️</span> PNG (Current View)
                    </button>
                    <button 
                      onClick={() => { exportDiagram(ExportPreset.A4); setShowExportMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <span className="w-6 text-center">📄</span> A4 Print (High Res)
                    </button>
                    <button 
                      onClick={() => { exportDiagram(ExportPreset.PPT); setShowExportMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <span className="w-6 text-center">📊</span> PowerPoint (16:9)
                    </button>
                    <button 
                      onClick={() => { exportDiagram(ExportPreset.WORD); setShowExportMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <span className="w-6 text-center">📝</span> Word Document
                    </button>
                  </div>
                </div>
              )}
           </div>
        </div>

        {/* Visualization */}
        <div className="flex-1 bg-slate-50 relative overflow-hidden shadow-inner">
           <DiagramCanvas data={data} />
        </div>
      </main>
    </div>
  );
};

export default App;