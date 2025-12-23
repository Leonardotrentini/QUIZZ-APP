
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FUNNEL_BLOCKS } from './content/funnelData';
import { UserAnswers, FunnelBlock } from './types';
import { getPersonalizedAnalysis } from './services/geminiService';
import { trackBlockView, trackAnswerSelected, trackBlockCompleted, trackCheckoutClick, trackPageAbandon } from './services/trackingService';
// Dashboard - Acesse via #dashboard na URL
import Dashboard from './pages/Dashboard';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'wistia-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

// --- Types for Editor & Gamification ---
interface ImageAdjustment {
  x: number;
  y: number;
  scale: number;
}

interface EditorState {
  [blockId: number]: ImageAdjustment;
}

// --- Sound Assets (Direct Response Optimized) ---
const SOUNDS = {
  click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Pop satisfatório
  milestone: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Chime de conquista
  win: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3', // Fanfarra de vitória
  spin: 'https://assets.mixkit.co/active_storage/sfx/1495/1495-preview.mp3', // Clique mecânico de rotação
};

const PROJECTION_FALLBACK = `¡Gracias por esperar, ahora vamos a traerte el RESULTADO REAL!

Nuestro sistema analiza CADA RESPUESTA tuya para entender si, DE HECHO, nuestro programa tiene sentido para ti. Estamos analizando CADA DETALLE para garantizar que eres la persona correcta para formar parte de nuestro equipo. ¡Mereces este autocuidado! Con enfoque y solo algunos minutos en casa, estos 21 días serán el punto de giro para conquistar el cuerpo que deseas. ¡Tu fuerza es inspiradora y eres plenamente capaz de transformar tu rutina en resultados reales!`;

// Pre-loading audio objects for zero latency
const audioCache: Record<string, HTMLAudioElement> = {
  click: new Audio(SOUNDS.click),
  milestone: new Audio(SOUNDS.milestone),
  win: new Audio(SOUNDS.win),
  spin: new Audio(SOUNDS.spin)
};

const playSFX = (soundKey: keyof typeof SOUNDS, volume = 0.4) => {
  try {
    const sound = audioCache[soundKey];
    if (sound) {
      const playback = sound.cloneNode() as HTMLAudioElement;
      playback.volume = volume;
      playback.play().catch(() => {
        // Silently fail if blocked by browser
      });
    }
  } catch (e) {
    console.warn("Audio error", e);
  }
};

// --- Helper Components ---

const WISTIA_MEDIA_ID = '9dq5h4uqnm';

const ensureWistiaAssets = (() => {
  let loaded = false;
  return () => {
    if (loaded) return;
    loaded = true;
    const playerScript = document.createElement('script');
    playerScript.src = 'https://fast.wistia.com/player.js';
    playerScript.async = true;
    document.body.appendChild(playerScript);

    const embedScript = document.createElement('script');
    embedScript.src = `https://fast.wistia.com/embed/${WISTIA_MEDIA_ID}.js`;
    embedScript.type = 'module';
    embedScript.async = true;
    document.body.appendChild(embedScript);

    const style = document.createElement('style');
    style.innerHTML = `wistia-player[media-id='${WISTIA_MEDIA_ID}']:not(:defined){background:center/contain no-repeat url('https://fast.wistia.com/embed/medias/${WISTIA_MEDIA_ID}/swatch');display:block;filter:blur(5px);padding-top:56.46%;}`;
    document.head.appendChild(style);
  };
})();

const WistiaEmbed: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureWistiaAssets();
  }, []);

  return (
    <div ref={ref} className="relative w-full aspect-video bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl border-[6px] border-white">
      <wistia-player media-id={WISTIA_MEDIA_ID} seo="false" aspect="1.7712177121771218" style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
};

const ConfettiContainer: React.FC = () => {
  const colors = ['#ec4899', '#db2777', '#f472b6', '#fbcfe8', '#10b981'];
  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="confetti"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            animationDelay: `${Math.random() * 2}s`,
            width: `${Math.random() * 10 + 5}px`,
            height: `${Math.random() * 10 + 5}px`,
          }}
        />
      ))}
    </div>
  );
};

const VitalityMeter: React.FC<{ score: number; animate: boolean; lastPoints?: number }> = ({ score, animate, lastPoints }) => (
  <div className="flex flex-col items-end relative">
    {animate && lastPoints && (
      <div className="absolute -top-6 right-0 text-pink-600 font-black text-xs animate-bounce opacity-0 transition-opacity duration-300" style={{ opacity: animate ? 1 : 0 }}>
        +{lastPoints}
      </div>
    )}
    <div className={`flex items-center gap-1.5 transition-all ${animate ? 'animate-score' : ''}`}>
      <div className="flex flex-col items-end">
        <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter leading-none mb-0.5">Puntaje Vitality</span>
        <div className={`flex items-center px-2 py-0.5 rounded-full border transition-all duration-500 ${score > 1000 ? 'bg-pink-600 border-pink-700 shadow-[0_0_10px_rgba(219,39,119,0.4)]' : 'bg-pink-100 border-pink-200'}`}>
          <span className={`text-xs font-black ${score > 1000 ? 'text-white' : 'text-pink-600'}`}>{score}</span>
          <svg className={`w-3 h-3 ml-1 ${score > 1000 ? 'text-pink-200' : 'text-pink-500'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
        </div>
      </div>
    </div>
  </div>
);

const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => {
  const percentage = (current / total) * 100;
  return (
    <div className="w-full h-2.5 bg-pink-100 sticky top-0 z-50 overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-pink-400 via-pink-600 to-pink-400 bg-[length:200%_auto] transition-all duration-700 ease-out shadow-[0_0_10px_rgba(219,39,119,0.5)] animate-[gradient_3s_linear_infinite]"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

const FeedbackToast: React.FC<{ message: string; onComplete: () => void; isMilestone?: boolean }> = ({ message, onComplete, isMilestone }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, isMilestone ? 3000 : 2200);
    return () => clearTimeout(timer);
  }, [onComplete, isMilestone]);

  return (
    <div className="fixed top-32 left-0 right-0 flex justify-center z-[200] pointer-events-none px-4">
      <div className="w-full max-w-xs animate-fadeIn pointer-events-auto">
        <div className={`bg-white border-2 rounded-2xl shadow-[0_20px_50px_rgba(219,39,119,0.3)] p-4 flex items-start gap-4 transform ${isMilestone ? 'border-pink-600 scale-105 rotate-0 shadow-[0_0_30px_rgba(219,39,119,0.4)]' : 'border-pink-500 rotate-1'}`}>
          <div className={`${isMilestone ? 'bg-pink-700' : 'bg-pink-600'} w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg animate-bounce`}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
          </div>
          <div>
             <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${isMilestone ? 'text-pink-700' : 'text-pink-600'}`}>
               {isMilestone ? '🔥 STATUS DE ELITE' : '¡Excelente elección!'}
             </p>
             <p className="text-gray-800 text-sm font-bold leading-tight">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Header: React.FC<{ score: number; animateScore: boolean; lastPoints?: number }> = ({ score, animateScore, lastPoints }) => (
  <header className="py-5 px-4 flex justify-between items-center bg-white/70 backdrop-blur-lg sticky top-0 z-[100] border-b border-pink-50">
    <div className="flex flex-col">
      <div className="text-pink-600 font-extrabold text-xl tracking-tight leading-none">VITALITY<span className="text-gray-800">FLOW</span></div>
      <div className="flex items-center gap-1 mt-1">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">342 usuarias en línea</span>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <VitalityMeter score={score} animate={animateScore} lastPoints={lastPoints} />
    </div>
  </header>
);

// --- Editable Image Component ---

const EditableImage: React.FC<{
  src: string;
  blockId: number;
  isEditMode: boolean;
  adjustments: ImageAdjustment;
  onUpdate: (adj: ImageAdjustment) => void;
  className?: string;
  overlayOpacity?: number;
}> = ({ src, blockId, isEditMode, adjustments, onUpdate, className = "", overlayOpacity = 0 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isEditMode) return;
    setIsDragging(true);
    setIsSaved(false);
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    startPos.current = { x: clientX - adjustments.x, y: clientY - adjustments.y };
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !isEditMode) return;
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    onUpdate({
      ...adjustments,
      x: clientX - startPos.current.x,
      y: clientY - startPos.current.y
    });
  };

  const stopDragging = () => setIsDragging(false);

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 1500);
  };

  return (
    <div 
      className={`relative w-full h-full overflow-hidden select-none ${isEditMode ? 'cursor-move ring-2 ring-pink-500' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDragging}
      onMouseLeave={stopDragging}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={stopDragging}
    >
      <img 
        src={src} 
        alt="Editable content" 
        className={`absolute w-full h-full object-cover pointer-events-none transition-transform duration-75 ${className}`}
        style={{
          transform: `translate(${adjustments.x}px, ${adjustments.y}px) scale(${adjustments.scale})`,
          opacity: overlayOpacity ? 1 - overlayOpacity : 1
        }}
      />
      {isEditMode && (
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-md font-mono pointer-events-none">
          X: {Math.round(adjustments.x)} Y: {Math.round(adjustments.y)} S: {adjustments.scale.toFixed(2)}
        </div>
      )}
      {isEditMode && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[90%] bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-pink-100 pointer-events-auto flex items-center gap-3" onClick={e => e.stopPropagation()}>
          <div className="flex-1 flex items-center gap-2 px-1">
            <span className="text-[9px] font-black text-pink-600 uppercase tracking-tighter">Zoom</span>
            <input 
              type="range" 
              min="1" 
              max="3" 
              step="0.05" 
              value={adjustments.scale}
              onChange={(e) => {
                onUpdate({ ...adjustments, scale: parseFloat(e.target.value) });
                setIsSaved(false);
              }}
              className="w-full h-1 bg-pink-100 rounded-lg appearance-none cursor-pointer accent-pink-600"
            />
          </div>
          <div className="flex items-center gap-1.5 border-l border-gray-100 pl-2">
            <button 
              onClick={() => {
                onUpdate({ x: 0, y: 0, scale: 1 });
                setIsSaved(false);
              }}
              className="p-1.5 bg-gray-50 rounded-lg text-[8px] font-black text-gray-400 hover:text-pink-600 transition-colors"
            >
              REINICIAR
            </button>
            <button 
              onClick={handleSaveClick}
              className={`p-1.5 rounded-lg transition-all transform active:scale-90 flex items-center justify-center ${isSaved ? 'bg-green-500 text-white' : 'bg-pink-600 text-white'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Data Visualization Components ---

const ProjectionChart: React.FC<{ weight: number; height: number }> = ({ weight, height }) => {
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Simple BMI & Projection Logic
  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);
  const potentialLoss21 = bmi > 30 ? 7 : (bmi > 25 ? 5 : 3);
  const weight21 = weight - potentialLoss21;
  const weight90 = weight - (potentialLoss21 * 2.5);

  const points = [
    { x: 10, y: 90, label: "Hoy", val: weight },
    { x: 50, y: 60, label: "21 Días", val: weight21 },
    { x: 90, y: 30, label: "90 Días", val: weight90.toFixed(1) }
  ];

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-6 border-2 border-pink-100 shadow-xl space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Proyección Vitality</h3>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
          <span className="text-[10px] font-bold text-pink-600 uppercase">Calculado con IA</span>
        </div>
      </div>

      <div className="relative h-40 w-full mt-4">
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#db2777', stopOpacity: 0.2 }} />
              <stop offset="100%" style={{ stopColor: '#db2777', stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          
          {/* Background Area */}
          <path 
            d={`M10,90 Q50,60 90,30 L90,100 L10,100 Z`} 
            fill="url(#chartGradient)" 
            className={`transition-all duration-[2000ms] ease-out ${animate ? 'opacity-100' : 'opacity-0'}`}
          />
          
          {/* Main Curve */}
          <path 
            d={`M10,90 Q50,60 90,30`} 
            fill="none" 
            stroke="#db2777" 
            strokeWidth="3" 
            strokeLinecap="round"
            style={{ strokeDasharray: 200, strokeDashoffset: animate ? 0 : 200, transition: 'stroke-dashoffset 2s ease-out' }}
          />

          {/* Points */}
          {points.map((p, i) => (
            <g key={i} className={`transition-opacity duration-700 delay-[${i * 500}ms] ${animate ? 'opacity-100' : 'opacity-0'}`}>
              <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="#db2777" strokeWidth="2" />
              <text x={p.x} y={p.y - 10} textAnchor="middle" className="text-[6px] font-black fill-gray-900">{p.val}kg</text>
              <text x={p.x} y={p.y + 15} textAnchor="middle" className="text-[5px] font-bold fill-gray-400 uppercase tracking-tighter">{p.label}</text>
            </g>
          ))}
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="bg-pink-50 rounded-2xl p-3 border border-pink-100">
           <p className="text-[8px] font-black text-pink-400 uppercase tracking-widest mb-1">Total Previsto</p>
           <p className="text-xl font-black text-pink-600">-{potentialLoss21}kg</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
           <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">IMC Analizado</p>
           <p className="text-xl font-black text-gray-800">{bmi.toFixed(1)}</p>
        </div>
      </div>
    </div>
  );
};

// --- Roulette Hub Component ---

const PremiumRoulette: React.FC<{ 
  isSpinning: boolean; 
  onFinish: (result: string) => void;
  spinAttempt: number;
}> = ({ isSpinning, onFinish, spinAttempt }) => {
  const [rotation, setRotation] = useState(0);

  const segments = [
    { text: "WIN!", color: "url(#goldGradient)", textColor: "#000", isJackpot: true },
    { text: "0%", color: "#be185d", textColor: "#fff" },
    { text: "10%", color: "#db2777", textColor: "#fff" },
    { text: "0%", color: "#be185d", textColor: "#fff" },
    { text: "60%", color: "#db2777", textColor: "#fff" },
    { text: "0%", color: "#be185d", textColor: "#fff" },
    { text: "20%", color: "#db2777", textColor: "#fff" },
    { text: "0%", color: "#be185d", textColor: "#fff" },
  ];

  const startSpinAnimation = () => {
    let targetIndex = 0; 
    if (spinAttempt === 1) targetIndex = 1;
    
    const baseSpins = 2160; 
    const currentRelativeRotation = rotation % 360;
    const targetLandingAngle = 247.5 - (targetIndex * 45);
    let extraToLanding = targetLandingAngle - currentRelativeRotation;
    if (extraToLanding <= 0) extraToLanding += 360; 
    const finalRotation = rotation + baseSpins + extraToLanding;
    setRotation(finalRotation);
    
    setTimeout(() => {
      onFinish(segments[targetIndex].text);
    }, 4100);
  };

  useEffect(() => {
    if (isSpinning) {
      playSFX('spin', 0.6);
      startSpinAnimation();
    }
  }, [isSpinning]);

  return (
    <div className="relative w-[300px] h-[300px] mx-auto select-none">
      <div className={`absolute -inset-4 rounded-full bg-pink-500/10 blur-2xl transition-opacity duration-1000 ${isSpinning ? 'opacity-100' : 'opacity-0'}`}></div>
      <div className="absolute inset-0 rounded-full border-[10px] border-[#e2a9be] shadow-[0_0_40px_rgba(219,39,119,0.3)] z-20 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div key={i} className={`absolute w-3 h-3 rounded-full bg-white shadow-[0_0_8px_white] transition-opacity duration-300`} style={{ top: '50%', left: '50%', transform: `rotate(${i * 30}deg) translate(0, -145px)`, opacity: isSpinning ? (Math.random() > 0.5 ? 1 : 0.3) : 1 }} />
          ))}
      </div>
      <div className="w-full h-full relative transition-transform duration-[4000ms] ease-[cubic-bezier(0.1,0.7,0.1,1)]" style={{ transform: `rotate(${rotation}deg)` }}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
          <defs>
            <filter id="innerShadow">
              <feOffset dx="0" dy="0"/><feGaussianBlur stdDeviation="1" result="offset-blur"/><feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse"/><feFlood floodColor="black" floodOpacity="0.4" result="color"/><feComposite operator="in" in="color" in2="inverse" result="shadow"/><feComposite operator="over" in="shadow" in2="SourceGraphic"/>
            </filter>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} /><stop offset="25%" style={{ stopColor: '#FFF8DC', stopOpacity: 1 }} /><stop offset="50%" style={{ stopColor: '#DAA520', stopOpacity: 1 }} /><stop offset="75%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} /><stop offset="100%" style={{ stopColor: '#B8860B', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          {segments.map((seg, i) => {
            const angle = (360 / segments.length);
            const startAngle = i * angle;
            const endAngle = (i + 1) * angle;
            const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
            const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
            const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
            const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);
            return (
              <g key={i}>
                <path d={`M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`} fill={seg.color} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" filter="url(#innerShadow)" />
                <g transform={`rotate(${startAngle + angle/2}, 50, 50)`}>
                    {seg.isJackpot ? (<text x="75" y="52.5" fill={seg.textColor} fontSize="9" fontWeight="900" textAnchor="middle" className="uppercase tracking-tighter" style={{ fontFamily: 'Montserrat, sans-serif' }}>{seg.text}</text>) : (<text x="75" y="51" fill={seg.textColor} fontSize="5" fontWeight="900" textAnchor="middle" className="uppercase tracking-widest" style={{ fontFamily: 'Montserrat, sans-serif' }}>{seg.text}</text>)}
                </g>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-40"><div className="w-8 h-10 bg-gradient-to-b from-yellow-300 to-yellow-500 shadow-xl clip-path-arrow transform rotate-180 border-2 border-white/20"></div></div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isMilestone, setIsMilestone] = useState(false);
  const [personalizedMsg, setPersonalizedMsg] = useState<string>("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [rouletteWon, setRouletteWon] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [vitalityScore, setVitalityScore] = useState(0);
  const [lastPointsAdded, setLastPointsAdded] = useState(0);
  const [animateScore, setAnimateScore] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [spinAttempt, setSpinAttempt] = useState(1);
  const [showSecondChancePopup, setShowSecondChancePopup] = useState(false);
  const [showProjectionButton, setShowProjectionButton] = useState(false);
  const [showFinalOfferPopup, setShowFinalOfferPopup] = useState(false);
  const [countdownTime, setCountdownTime] = useState(180); // 3 minutes in seconds
  const socialProofScrollRef = useRef<HTMLDivElement>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editorState, setEditorState] = useState<EditorState>(() => {
    const saved = localStorage.getItem('funnel_image_adjustments');
    return saved ? JSON.parse(saved) : {};
  });

  const currentBlock = FUNNEL_BLOCKS[currentBlockIndex];
  const totalSteps = FUNNEL_BLOCKS.length;

  useEffect(() => { localStorage.setItem('funnel_image_adjustments', JSON.stringify(editorState)); }, [editorState]);

  // Tracking: Rastreia visualização de cada bloco
  useEffect(() => {
    if (currentBlock) {
      trackBlockView(currentBlock.id, currentBlock.type, currentBlock.title, totalSteps).catch(() => {});
    }
  }, [currentBlockIndex, currentBlock, totalSteps]);

  // Tracking: Rastreia abandono da página (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      trackPageAbandon(currentBlock.id, currentBlock.type, totalSteps);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentBlockIndex, currentBlock, totalSteps]);
  const updateAdjustment = (blockId: number, adj: ImageAdjustment) => { setEditorState(prev => ({ ...prev, [blockId]: adj })); };
  const getAdj = (blockId: number): ImageAdjustment => editorState[blockId] || { x: 0, y: 0, scale: 1 };
  const handleNext = useCallback(() => { if (currentBlockIndex < totalSteps - 1) setCurrentBlockIndex(prev => prev + 1); }, [currentBlockIndex, totalSteps]);
  const handleBack = useCallback(() => { if (currentBlockIndex > 0) setCurrentBlockIndex(prev => prev - 1); }, [currentBlockIndex]);
  
  const addVitalityPoints = (points: number) => { 
    setLastPointsAdded(points);
    setVitalityScore(prev => prev + points); 
    setAnimateScore(true); 
    setTimeout(() => setAnimateScore(false), 800); 
  };

  const onAnswer = (value: any, feedbackMsg?: string) => {
    // DISPARO INMEDIATO DEL SONIDO DE CLICK
    playSFX('click', 0.35);

    setAnswers(prev => ({ ...prev, [currentBlock.id]: value }));
    addVitalityPoints(150);
    
    // Tracking: Rastreia resposta selecionada
    const answerText = currentBlock.alternatives?.find(alt => alt.id === value)?.text;
    trackAnswerSelected(
      currentBlock.id,
      currentBlock.type,
      value,
      answerText,
      vitalityScore + 150, // score após adicionar pontos
      totalSteps
    ).catch(() => {});
    
    // Milestone Detection Logic
    let milestoneMsg = "";
    if (currentBlockIndex === 5) milestoneMsg = "¡Tu compromiso está por encima del 85% de las candidatas!";
    if (currentBlockIndex === 10) milestoneMsg = "¡Excelente! ¡Acabas de desbloquear el Status de Inversión Avanzado!";
    
    if (milestoneMsg) {
      setIsMilestone(true);
      setFeedback(milestoneMsg);
      playSFX('milestone', 0.5);
    } else if (feedbackMsg) {
      setIsMilestone(false);
      setFeedback(feedbackMsg);
    } else {
      // Tracking: Bloco completado antes de avançar
      trackBlockCompleted(currentBlock.id, currentBlock.type, vitalityScore + 150, totalSteps).catch(() => {});
      handleNext();
    }
  };

  useEffect(() => {
    if (currentBlock.type === 'analysis') {
      const messages = ["Sincronizando...", "Calculando...", "Verificando...", "Finalizando..."];
      let step = 0;
      const interval = setInterval(() => {
        if (step < messages.length) { 
          setLoadingStep(step); 
          step++; 
        } else { 
          clearInterval(interval); 
          handleNext(); 
        }
      }, 1500);
      return () => clearInterval(interval);
    }
    if (currentBlock.type === 'projection') {
        setShowProjectionButton(true);
        setPersonalizedMsg(PROJECTION_FALLBACK);
        getPersonalizedAnalysis(answers).then((msg) => {
          if (msg) setPersonalizedMsg(msg);
        });
        addVitalityPoints(500);
    }
    if (currentBlock.type === 'approval') { 
      setShowConfetti(true); 
      playSFX('win', 0.5);
      setTimeout(() => setShowConfetti(false), 4000); 
    }
  }, [currentBlockIndex, handleNext, currentBlock.type, answers]);

  useEffect(() => {
    let timerId: any;
    if (showFinalOfferPopup && countdownTime > 0) {
      timerId = setInterval(() => {
        setCountdownTime(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [showFinalOfferPopup, countdownTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const onRouletteFinish = (result: string) => {
    setIsSpinning(false);
    if (result === 'WIN!') { 
      setRouletteWon(true); 
      setShowConfetti(true); 
      playSFX('win', 0.7);
      addVitalityPoints(1000); 
      setTimeout(() => setShowConfetti(false), 4000); 
    } else { 
      setTimeout(() => setShowSecondChancePopup(true), 500); 
    }
  };

  const renderContent = () => {
    switch (currentBlock.type) {
      case 'vsl':
        return (
          <div className="text-center space-y-8 animate-fadeIn">
            <div className="px-4 space-y-4">
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-[1.15] tracking-tight">
                <span className="text-pink-600 block mb-1">¡BASTA DE SENTIRTE</span>
                <span className="underline decoration-pink-500/30">INVISIBLE!</span> ¡TU TRANSFORMACIÓN COMIENZA AHORA!
              </h1>
              <h2 className="text-lg text-gray-500 font-medium max-w-sm mx-auto">{currentBlock.description}</h2>
            </div>
            <div className="relative mx-4">
              <WistiaEmbed />
            </div>
            <div className="px-6 pb-4"><button onClick={() => { playSFX('click'); handleNext(); }} className="w-full py-5 bg-pink-600 text-white text-xl font-black rounded-3xl shadow-xl animate-pulse-slow">EMPEZAR DIAGNÓSTICO</button></div>
          </div>
        );

      case 'question':
        let questionImage = "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?q=80&w=1200";
        if (currentBlock.id === 2) questionImage = "https://www.shutterstock.com/shutterstock/videos/26292803/thumb/1.jpg";
        else if (currentBlock.id === 3) questionImage = "https://images.unsplash.com/photo-1636625632595-98fa44634dbf?q=80&w=687";
        else if (currentBlock.id === 4) questionImage = "https://revistaanamaria.com.br/wp-content/uploads/2024/12/httpsrevistaanamaria.com_.brmediauploadslegacy20150807entenda-a-gordorexia.jpg";
        else if (currentBlock.id === 5) questionImage = "https://marciocamara.com/wp-content/uploads/2021/04/baixa-autoestima.jpg";
        else if (currentBlock.id === 6) questionImage = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS7prWmWjHlYBmUXsgkwYg40knw125aXN8s_w&s";
        else if (currentBlock.id === 7) questionImage = "https://img.freepik.com/fotos-premium/garota-gorda-faz-ginastica-em-casa-expressao-satisfeita-cyan-background-41_1118532-1142.jpg";
        else if (currentBlock.id === 8) questionImage = "https://img.freepik.com/fotos-premium/uma-mulher-esta-sentada-em-uma-cama-com-os-bracos-cruzados-e-uma-careta-no-rosto-ela-esta-olhando-pela-janela_1010501-4635.jpg?w=740";
        else if (currentBlock.id === 11) questionImage = "https://st4.depositphotos.com/1017228/24745/i/450/depositphotos_247451656-stock-photo-close-up-of-a-woman.jpg";
        else if (currentBlock.id === 12) questionImage = "https://img.nsctotal.com.br/wp-content/uploads/2023/11/nscemagrecimento.jpg";
        else if (currentBlock.id === 13) questionImage = "https://static.wixstatic.com/media/998430_d8a843f5e5e54b478d73b86abc5a2efb~mv2.png/v1/fill/w_568,h_404,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/998430_d8a843f5e5e54b478d73b86abc5a2efb~mv2.png";

        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="px-4">
               <div className="relative w-full aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl bg-gray-200 border-4 border-white">
                  <EditableImage src={questionImage} blockId={currentBlock.id} isEditMode={isEditMode} adjustments={getAdj(currentBlock.id)} onUpdate={(adj) => updateAdjustment(currentBlock.id, adj)} />
               </div>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 text-center px-6 leading-tight">{currentBlock.title}</h2>
            <div className="flex flex-col gap-4 px-4 pb-12">
              {currentBlock.alternatives?.map((alt) => (
                <button key={alt.id} onClick={() => onAnswer(alt.id, alt.feedback)} className="w-full flex items-center bg-white border-2 border-gray-100 hover:border-pink-500 rounded-2xl shadow-sm p-5 transition-all">
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-pink-50 text-pink-600 rounded-full text-base font-bold mr-4">{alt.id}</div>
                  <span className="text-gray-800 text-base font-bold text-left leading-snug">{alt.text}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 'input_numeric':
        return (
          <div className="text-center space-y-8 px-4">
            <h2 className="text-2xl font-extrabold text-gray-900">{currentBlock.title}</h2>
            <p className="text-gray-500">{currentBlock.description}</p>
            <div className="flex justify-center items-center space-x-2 py-4">
                <input type="number" placeholder="00" className="w-32 text-center text-4xl font-bold py-6 bg-white border-4 border-pink-200 rounded-3xl outline-none" onChange={(e) => setAnswers(prev => ({...prev, [currentBlock.id]: e.target.value}))} />
                <span className="text-2xl font-bold text-pink-600">{currentBlock.inputType}</span>
            </div>
            <button onClick={() => { playSFX('click'); addVitalityPoints(200); handleNext(); }} className="w-full py-5 bg-pink-600 text-white text-xl font-black rounded-3xl shadow-xl">CONTINUAR</button>
          </div>
        );

      case 'image_select':
        return (
          <div className="space-y-6 px-4">
            <h2 className="text-2xl font-extrabold text-gray-900 text-center">{currentBlock.title}</h2>
            <div className="grid grid-cols-2 gap-4">
              {currentBlock.images?.map((img, idx) => (
                <button key={idx} onClick={() => onAnswer(idx)} className="relative aspect-[3/4] rounded-2xl overflow-hidden border-4 border-transparent hover:border-pink-500 shadow-lg">
                  <img src={img} alt={`Option ${idx}`} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 z-10 w-8 h-8 flex items-center justify-center bg-white/80 rounded-lg text-pink-600 text-sm font-black">{String.fromCharCode(65 + idx)}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'analysis':
        return (
          <div className="text-center space-y-12 py-12 px-4">
            <h2 className="text-3xl font-extrabold text-pink-600">{currentBlock.title}</h2>
            <div className="relative w-48 h-48 mx-auto">
                <svg className="w-full h-full animate-spin text-pink-200" viewBox="0 0 100 100">
                    <circle className="opacity-25" cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" />
                    <circle className="text-pink-600" cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset={251.2 - (loadingStep + 1) * 62} fill="transparent" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-2xl text-pink-600">{Math.round(((loadingStep + 1) / 4) * 100)}%</div>
            </div>
            <p className="text-xl font-medium text-gray-700 italic animate-pulse">Procesando datos...</p>
          </div>
        );

      case 'approval':
        const weightVal = Number(answers[9]) || 70;
        const heightVal = Number(answers[10]) || 165;
        return (
          <div className="space-y-6 py-6 px-4 animate-fadeIn">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-xl border-4 border-white animate-float">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
              </div>
              <h2 className="text-3xl font-black text-gray-900 leading-none uppercase">{currentBlock.title}</h2>
              <p className="text-sm font-bold text-green-600 tracking-widest uppercase">Perfil Analizado con Éxito</p>
            </div>

            <ProjectionChart weight={weightVal} height={heightVal} />

            <div className="bg-pink-600 p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
               <p className="text-white text-lg font-bold leading-tight relative z-10">
                 "Basado en tu perfil, tienes un **Potencial Metabólico del 87%**. Los próximos 21 días serán transformadores para tu autoestima."
               </p>
            </div>

            <button onClick={() => { playSFX('click'); handleNext(); }} className="w-full py-6 bg-gray-900 text-white text-xl font-black rounded-3xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-transform">
              <span>AVANZAR AL PLAN</span>
              <svg className="w-6 h-6 animate-bounce-x" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
          </div>
        );

      case 'projection':
        return (
          <div className="space-y-6 px-4 py-4 animate-fadeIn">
            <h2 className="text-2xl font-extrabold text-gray-900 text-center leading-tight">{currentBlock.title}</h2>
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-2 border-pink-100 space-y-6 relative">
              <div className="absolute -top-3 left-6 bg-pink-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Reporte Personalizado</div>
              
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center shadow-md border-2 border-white flex-shrink-0">
                  <span className="text-white text-xs font-black">VF</span>
                </div>
                <span className="text-sm font-black text-gray-800 uppercase tracking-tight">Resultado del sistema:</span>
              </div>

              <p className="text-gray-700 leading-relaxed italic text-sm sm:text-base bg-pink-50/50 p-5 rounded-2xl border border-pink-100 whitespace-pre-wrap">
                {personalizedMsg || PROJECTION_FALLBACK}
              </p>
            </div>
            {showProjectionButton && (
              <button 
                onClick={() => { playSFX('click'); handleNext(); }} 
                className="w-full py-5 bg-pink-600 text-white text-xl font-black rounded-3xl shadow-lg animate-fadeIn"
              >
                ¡Ver RESULTADOS reales!
              </button>
            )}
          </div>
        );

      case 'social_proof':
        const testimonials = [
          { name: "Juliana Ferreira", age: "34 años", text: "Ya había perdido la esperanza, no podía ir al gimnasio ni seguir la dieta, pero después de conocer VitalityFlow no fue forzado. Comencé a entrenar en casa, le agarré el gusto y en los primeros 30 días perdí 11 kilos sin sufrir.", img: "https://s2-vogue.glbimg.com/Y2toS5OnSDc1NfFu4pgs8iHGrfI=/0x0:1155x928/924x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_5dfbcf92c1a84b20a5da5024d398ff2f/internal_photos/bs/2025/U/W/QCVTMdQ466elWmHk7MAw/antesedepois1.jpg" },
          { name: "Paola Mendes", age: "42 años", text: "Como madre y trabajando tiempo completo, creía que tener un cuerpo que me hiciera sentir bien era un sueño imposible. El gimnasio estaba lejos y me sentía culpable por 'quitar tiempo a la familia'. ¡Pero VitalityFlow lo cambió todo!", img: "https://gordinhamimada.wordpress.com/wp-content/uploads/2014/08/antes-depois-9-meses-biquini.png" },
          { name: "Beatriz Lima", age: "38 años", text: "Hacía al menos 6 años que me había rendido con mi belleza. No me sentía bonita, mi esposo no me miraba y ya no me sentía atractiva. ¡Después de VitalityFlow cambié mi vida!", img: "https://img.freepik.com/fotos-premium/antes-e-depois-magra-e-gorda-mulher-gordinha-em-fundo-branco-ia-generativa_35887-28623.jpg?w=740" }
        ];
        return (
          <div className="space-y-8 px-4 relative animate-fadeIn">
            <h2 className="text-2xl font-extrabold text-gray-900 text-center">{currentBlock.title}</h2>
            <div className="relative group">
              <div ref={socialProofScrollRef} className="flex overflow-x-auto gap-4 pb-4 snap-x no-scrollbar scroll-smooth">
                {testimonials.map((t, i) => (
                    <div key={i} className="min-w-[85%] snap-center bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
                       <div className="relative aspect-video bg-gray-50"><EditableImage src={t.img} blockId={180 + (i + 1)} isEditMode={isEditMode} adjustments={getAdj(180 + (i + 1))} onUpdate={(adj) => updateAdjustment(180 + (i + 1), adj)} /></div>
                       <div className="p-5 bg-white flex-1"><p className="text-gray-700 italic text-sm leading-snug">"{t.text}"</p><span className="block mt-3 font-black text-pink-600 text-xs uppercase tracking-tighter">- {t.name}, {t.age}</span></div>
                    </div>
                ))}
              </div>
            </div>
            <button onClick={() => { playSFX('click'); handleNext(); }} className="w-full py-5 bg-pink-600 text-white text-xl font-black rounded-3xl shadow-xl">QUIERO RESULTADOS ASÍ</button>
          </div>
        );

      case 'surprise':
        return (
          <div className="text-center space-y-8 py-12 px-4 animate-fadeIn">
            <div className="text-8xl animate-bounce">🎁</div>
            <h2 className="text-3xl font-extrabold text-gray-900">{currentBlock.title}</h2>
            <p className="text-lg text-gray-600">{currentBlock.description}</p>
            <button onClick={() => { playSFX('click'); handleNext(); }} className="w-full py-5 bg-pink-600 text-white text-xl font-black rounded-3xl shadow-xl">REVELAR SORPRESA</button>
          </div>
        );

      case 'roulette':
        return (
          <div className="text-center space-y-8 py-8 px-4 relative animate-fadeIn">
            <div className="space-y-2"><h2 className="text-3xl font-black text-gray-900 tracking-tight">{currentBlock.title}</h2><p className="text-gray-500 font-medium">{currentBlock.description}</p></div>
            <PremiumRoulette isSpinning={isSpinning} onFinish={onRouletteFinish} spinAttempt={spinAttempt} />
            {!isSpinning && !rouletteWon && spinAttempt === 1 && (<div className="pt-4"><button onClick={() => setIsSpinning(true)} className="w-full py-5 bg-pink-600 text-white text-xl font-black rounded-3xl shadow-xl animate-pulse-slow uppercase tracking-widest">¡Girar la Ruleta!</button></div>)}
            {rouletteWon ? (<div className="space-y-4 animate-fadeIn"><div className="bg-pink-50 border-2 border-pink-200 p-4 rounded-2xl"><h3 className="text-2xl font-black text-pink-600 leading-tight">¡FELICIDADES! ¡GANASTE EL PREMIO MÁXIMO (80% OFF)!</h3></div><button onClick={() => { playSFX('click'); handleNext(); }} className="w-full py-5 bg-pink-600 text-white text-xl font-black rounded-3xl shadow-xl flex items-center justify-center gap-3"><span>RECLAMAR AHORA</span><svg className="w-6 h-6 animate-bounce-x" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg></button></div>) : null}
            {showSecondChancePopup && (<div className="fixed inset-0 z-[300] flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-6 animate-fadeIn"><div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl border-4 border-pink-100 text-center space-y-8"><div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mx-auto"><span className="text-5xl">🥺</span></div><div className="space-y-3"><h3 className="text-2xl font-black text-gray-900 uppercase">Qué lástima...</h3><p className="text-gray-600 font-bold leading-relaxed text-lg">"Es una pena, pero voy a darte una segunda y última oportunidad"</p></div><button onClick={() => { playSFX('click'); setShowSecondChancePopup(false); setSpinAttempt(2); setTimeout(() => setIsSpinning(true), 100); }} className="w-full py-6 bg-pink-600 text-white text-xl font-black rounded-3xl shadow-xl animate-pulse-slow uppercase">¡Girar de Nuevo!</button></div></div>)}
          </div>
        );

      case 'offer':
        return (
          <div className="space-y-8 px-4 py-8 animate-fadeIn">
            {/* Blinking Badge */}
            <div className="flex justify-center -mb-4 relative z-10">
              <div className="bg-pink-600 text-white px-8 py-2.5 rounded-full text-sm font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(219,39,119,0.5)] animate-blink">
                CUPÓN 80% OFF ACTIVADO
              </div>
            </div>

            <div className="bg-white rounded-[3rem] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.1)] border-t-4 border-pink-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 transform rotate-12 scale-150 pointer-events-none">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"></path></svg>
              </div>

              <h2 className="text-2xl font-black text-gray-900 mb-8 text-center leading-tight">Tu Mejor Versión <span className="text-pink-600 block">Paquete Elite Activado</span></h2>
              
              <div className="space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-50 pb-2">Entregables del Programa:</p>
                {[
                  { title: "Consultoría Personalizada", desc: "Análisis individual de tu perfil", icon: "💎" },
                  { title: "Acceso a la Aplicación", desc: "Tus entrenamientos en la palma de tu mano", icon: "📱" },
                  { title: "Rutina de Entrenamientos", desc: "Adaptado a tu realidad", icon: "🏋️‍♀️" },
                  { title: "Personal 24h", desc: "Dudas y soporte en tiempo real", icon: "🤝" },
                  { title: "Plan Nutricional", desc: "Acelera tus resultados", icon: "🥗" },
                  { title: "Soporte Nutricional 24h", desc: "Acompañamiento profesional", icon: "✨" }
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 hover:border-pink-200 transition-colors group">
                        <div className="w-12 h-12 flex-shrink-0 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-gray-900 font-black text-sm">{item.title}</p>
                          <p className="text-gray-400 text-[10px] font-bold uppercase">{item.desc}</p>
                        </div>
                        <div className="ml-auto opacity-20 group-hover:opacity-100 transition-opacity">
                          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                        </div>
                    </div>
                ))}
              </div>

              <div className="mt-10 bg-gradient-to-br from-pink-50 to-white rounded-[2.5rem] p-8 border-2 border-pink-100 relative shadow-inner">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-4 py-0.5 rounded-full border border-pink-100 text-[9px] font-black text-pink-500 uppercase tracking-tighter shadow-sm">Oferta por Tiempo Limitado</div>
                <div className="text-center space-y-1">
                  <span className="block text-gray-400 line-through text-lg font-black opacity-50">$100 DÓLARES</span>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-2xl font-black text-pink-600">$</span>
                    <span className="text-7xl font-black text-pink-600 tracking-tighter animate-pulse-slow">20</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-2">Pago Único • Acceso de Por Vida</p>
                </div>
              </div>

              <button 
                onClick={() => {
                  playSFX('click');
                  setShowFinalOfferPopup(true);
                  addVitalityPoints(250);
                }} 
                className="w-full py-6 bg-pink-600 text-white text-xl font-black rounded-[2rem] shadow-[0_15px_40px_rgba(219,39,119,0.4)] mt-8 flex items-center justify-center gap-3 group active:scale-95 transition-all"
              >
                <span>SORPRESA IMPERDIBLE</span>
                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </button>
              
              <div className="mt-6 flex items-center justify-center gap-6 opacity-40 grayscale pointer-events-none">
                <img src="https://logodownload.org/wp-content/uploads/2014/10/visa-logo.png" className="h-4" />
                <img src="https://logodownload.org/wp-content/uploads/2014/07/mastercard-logo.png" className="h-6" />
                <img src="https://logodownload.org/wp-content/uploads/2019/06/apple-pay-logo.png" className="h-4" />
              </div>
            </div>

            {/* Final Surprise Popup */}
            {showFinalOfferPopup && (
              <div className="fixed inset-0 z-[400] flex items-center justify-center bg-gray-900/90 backdrop-blur-xl p-4 animate-fadeIn">
                <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 shadow-[0_40px_100px_rgba(0,0,0,0.5)] border-4 border-pink-100 text-center space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-pink-500"></div>
                  
                  <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mx-auto shadow-inner relative">
                    <span className="text-5xl animate-bounce">🎁</span>
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg">+{vitalityScore} PTS</div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-3xl font-black text-gray-900 leading-tight tracking-tight">¡TU PUNTAJE VALE DINERO!</h3>
                    <p className="text-gray-600 font-bold text-sm leading-relaxed px-2">
                      "Por tu excelente desempeño en las respuestas y por los <span className="text-pink-600 font-black">{vitalityScore} puntos</span> que acumulaste, el sistema convirtió tu puntaje en <span className="text-green-600 font-black">¡MÁS DESCUENTO!</span>"
                    </p>
                    <p className="bg-green-50 text-green-700 py-2 rounded-xl text-xs font-black uppercase border border-green-100">
                      Liberamos +$6 DÓLARES de descuento inmediato
                    </p>
                  </div>

                  <div className="bg-gray-900 py-6 rounded-3xl border-2 border-pink-500/30 shadow-2xl relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pink-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">La oferta expira en:</div>
                    <p className="text-4xl font-black text-white font-mono tracking-[0.2em] animate-pulse">
                      {formatTime(countdownTime)}
                    </p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <a 
                      href="https://pay.hotmart.com/O103512181Y"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        playSFX('click');
                        // Tracking: Clique no checkout
                        trackCheckoutClick(vitalityScore, currentBlock.id).catch(() => {});
                      }}
                      className="group relative w-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-pink-600 to-rose-500 p-1 shadow-[0_15px_35px_rgba(219,39,119,0.4)] transition-all duration-300 hover:scale-[1.03] active:scale-95 animate-pulse-slow text-center block"
                    >
                      {/* Shimmer Effect */}
                      <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                      
                      <div className="relative z-10 flex flex-col items-center justify-center bg-transparent py-4 px-6 text-white">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-0.5">Última Oportunidad</span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black tracking-tight uppercase">Obtener por solo $14</span>
                          <svg className="h-6 w-6 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                        </div>
                      </div>
                    </a>
                    
                    <button 
                      onClick={() => { playSFX('click'); setShowFinalOfferPopup(false); }}
                      className="text-[10px] text-gray-400 font-bold uppercase underline tracking-widest hover:text-pink-600 transition-colors block mx-auto"
                    >
                      No, prefiero pagar el precio de $20
                    </button>
                  </div>

                  <p className="text-[9px] text-gray-300 font-bold uppercase">🔒 Compra segura • Garantía de Satisfacción</p>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return <div>Fin del Embudo</div>;
    }
  };

  // Dashboard - Verifica hash para renderizar dashboard
  if (typeof window !== 'undefined' && window.location.hash === '#dashboard') {
    return <Dashboard />;
  }

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col pb-10 relative">
      <Header score={vitalityScore} animateScore={animateScore} lastPoints={lastPointsAdded} />
      <ProgressBar current={currentBlockIndex + 1} total={totalSteps} />
      <div className="flex justify-center items-center px-4 py-2 bg-pink-50/50 border-b border-pink-100">
        <span className="text-[10px] font-black text-pink-400 uppercase">Fase {currentBlockIndex < 14 ? 'Diagnóstico' : 'Resultados'}</span>
      </div>
      <main className="flex-1 overflow-y-auto pt-4 relative">{renderContent()}</main>
      {showConfetti && <ConfettiContainer />}
      {feedback && <FeedbackToast message={feedback} isMilestone={isMilestone} onComplete={() => { setFeedback(null); handleNext(); }} />}
    </div>
  );
};

export default App;
