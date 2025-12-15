import React, { useState, useEffect } from 'react';
import { Shield, Zap, Flame, Disc, Globe, Sun, RefreshCw, Skull, Trophy, Sword, Sparkles } from 'lucide-react';

// --- Game Constants ---

const MOVES = {
  LOAD: { 
    id: 'load', 
    name: 'Charge', 
    cost: 0, 
    type: 'utility', 
    icon: Zap, 
    color: 'text-yellow-400',
    bg: 'from-yellow-900/40 to-yellow-600/20',
    border: 'border-yellow-500/50',
    shadow: 'shadow-yellow-500/20',
    desc: 'Gain 1 Energy.' 
  },
  SHIELD: { 
    id: 'shield', 
    name: 'Shield', 
    cost: 0, 
    type: 'defense', 
    icon: Shield, 
    color: 'text-blue-400',
    bg: 'from-blue-900/40 to-blue-600/20',
    border: 'border-blue-500/50',
    shadow: 'shadow-blue-500/20',
    desc: 'Blocks Fireball & Beam.' 
  },
  FIREBALL: { 
    id: 'fireball', 
    name: 'Fireball', 
    cost: 1, 
    power: 1, 
    type: 'attack', 
    icon: Flame, 
    color: 'text-orange-500',
    bg: 'from-orange-900/40 to-red-600/20',
    border: 'border-orange-500/50',
    shadow: 'shadow-orange-500/20',
    desc: '1 Load. Blockable.' 
  },
  BEAM: { 
    id: 'beam', 
    name: 'Beam', 
    cost: 2, 
    power: 2, 
    type: 'attack', 
    icon: Sun, 
    color: 'text-cyan-400',
    bg: 'from-cyan-900/40 to-blue-600/20',
    border: 'border-cyan-500/50',
    shadow: 'shadow-cyan-500/20',
    desc: '2 Loads. Blockable.' 
  },
  REBOUND: { 
    id: 'rebound', 
    name: 'Rebound', 
    cost: 2, 
    type: 'counter', 
    icon: RefreshCw, 
    color: 'text-purple-400',
    bg: 'from-purple-900/40 to-fuchsia-600/20',
    border: 'border-purple-500/50',
    shadow: 'shadow-purple-500/20',
    desc: 'Reflects attacks.' 
  },
  DISC: { 
    id: 'disc', 
    name: 'Destructo', 
    cost: 3, 
    power: 3, 
    type: 'attack', 
    icon: Disc, 
    color: 'text-pink-500',
    bg: 'from-pink-900/40 to-rose-600/20',
    border: 'border-pink-500/50',
    shadow: 'shadow-pink-500/20',
    desc: 'Pierces Shield.' 
  },
  KAYOKEN: { 
    id: 'kayoken', 
    name: 'Kayoken', 
    cost: 0, 
    req: 4,
    type: 'special', 
    icon: Sparkles, 
    color: 'text-red-500',
    bg: 'from-red-900/40 to-orange-600/20',
    border: 'border-red-500/50',
    shadow: 'shadow-red-500/20',
    desc: 'Dodge + 3 Energy.' 
  },
  SPIRIT: { 
    id: 'spirit', 
    name: 'Spirit Bomb', 
    cost: 5, 
    power: 5, 
    type: 'attack', 
    icon: Globe, 
    color: 'text-sky-400',
    bg: 'from-sky-900/40 to-indigo-600/20',
    border: 'border-sky-500/50',
    shadow: 'shadow-sky-500/20',
    desc: 'Massive Damage.' 
  },
  DRAGON: { 
    id: 'dragon', 
    name: 'Dragon Fist', 
    cost: 8, 
    power: 8, 
    type: 'attack', 
    icon: Trophy, 
    color: 'text-amber-400',
    bg: 'from-amber-900/40 to-yellow-600/20',
    border: 'border-amber-500/50',
    shadow: 'shadow-amber-500/20',
    desc: 'Wins Game.' 
  }
};

const INITIAL_ENERGY = 0;

function WizBattles() {
  const [gameState, setGameState] = useState('menu'); // menu, playing, resolution, gameover
  const [p1Energy, setP1Energy] = useState(INITIAL_ENERGY);
  const [p2Energy, setP2Energy] = useState(INITIAL_ENERGY);
  const [p1Move, setP1Move] = useState(null);
  const [p2Move, setP2Move] = useState(null);
  const [message, setMessage] = useState("Ready to Fight!");
  const [winner, setWinner] = useState(null);
  const [history, setHistory] = useState([]);
  const [wins, setWins] = useState({ p1: 0, p2: 0 }); // Win Counter

  // CPU Logic
  const getCPUMove = (cpuEnergy, playerEnergy) => {
    let availableMoves = Object.values(MOVES).filter(m => {
      if (m.id === 'kayoken') return cpuEnergy >= m.req;
      return cpuEnergy >= m.cost;
    });

    const random = Math.random();
    
    // 1. If can win with Dragon Fist, do it
    if (cpuEnergy >= 8) return MOVES.DRAGON;

    // 2. If threatened by high energy player, high chance to Rebound or Kayoken
    if (playerEnergy >= 3 && cpuEnergy >= 2 && random > 0.4) {
      if (cpuEnergy >= 4 && random > 0.7) return MOVES.KAYOKEN;
      const hasRebound = availableMoves.find(m => m.id === 'rebound');
      if (hasRebound) return MOVES.REBOUND;
    }

    // 3. If player is likely to load (low energy), attack!
    if (playerEnergy === 0 && cpuEnergy >= 1 && random > 0.3) {
       const attacks = availableMoves.filter(m => m.type === 'attack').sort((a,b) => b.power - a.power);
       if (attacks.length > 0) return attacks[0];
    }

    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  };

  const handlePlayerMove = (moveKey) => {
    if (gameState !== 'playing') return;

    const move = MOVES[moveKey];
    setP1Move(move);
    
    const cpuMove = getCPUMove(p2Energy, p1Energy);
    setP2Move(cpuMove);

    setGameState('resolution');
  };

  // Resolution Loop
  useEffect(() => {
    if (gameState === 'resolution') {
      const timer = setTimeout(() => {
        resolveTurn();
      }, 2500); 
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  const resolveTurn = () => {
    let p1Death = false;
    let p2Death = false;
    let msg = "";
    let p1NetEnergy = 0;
    let p2NetEnergy = 0;

    // Deduct Costs
    if (p1Move.id === 'load') p1NetEnergy += 1;
    else if (p1Move.id === 'kayoken') p1NetEnergy += 3;
    else p1NetEnergy -= p1Move.cost;

    if (p2Move.id === 'load') p2NetEnergy += 1;
    else if (p2Move.id === 'kayoken') p2NetEnergy += 3;
    else p2NetEnergy -= p2Move.cost;

    const p1IsAttack = p1Move.type === 'attack';
    const p2IsAttack = p2Move.type === 'attack';

    // Interaction Logic
    if (p1IsAttack && p2IsAttack) {
      if (p1Move.power === p2Move.power) {
        msg = "CLASH! Both attacks cancel out!";
      } else if (p1Move.power > p2Move.power) {
        msg = `${p1Move.name} OVERPOWERS ${p2Move.name}! P2 Dies!`;
        p2Death = true;
      } else {
        msg = `${p2Move.name} OVERPOWERS ${p1Move.name}! P1 Dies!`;
        p1Death = true;
      }
    }
    else if (p1IsAttack) {
      if (p2Move.id === 'kayoken') {
        msg = "P2 uses Kayoken! Dodges everything!";
      } else if (p2Move.id === 'rebound') {
        if (p1Move.id === 'dragon') {
          msg = "Dragon Fist cannot be Rebounded! P2 Dies!";
          p2Death = true;
        } else {
          msg = `P2 Rebounds the ${p1Move.name}! P1 Dies!`;
          p1Death = true;
        }
      } else if (p2Move.id === 'shield') {
        if (p1Move.power > 2) {
          msg = `${p1Move.name} breaks the Shield! P2 Dies!`;
          p2Death = true;
        } else {
          msg = "Shield blocks the attack!";
        }
      } else {
        msg = `Direct hit with ${p1Move.name}! P2 Dies!`;
        p2Death = true;
      }
    }
    else if (p2IsAttack) {
      if (p1Move.id === 'kayoken') {
        msg = "P1 uses Kayoken! Dodges everything!";
      } else if (p1Move.id === 'rebound') {
        if (p2Move.id === 'dragon') {
          msg = "Dragon Fist cannot be Rebounded! P1 Dies!";
          p1Death = true;
        } else {
          msg = `P1 Rebounds the ${p2Move.name}! P2 Dies!`;
          p2Death = true;
        }
      } else if (p1Move.id === 'shield') {
        if (p2Move.power > 2) {
          msg = `${p2Move.name} breaks the Shield! P1 Dies!`;
          p1Death = true;
        } else {
          msg = "Shield blocks the attack!";
        }
      } else {
        msg = `Direct hit with ${p2Move.name}! P1 Dies!`;
        p1Death = true;
      }
    }
    else {
      msg = "Strategic pause...";
      if (p1Move.id === 'load' && p2Move.id === 'load') msg = "Energy crackles as both charge!";
      if (p1Move.id === 'shield' && p2Move.id === 'shield') msg = "Defensive stalemate.";
      if (p1Move.id === 'kayoken' || p2Move.id === 'kayoken') msg = "Aura intensifies!";
    }

    // Apply State
    const nextP1Energy = Math.max(0, p1Energy + p1NetEnergy);
    const nextP2Energy = Math.max(0, p2Energy + p2NetEnergy);

    setP1Energy(nextP1Energy);
    setP2Energy(nextP2Energy);
    setMessage(msg);
    setHistory(prev => [{ p1: p1Move, p2: p2Move, result: msg }, ...prev].slice(0, 5));

    if (p1Death && p2Death) {
      setWinner('draw');
      setGameState('gameover');
    } else if (p1Death) {
      setWinner('p2');
      setWins(prev => ({...prev, p2: prev.p2 + 1}));
      setGameState('gameover');
    } else if (p2Death) {
      setWinner('p1');
      setWins(prev => ({...prev, p1: prev.p1 + 1}));
      setGameState('gameover');
    } else {
      setGameState('playing');
      setP1Move(null);
      setP2Move(null);
    }
  };

  const restartGame = () => {
    setP1Energy(INITIAL_ENERGY);
    setP2Energy(INITIAL_ENERGY);
    setP1Move(null);
    setP2Move(null);
    setMessage("Ready to Fight!");
    setWinner(null);
    setHistory([]);
    setGameState('playing');
  };

  const renderCard = (moveKey) => {
    const move = MOVES[moveKey];
    const canAfford = move.id === 'kayoken' ? p1Energy >= move.req : p1Energy >= move.cost;
    
    return (
      <button
        key={move.id}
        disabled={!canAfford || gameState !== 'playing'}
        onClick={() => handlePlayerMove(moveKey)}
        className={`
          group relative flex flex-col items-center justify-between p-2 rounded-lg border transition-all duration-300
          ${move.shadow}
          ${!canAfford ? 'opacity-40 grayscale scale-95' : 'hover:scale-[1.02] hover:shadow-lg cursor-pointer bg-gradient-to-br ' + move.bg + ' ' + move.border}
          ${gameState === 'playing' ? 'bg-slate-800/50' : 'bg-slate-900'}
        `}
      >
        <div className={`p-1.5 rounded-full bg-slate-900/50 mb-0.5 group-hover:bg-slate-900/80 transition-colors ${move.color}`}>
            <move.icon size={20} />
        </div>
        <div className="text-center w-full">
            <span className={`font-bold text-[10px] md:text-xs block ${move.color}`}>{move.name}</span>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-500/50 to-transparent my-0.5"></div>
            <span className="hidden md:block text-[9px] text-slate-300 leading-tight">{move.desc}</span>
        </div>
        
        {/* Cost Badge */}
        <div className="absolute -top-1 -right-1 bg-slate-900 border border-slate-600 rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
            {move.req ? '4+' : move.cost}
        </div>
      </button>
    );
  };

  return (
    // Main Container: h-screen and overflow-hidden ensures no scrolling
    <div className="h-screen max-h-screen w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black text-white font-sans selection:bg-purple-500 flex flex-col items-center overflow-hidden">
      
      {/* Cinematic Background Particles */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
      </div>

      {/* Header */}
      <div className="w-full shrink-0 bg-slate-900/50 backdrop-blur-md border-b border-white/10 p-3 flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-600 p-1.5 rounded-lg shadow-lg shadow-orange-500/20">
            <Zap className="text-white" size={16} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase italic bg-gradient-to-r from-yellow-100 via-white to-blue-200 bg-clip-text text-transparent leading-none">
                Wiz Battles
            </h1>
          </div>
        </div>

        {/* Score Counter */}
        <div className="flex items-center gap-4 bg-slate-950/50 px-4 py-1 rounded-full border border-white/5">
             <div className="flex flex-col items-center">
                 <span className="text-[10px] text-blue-400 font-bold uppercase">You</span>
                 <span className="text-lg font-black text-white leading-none">{wins.p1}</span>
             </div>
             <div className="text-slate-600 font-thin text-xl">:</div>
             <div className="flex flex-col items-center">
                 <span className="text-[10px] text-red-400 font-bold uppercase">CPU</span>
                 <span className="text-lg font-black text-white leading-none">{wins.p2}</span>
             </div>
        </div>

        {gameState !== 'menu' ? (
            <button onClick={restartGame} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Reset Game">
                <RefreshCw size={16} className="text-slate-400" />
            </button>
        ) : <div className="w-8"></div>}
      </div>

      {/* Main Arena: Flex-1 ensures it fills space between header and controls */}
      <div className="flex-1 w-full max-w-5xl flex flex-col relative z-0 justify-evenly py-2 px-4">
          
          {/* --- OPPONENT (Top) --- */}
          <div className="flex flex-col items-center relative w-full shrink-0">
            <div className="relative group">
                <div className={`absolute -inset-4 bg-red-500/20 rounded-full blur-xl transition-all duration-700 ${p2Energy > 4 ? 'opacity-100 scale-110' : 'opacity-0'}`}></div>
                
                <div className={`
                relative w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 shadow-2xl
                ${gameState === 'resolution' && p2Move?.type === 'attack' ? 'scale-110 border-red-400 shadow-[0_0_50px_rgba(239,68,68,0.4)]' : 'border-slate-700 bg-slate-800'}
                ${winner === 'p2' ? 'border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.5)]' : ''}
                `}>
                {winner === 'p2' ? <Trophy size={40} className="text-yellow-400 animate-bounce" /> : <Skull size={40} className="text-red-400/80" />}
                </div>

                {/* Move Bubble */}
                <div className={`absolute -right-24 top-1/2 -translate-y-1/2 transition-all duration-500 ${gameState === 'resolution' || gameState === 'gameover' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                    {p2Move && (
                        <div className="bg-slate-800 border border-slate-600 px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-2">
                            <p2Move.icon size={16} className={p2Move.color} />
                            <span className="font-bold text-white text-sm">{p2Move.name}</span>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="mt-2 flex items-center gap-2 bg-slate-900/80 px-3 py-1 rounded-full border border-white/5">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Dark Wizard</span>
                <div className="w-px h-2 bg-white/20"></div>
                <div className="flex gap-0.5">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${i < p2Energy ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-slate-800'}`} />
                ))}
                </div>
            </div>
          </div>

          {/* --- CENTER STAGE (Messages) --- */}
          <div className="w-full flex justify-center perspective-[1000px] shrink-0 my-2">
             <div className={`
                transition-all duration-500 transform
                ${gameState === 'resolution' ? 'scale-110' : 'scale-100'}
             `}>
                <div className="px-6 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl text-center min-w-[280px] max-w-md">
                    {gameState === 'playing' ? (
                          <div className="flex items-center justify-center gap-2 text-blue-200/80 animate-pulse">
                            <Sword size={14} />
                            <span className="text-xs font-bold tracking-widest uppercase">Choose your move</span>
                          </div>
                    ) : (
                        <div className="space-y-1">
                            <span className={`text-lg md:text-xl font-black italic bg-gradient-to-r from-yellow-200 to-white bg-clip-text text-transparent drop-shadow-md leading-tight`}>
                            {message}
                            </span>
                        </div>
                    )}
                </div>
             </div>
          </div>

          {/* --- PLAYER (Bottom) --- */}
          <div className="flex flex-col items-center relative w-full shrink-0">
            <div className="mb-2 flex items-center gap-2 bg-slate-900/80 px-3 py-1 rounded-full border border-white/5">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">You</span>
                <div className="w-px h-2 bg-white/20"></div>
                <div className="flex gap-0.5">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className={`h-2 w-2 rounded-[2px] transition-all duration-300 ${i < p1Energy ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] scale-110' : 'bg-slate-800'}`} />
                ))}
                </div>
                <span className="text-[10px] text-slate-500 ml-1 font-mono">{p1Energy}/8</span>
            </div>

            <div className="relative group">
                 <div className={`absolute -inset-4 bg-cyan-500/20 rounded-full blur-xl transition-all duration-700 ${p1Energy > 4 ? 'opacity-100 scale-110' : 'opacity-0'}`}></div>

                <div className={`
                relative w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 shadow-2xl z-10
                ${gameState === 'resolution' && p1Move?.type === 'attack' ? 'scale-110 border-cyan-400 shadow-[0_0_50px_rgba(34,211,238,0.4)]' : 'border-slate-600 bg-slate-800'}
                ${winner === 'p1' ? 'border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.5)]' : ''}
                `}>
                {winner === 'p1' ? <Trophy size={40} className="text-yellow-400 animate-bounce" /> : <div className="text-cyan-400 text-xl font-black tracking-tighter">HERO</div>}
                </div>

                 <div className={`absolute -right-24 top-1/2 -translate-y-1/2 transition-all duration-500 z-20 ${gameState === 'resolution' || gameState === 'gameover' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                    {p1Move && (
                        <div className="bg-slate-800 border border-slate-600 px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-2">
                            <p1Move.icon size={16} className={p1Move.color} />
                            <span className="font-bold text-white text-sm">{p1Move.name}</span>
                        </div>
                    )}
                </div>
            </div>
            
          </div>
      </div>

      {/* Controls Grid - Compact */}
      <div className="w-full shrink-0 bg-black/60 backdrop-blur-xl p-3 md:p-6 rounded-t-[2rem] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20 relative">
        {gameState === 'gameover' ? (
          <div className="flex flex-col items-center justify-center py-4 space-y-3">
             <div className="text-2xl font-bold text-white">
                {winner === 'p1' ? 'VICTORY!' : winner === 'p2' ? 'DEFEATED' : 'DRAW'}
             </div>
            <button 
              onClick={restartGame}
              className="bg-white text-slate-950 px-8 py-3 rounded-full font-bold text-sm hover:scale-105 transition-all flex items-center gap-2"
            >
              <RefreshCw size={20} /> Play Again
            </button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-9 gap-1.5 md:gap-2">
                  {Object.keys(MOVES).map(key => renderCard(key))}
              </div>
          </div>
        )}
      </div>

      {/* Start Screen Overlay */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 bg-slate-950 z-50 flex flex-col items-center justify-center p-8 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950"></div>
          
          <div className="relative z-10 max-w-2xl">
             <div className="mb-6 flex justify-center">
                <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl rotate-3">
                    <Zap size={64} className="text-white" />
                </div>
             </div>
            <h1 className="text-5xl md:text-7xl font-black italic bg-gradient-to-r from-blue-300 via-white to-purple-300 bg-clip-text text-transparent mb-6 drop-shadow-2xl">
                WIZ BATTLES
            </h1>
            <p className="text-slate-400 text-lg md:text-xl mb-10 leading-relaxed font-light">
                Master the elements. Anticipate your enemy. <br/>
                <span className="text-white font-medium">Charge</span> to power up. <span className="text-red-400 font-medium">Attack</span> to kill. <span className="text-blue-400 font-medium">Shield</span> to survive.
            </p>
            <button 
                onClick={restartGame}
                className="group relative px-12 py-5 bg-white text-slate-900 rounded-full font-black text-xl transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
            >
                ENTER ARENA
            </button>
          </div>
        </div>
      )}

      {/* Compact History Log - Hidden on small screens to save space */}
      <div className="absolute top-20 right-4 w-56 hidden lg:block pointer-events-none">
        <div className="space-y-1">
          {history.map((turn, i) => (
            <div key={i} className="bg-slate-900/80 backdrop-blur border border-slate-700/50 p-2 rounded text-[10px] shadow-lg animate-in slide-in-from-right fade-in duration-500">
              <div className="flex justify-between mb-0.5 font-bold">
                <span className="text-cyan-300">{turn.p1.name}</span>
                <span className="text-slate-500 uppercase">vs</span>
                <span className="text-red-300">{turn.p2.name}</span>
              </div>
              <div className="text-slate-300 leading-tight">{turn.result}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default function App() {
  return (
    <WizBattles />
  );
}