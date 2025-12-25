
import React, { useState, useEffect, useCallback } from 'react';
import { ArtStyle, GenerationRecord, AppStatus } from './types';
import { ART_STYLES, HIDDEN_RANDOM_PROMPTS } from './constants';
import { GeminiService } from './services/geminiService';

const STORAGE_KEY = 'art_studio_history_v3';
const MAX_HISTORY = 8;

const BackgroundSystem: React.FC = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden bg-[#010203]">
    {/* 极慢速 3D 扭曲网格 */}
    <div className="absolute inset-[-100%] w-[300%] h-[300%] opacity-[0.12] animate-slow-grid-complex" 
         style={{
           backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
           backgroundSize: '150px 150px',
           transform: 'perspective(1500px) rotateX(70deg) translateZ(0)',
           maskImage: 'radial-gradient(circle at center, black, transparent 80%)'
         }} 
    />
    
    {/* 深度液态漂流光影 */}
    <div className="absolute top-[-30%] left-[-20%] w-[100vw] h-[100vw] bg-accent/8 blur-[180px] rounded-full animate-deep-fluid-1 pointer-events-none" />
    <div className="absolute bottom-[-20%] right-[-15%] w-[90vw] h-[90vw] bg-blue-600/8 blur-[180px] rounded-full animate-deep-fluid-2 pointer-events-none" />
    <div className="absolute top-[40%] right-[10%] w-[50vw] h-[50vw] bg-purple-600/4 blur-[140px] rounded-full animate-deep-fluid-3 pointer-events-none" />

    {/* 噪点质感 */}
    <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
         style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3Base-filter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/feTurbulence%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} 
    />
  </div>
);

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>('idle');
  const [selectedStyle, setSelectedStyle] = useState<ArtStyle>(ART_STYLES[0]);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [history, setHistory] = useState<GenerationRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  // 核心处理函数：图片文件转 Base64
  const processImageFile = useCallback((file: File | Blob) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('请选择图片文件');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setOriginalImage(reader.result as string);
      setResultImage(null);
      setStatus('idle');
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  }, []);

  // 核心处理函数：粘贴逻辑
  const handlePaste = useCallback((event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          processImageFile(file);
          // 视觉反馈：防止用户不知道粘贴成功
          console.debug('Image pasted successfully');
          break;
        }
      }
    }
  }, [processImageFile]);

  // 全局粘贴监听器，确保即使用户没点在上传框也能粘贴
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  useEffect(() => {
    let interval: any;
    if (status === 'generating') {
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % 3);
      }, 2000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) { console.warn(e); }
  }, []);

  const handleGenerate = async () => {
    if (!originalImage || status === 'generating') return;
    setStatus('generating');
    setErrorMessage(null);
    try {
      let finalPrompt = selectedStyle.prompt;
      // 随机风格逻辑：如果是随机风格，从隐藏池中挑一个
      if (selectedStyle.id === 'random') {
        finalPrompt = HIDDEN_RANDOM_PROMPTS[Math.floor(Math.random() * HIDDEN_RANDOM_PROMPTS.length)];
      }

      const gemini = new GeminiService();
      const result = await gemini.generateArtisticPortrait(originalImage, finalPrompt);
      setResultImage(result);
      setStatus('success');
      const newRecord = { id: Date.now().toString(), originalImage, resultImage: result, styleName: selectedStyle.name, timestamp: Date.now() };
      setHistory(prev => [newRecord, ...prev].slice(0, MAX_HISTORY));
    } catch (err: any) {
      setErrorMessage(err.message || '生成失败');
      setStatus('error');
    }
  };

  const loadingText = ["捕捉光影轮廓...", "细腻重塑肤质...", "艺术渲染输出..."];

  return (
    <div className="relative h-screen flex flex-col p-4 md:p-6 lg:p-8 overflow-hidden font-sans bg-transparent">
      <BackgroundSystem />
      
      <header className="flex items-center justify-between mb-6 shrink-0 h-14">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(0,240,144,0.4)]">
            <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white italic uppercase leading-none">ArtStudio</h1>
            <p className="text-[9px] text-accent tracking-[0.4em] uppercase opacity-80 mt-1">AI Haimati Lab</p>
          </div>
        </div>
        
        {history.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3 overflow-hidden">
              {history.slice(0, 4).map(item => (
                <img key={item.id} className="inline-block h-9 w-9 rounded-full ring-2 ring-black/50 object-cover grayscale hover:grayscale-0 transition-all cursor-pointer border border-white/10" src={item.resultImage} alt="" onClick={() => { setOriginalImage(item.originalImage); setResultImage(item.resultImage); setStatus('success'); }} />
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 flex gap-6 min-h-0 mb-4">
        {/* Left: Input Panel */}
        <section className="w-[380px] flex flex-col min-h-0 shrink-0">
          <div className="glass-panel rounded-[2.5rem] p-6 flex flex-col gap-6 h-full shadow-2xl">
            <div className="flex items-center justify-between shrink-0">
              <h2 className="text-xs font-bold text-white/90 flex items-center gap-2 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></span>
                Input Source
              </h2>
              <span className="text-[8px] text-accent font-bold uppercase px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20">Paste OK</span>
            </div>

            {/* 图片预览区 - 严格限制高度防止挤出按钮 */}
            <label className="flex-1 min-h-0 block w-full cursor-pointer relative group overflow-hidden">
              <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && processImageFile(e.target.files[0])} />
              <div className={`
                border border-white/10 border-dashed rounded-[2rem] h-full flex flex-col items-center justify-center transition-all duration-700 glass-card group-hover:border-accent/40
                ${originalImage ? 'bg-black/40' : 'hover:bg-white/5'}
              `}>
                {originalImage ? (
                  <div className="relative w-full h-full flex items-center justify-center p-4">
                    <img src={originalImage} className="max-h-full max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]" alt="Upload" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm rounded-[2rem]">
                      <p className="text-white text-[9px] font-bold tracking-widest bg-accent/20 px-5 py-2 rounded-full border border-accent/30 uppercase">Change Photo</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto ring-1 ring-white/10 group-hover:bg-accent/10 group-hover:ring-accent/20 transition-all duration-500">
                       <svg className="w-6 h-6 text-accent/60" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-200 text-[10px] font-bold tracking-widest uppercase">Click or Drag</p>
                      <p className="text-slate-500 text-[8px] uppercase tracking-wider">Ctrl + V to Paste</p>
                    </div>
                  </div>
                )}
              </div>
            </label>

            <div className="shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Select Style</h3>
                <span className="text-[9px] text-accent font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-accent/20">
                  {selectedStyle.name}
                </span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide px-1">
                {ART_STYLES.map((style) => (
                  <button key={style.id} onClick={() => setSelectedStyle(style)}
                    className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden glass-card transition-all duration-500 relative group
                      ${selectedStyle.id === style.id ? 'ring-2 ring-accent scale-95 opacity-100 shadow-[0_0_15px_rgba(0,240,144,0.3)]' : 'opacity-40 grayscale hover:opacity-80'}
                    `}>
                    {style.id === 'random' ? (
                      <div className="w-full h-full bg-gradient-to-br from-accent/20 to-blue-500/20 flex items-center justify-center">
                        <svg className={`w-6 h-6 text-accent transition-transform duration-700 ${selectedStyle.id === 'random' ? 'rotate-180' : 'group-hover:rotate-45'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                    ) : (
                      <img src={style.previewImage} alt={style.name} className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!originalImage || status === 'generating'}
              className={`
                w-full py-4 rounded-[1.25rem] font-black tracking-[0.2em] uppercase text-[10px] transition-all flex items-center justify-center gap-3 shrink-0
                ${!originalImage || status === 'generating' 
                  ? 'bg-white/5 text-slate-700 border border-white/5 cursor-not-allowed' 
                  : 'bg-accent text-black hover:bg-white hover:shadow-[0_15px_30px_rgba(0,240,144,0.3)] active:scale-[0.98]'}
              `}
            >
              {status === 'generating' ? 'AI Sculpting...' : 'Generate Art'}
            </button>
          </div>
        </section>

        {/* Right: Output Canvas */}
        <section className="flex-1 flex flex-col min-h-0">
          <div className="glass-panel rounded-[2.5rem] p-6 flex flex-col h-full shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-xs font-bold text-white/90 flex items-center gap-2 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                Canvas Result
              </h2>
              {resultImage && status === 'success' && (
                <a href={resultImage} download="ArtStudio_Portrait.png" className="text-[9px] text-accent font-black uppercase tracking-widest hover:text-white transition-colors">Download PNG</a>
              )}
            </div>

            <div className="flex-1 glass-card rounded-[2rem] relative overflow-hidden flex items-center justify-center bg-black/50 min-h-0">
              {status === 'generating' ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                  <div className="w-full h-1 bg-accent/30 shadow-[0_0_20px_rgba(0,240,144,0.5)] absolute top-0 animate-scan"></div>
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 mb-6 relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-accent/5 blur-2xl rounded-full animate-pulse"></div>
                      <div className="relative w-12 h-12">
                         <svg className={`absolute inset-0 text-accent transition-all duration-1000 ${loadingStep === 0 ? 'opacity-100 scale-110' : 'opacity-0 scale-75'}`} fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" d="m6.827 6.175-.016-.016A2.31 2.31 0 0 0 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 0-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                           <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                         </svg>
                         <svg className={`absolute inset-0 text-accent transition-all duration-1000 ${loadingStep === 1 ? 'opacity-100 scale-110' : 'opacity-0 scale-75'}`} fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                         </svg>
                         <svg className={`absolute inset-0 text-accent transition-all duration-1000 ${loadingStep === 2 ? 'opacity-100 scale-110' : 'opacity-0 scale-75'}`} fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                         </svg>
                      </div>
                    </div>
                    <p className="text-[9px] text-accent font-black tracking-[0.4em] uppercase animate-pulse">
                      {loadingText[loadingStep]}
                    </p>
                  </div>
                </div>
              ) : resultImage ? (
                <div className="w-full h-full p-4 flex items-center justify-center">
                  <img src={resultImage} className="max-h-full max-w-full object-contain rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-1000" alt="Result" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 opacity-10">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth="0.5" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2.0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  <p className="text-[9px] uppercase tracking-[0.6em] font-black italic">Waiting for Vision</p>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-red-500/20 border border-red-500/30 px-6 py-2 rounded-full backdrop-blur-xl z-50 animate-bounce">
                <p className="text-red-400 text-[9px] font-bold uppercase tracking-widest">{errorMessage}</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="shrink-0 flex justify-between items-center opacity-40 py-2">
        <p className="text-[8px] text-white uppercase tracking-[0.4em] font-medium italic">© 2025 ArtStudio Lab. Advanced AI Processing.</p>
        <div className="flex gap-4">
           {['#00f090', '#3b82f6', '#a855f7'].map(c => <div key={c} className="w-1 h-1 rounded-full" style={{backgroundColor: c}} />)}
        </div>
      </footer>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
        .animate-scan { animation: scan 3.5s linear infinite; }

        @keyframes slow-grid-complex {
          0% { transform: perspective(1500px) rotateX(70deg) translateY(0) rotate(0deg) scale(1); }
          50% { transform: perspective(1500px) rotateX(62deg) translateY(-30px) rotate(3deg) scale(1.03); }
          100% { transform: perspective(1500px) rotateX(70deg) translateY(0) rotate(0deg) scale(1); }
        }
        .animate-slow-grid-complex { animation: slow-grid-complex 140s ease-in-out infinite; }

        @keyframes deep-fluid-1 {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); border-radius: 50%; }
          33% { transform: translate(10vw, 8vh) scale(1.1) rotate(10deg); border-radius: 40% 60% 70% 30%; }
          66% { transform: translate(-5vw, 15vh) scale(0.9) rotate(-10deg); border-radius: 60% 40% 30% 70%; }
          100% { transform: translate(0, 0) scale(1) rotate(0deg); border-radius: 50%; }
        }
        .animate-deep-fluid-1 { animation: deep-fluid-1 110s cubic-bezier(0.445, 0.05, 0.55, 0.95) infinite; }

        @keyframes deep-fluid-2 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-8vw, -12vh) scale(1.2); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .animate-deep-fluid-2 { animation: deep-fluid-2 120s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite; }

        @keyframes deep-fluid-3 {
          0%, 100% { transform: translate(0, 0) opacity(0.3); }
          50% { transform: translate(6vw, -6vh) opacity(0.5); }
        }
        .animate-deep-fluid-3 { animation: deep-fluid-3 95s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default App;
