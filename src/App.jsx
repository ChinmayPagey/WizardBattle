import React, { useState, useEffect } from 'react';
import { Shield, Zap, Flame, Disc, Globe, Sun, RefreshCw, Skull, Trophy, Sparkles, Swords, User, Globe as GlobeIcon } from 'lucide-react';
import io from 'socket.io-client';

// --- CONFIGURATION ---
const BACKEND_URL = import.meta.env.PROD 
  ? "https://wizbattle.onrender.com/" 
  : "http://localhost:3001";

const socket = io.connect(BACKEND_URL);

// --- ASSETS & DATA ---
// Updated colors for more vibrancy against dark backgrounds
const MOVES = {
  LOAD: { id: 'load', name: 'Charge', cost: 0, type: 'utility', icon: Zap, color: 'text-yellow-300', bg: 'from-yellow-600/80 to-amber-800/60', border: 'border-yellow-400/80', shadow: 'shadow-yellow-500/50', desc: 'Gain 1 Energy.' },
  SHIELD: { id: 'shield', name: 'Shield', cost: 0, type: 'defense', icon: Shield, color: 'text-blue-300', bg: 'from-blue-600/80 to-indigo-800/60', border: 'border-blue-400/80', shadow: 'shadow-blue-500/50', desc: 'Blocks Fireball & Beam.' },
  FIREBALL: { id: 'fireball', name: 'Fireball', cost: 1, power: 1, type: 'attack', icon: Flame, color: 'text-orange-300', bg: 'from-orange-600/80 to-red-800/60', border: 'border-orange-400/80', shadow: 'shadow-orange-500/50', desc: '1 Load. Blockable.' },
  BEAM: { id: 'beam', name: 'Beam', cost: 2, power: 2, type: 'attack', icon: Sun, color: 'text-cyan-300', bg: 'from-cyan-600/80 to-blue-800/60', border: 'border-cyan-400/80', shadow: 'shadow-cyan-500/50', desc: '2 Loads. Blockable.' },
  REBOUND: { id: 'rebound', name: 'Rebound', cost: 2, type: 'counter', icon: RefreshCw, color: 'text-purple-300', bg: 'from-purple-600/80 to-fuchsia-800/60', border: 'border-purple-400/80', shadow: 'shadow-purple-500/50', desc: 'Reflects attacks.' },
  DISC: { id: 'disc', name: 'Destructo', cost: 3, power: 3, type: 'attack', icon: Disc, color: 'text-pink-300', bg: 'from-pink-600/80 to-rose-800/60', border: 'border-pink-400/80', shadow: 'shadow-pink-500/50', desc: 'Pierces Shield.' },
  KAYOKEN: { id: 'kayoken', name: 'Kayoken', cost: 0, req: 4, type: 'special', icon: Sparkles, color: 'text-red-300', bg: 'from-red-700/90 to-orange-800/70', border: 'border-red-500/80', shadow: 'shadow-red-600/60', desc: 'Dodge + 3 Energy.' },
  SPIRIT: { id: 'spirit', name: 'Spirit Bomb', cost: 5, power: 5, type: 'attack', icon: Globe, color: 'text-sky-300', bg: 'from-sky-600/80 to-indigo-900/70', border: 'border-sky-400/80', shadow: 'shadow-sky-500/60', desc: 'Massive Damage.' },
  DRAGON: { id: 'dragon', name: 'Dragon Fist', cost: 8, power: 8, type: 'attack', icon: Trophy, color: 'text-amber-200', bg: 'from-amber-500/90 to-yellow-800/80', border: 'border-amber-300/90', shadow: 'shadow-amber-400/70', desc: 'Wins Game.' }
};

const INITIAL_ENERGY = 0;

// --- CSS STYLES FOR NEW ANIMATIONS ---
const styles = `
  /* Background drifting particles */
  @keyframes drift {
    0% { transform: translateY(0px); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(-800px); opacity: 0; }
  }
  .particle {
    position: absolute;
    background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
    border-radius: 50%;
    bottom: -20px;
    animation: drift infinite linear;
  }
    
  /* Projectile Animations */
  @keyframes shoot-up-intense {
    0% { transform: translateY(0) scale(0.5); opacity: 0.5; filter: brightness(1); }
    20% { opacity: 1; }
    100% { transform: translateY(-350px) scale(2); opacity: 0; filter: brightness(3); }
  }
  @keyframes shoot-down-intense {
    0% { transform: translateY(0) scale(0.5); opacity: 0.5; filter: brightness(1); }
    20% { opacity: 1; }
    100% { transform: translateY(350px) scale(2); opacity: 0; filter: brightness(3); }
  }
  
  /* Impact Effects */
  @keyframes clash-boom-intense {
    0% { transform: scale(0) rotate(0deg); opacity: 1; filter: brightness(1); }
    50% { transform: scale(3) rotate(180deg); opacity: 1; filter: brightness(5); }
    100% { transform: scale(4) rotate(360deg); opacity: 0; }
  }
  @keyframes screen-shake {
    0% { transform: translate(0,0); }
    25% { transform: translate(-5px, 5px); }
    50% { transform: translate(5px, -5px); }
    75% { transform: translate(-5px, -5px); }
    100% { transform: translate(0,0); }
  }

  /* Player Status Effects */
  @keyframes shield-pulse-intense {
    0% { transform: scale(1); opacity: 0.3; box-shadow: 0 0 20px inset #3b82f6; }
    50% { transform: scale(1.15); opacity: 0.7; box-shadow: 0 0 40px inset #60a5fa; }
    100% { transform: scale(1); opacity: 0.3; box-shadow: 0 0 20px inset #3b82f6; }
  }
  @keyframes aura-glow-intense {
    0% { box-shadow: 0 0 0px rgba(234, 179, 8, 0), 0 0 10px inset rgba(234, 179, 8, 0.2); }
    50% { box-shadow: 0 0 50px rgba(234, 179, 8, 0.8), 0 0 30px inset rgba(234, 179, 8, 0.6); border-color: rgba(253, 224, 71, 1); }
    100% { box-shadow: 0 0 0px rgba(234, 179, 8, 0), 0 0 10px inset rgba(234, 179, 8, 0.2); }
  }
  @keyframes crystal-charge {
    0% { filter: brightness(1); }
    50% { filter: brightness(1.5) drop-shadow(0 0 5px currentColor); }
    100% { filter: brightness(1); }
  }
`;

function WizBattles() {
  const [room, setRoom] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [joined, setJoined] = useState(false);
  
  const [myRole, setMyRole] = useState(null); 
  const [gameState, setGameState] = useState('menu'); 
  const [p1Energy, setP1Energy] = useState(INITIAL_ENERGY);
  const [p2Energy, setP2Energy] = useState(INITIAL_ENERGY);
  const [p1Move, setP1Move] = useState(null);
  const [p2Move, setP2Move] = useState(null);
  const [message, setMessage] = useState("Waiting for players...");
  const [winner, setWinner] = useState(null);
  const [wins, setWins] = useState({ p1: 0, p2: 0 });
  const [triggerShake, setTriggerShake] = useState(false); // New state for impact effect
  
  // Names state
  const [p1Name, setP1Name] = useState("Player 1");
  const [p2Name, setP2Name] = useState("Player 2");

  useEffect(() => {
    socket.on("player_assignment", (role) => {
        setMyRole(role);
        if (role === 'p1') setMessage("Waiting for an opponent to enter the arena...");
    });

    socket.on("game_start", () => {
        setMessage("BATTLE COMMENCING! Select your spell!");
        setGameState('playing');
    });

    socket.on("room_full", () => {
        alert("Room Full!");
        setJoined(false);
    });

    socket.on("player_disconnected", () => {
        alert("Opponent Fled the Battle.");
        window.location.reload();
    });

    socket.on("waiting_for_opponent", () => {
        setMessage("Spell Locked. Awaiting opponent's move...");
        setGameState('waiting');
    });

    socket.on("round_complete", (data) => {
        const move1 = MOVES[data.p1Move.id.toUpperCase()];
        const move2 = MOVES[data.p2Move.id.toUpperCase()];
        const name1 = data.p1Move.playerName || "Player 1";
        const name2 = data.p2Move.playerName || "Player 2";
        
        setP1Name(name1);
        setP2Name(name2);
        setP1Move(move1);
        setP2Move(move2);
        
        setGameState('resolution');
        setMessage("Resolving Spells..."); 

        // Trigger screen shake if there's an impact
        if ((move1.type === 'attack' || move2.type === 'attack')) {
            setTimeout(() => { setTriggerShake(true); }, 900); // Sync with projectile hit
            setTimeout(() => { setTriggerShake(false); }, 1400);
        }
        
        setTimeout(() => {
            resolveTurn(move1, move2, name1, name2);
        }, 1500); 
    });

    return () => {
        socket.off("player_assignment");
        socket.off("game_start");
        socket.off("round_complete");
        socket.off("waiting_for_opponent");
        socket.off("player_disconnected");
    }
  }, []);

  const joinRoom = () => {
    if (room !== "" && playerName !== "") {
      socket.emit("join_room", room);
      if (myRole === 'p1') setP1Name(playerName);
      if (myRole === 'p2') setP2Name(playerName);
      setJoined(true);
    } else {
        alert("Enter your Wizard Name and Room Code.");
    }
  };

  const sendMove = (moveKey) => {
    if (gameState !== 'playing') return;
    const move = MOVES[moveKey];
    socket.emit("send_move", { room, move: { ...move, playerName }, player: myRole });
    setMessage("Casting spell... awaiting response.");
  };

  const resolveTurn = (move1, move2, name1, name2) => {
    let p1Death = false;
    let p2Death = false;
    let msg = "";
    let p1Net = 0;
    let p2Net = 0;

    // Costs
    if (move1.id === 'load') p1Net += 1;
    else if (move1.id === 'kayoken') p1Net += 3;
    else p1Net -= move1.cost;

    if (move2.id === 'load') p2Net += 1;
    else if (move2.id === 'kayoken') p2Net += 3;
    else p2Net -= move2.cost;

    // Combat Logic
    const p1Atk = move1.type === 'attack';
    const p2Atk = move2.type === 'attack';

    // Scenario 1: Both Attack
    if (p1Atk && p2Atk) {
        if (move1.power === move2.power) {
            msg = `ARCANE CLASH! ${name1} and ${name2}'s spells obliterated each other!`;
        } else if (move1.power > move2.power) {
            msg = `${name1}'s ${move1.name} overpowered ${name2}'s defense!`;
            p2Death = true;
        } else {
            msg = `${name2}'s ${move2.name} overpowered ${name1}'s defense!`;
            p1Death = true;
        }
    } 
    // Scenario 2: P1 Attacks
    else if (p1Atk) {
        if (move2.id === 'kayoken') msg = `${name2} vanished using Kayoken, dodging the ${move1.name}!`;
        else if (move2.id === 'rebound') {
            if (move1.id === 'dragon') { msg = `Dragon Fist shattered the Rebound! ${name2} is oblivious!`; p2Death = true; }
            else { msg = `${name2} Rebounded ${name1}'s spell back at them!`; p1Death = true; }
        } else if (move2.id === 'shield') {
            if (move1.power > 2) { msg = `CRITICAL BREAK! ${name1} shattered ${name2}'s Shield!`; p2Death = true; }
            else msg = `${name2}'s Shield held against the blast.`;
        } else { msg = `DIRECT HIT! ${name1} annihilated ${name2} with ${move1.name}!`; p2Death = true; }
    } 
    // Scenario 3: P2 Attacks
    else if (p2Atk) {
        if (move1.id === 'kayoken') msg = `${name1} vanished using Kayoken, dodging the ${move2.name}!`;
        else if (move1.id === 'rebound') {
            if (move2.id === 'dragon') { msg = `Dragon Fist shattered the Rebound! ${name1} is oblivious!`; p1Death = true; }
            else { msg = `${name1} Rebounded ${name2}'s spell back at them!`; p2Death = true; }
        } else if (move1.id === 'shield') {
            if (move2.power > 2) { msg = `CRITICAL BREAK! ${name2} shattered ${name1}'s Shield!`; p1Death = true; }
            else msg = `${name1}'s Shield held against the blast.`;
        } else { msg = `DIRECT HIT! ${name2} annihilated ${name1} with ${move2.name}!`; p1Death = true; }
    } 
    // Scenario 4: Passive
    else {
        msg = `The air crackles as ${name1} and ${name2} gather arcane power...`;
    }

    setP1Energy(prev => Math.max(0, prev + p1Net));
    setP2Energy(prev => Math.max(0, prev + p2Net));
    setMessage(msg);

    if (p1Death || p2Death) {
        setGameState('gameover');
        if (p1Death && p2Death) setWinner('draw');
        else if (p1Death) { setWinner('p2'); setWins(w => ({...w, p2: w.p2+1})); }
        else { setWinner('p1'); setWins(w => ({...w, p1: w.p1+1})); }
    } else {
        setTimeout(() => {
            setGameState('playing');
            setP1Move(null);
            setP2Move(null);
            setMessage("Select your next spell!");
        }, 3500);
    }
  };

  const restartGame = () => {
    setGameState('playing');
    setP1Energy(0);
    setP2Energy(0);
    setP1Move(null);
    setP2Move(null);
    setWinner(null);
    setMessage("The Arena Resets!");
  };

  const renderCard = (moveKey) => {
    const move = MOVES[moveKey];
    const myEnergy = myRole === 'p1' ? p1Energy : p2Energy;
    const canAfford = move.id === 'kayoken' ? myEnergy >= move.req : myEnergy >= move.cost;
    
    // New Card Style: "Rune Stone" look
    return (
      <button
        key={move.id}
        disabled={!canAfford || gameState !== 'playing'}
        onClick={() => sendMove(moveKey)}
        className={`
          group relative flex flex-col items-center justify-between p-2 rounded-xl border-2 transition-all duration-300 overflow-hidden
          ${!canAfford ? 'opacity-50 grayscale scale-95 border-slate-700 bg-slate-900/80' : `hover:-translate-y-2 hover:shadow-[0_0_20px_rgba(var(--tw-shadow-color),0.6)] cursor-pointer bg-gradient-to-br ${move.bg} ${move.border} ${move.shadow}`}
          ${gameState === 'playing' ? 'backdrop-blur-md' : 'bg-slate-950/90'}
        `}
      >
        {/* Internal Glow effect on hover */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity bg-gradient-to-t ${move.bg} blur-xl`}></div>

        <div className={`relative z-10 p-2 rounded-full bg-black/40 mb-1 ${move.color} border border-white/10 shadow-inner`}>
            <move.icon size={22} className="drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
        </div>
        <span className={`relative z-10 font-black text-[10px] md:text-xs uppercase tracking-wider block ${move.color} drop-shadow-sm`}>{move.name}</span>
        
        {/* Cost Indicator */}
        <div className={`absolute top-0 right-0 rounded-bl-lg px-1.5 py-0.5 text-[10px] font-black text-white flex items-center justify-center border-l border-b border-white/20
            ${move.req ? 'bg-red-900/80 text-red-200' : (move.cost > 0 ? 'bg-blue-900/80 text-blue-200' : 'bg-slate-800/80 text-slate-300')}
        `}>
            {move.req ? 'REQ: 4+' : (move.cost === 0 ? 'FREE' : move.cost)}
        </div>
      </button>
    );
  };

  // --- JOIN SCREEN ---
  if (!joined) {
    return (
        <div className="h-screen w-full bg-[#050a18] flex flex-col items-center justify-center text-white relative overflow-hidden font-sans">
            {/* Background VFX */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_var(--tw-gradient-stops))] from-purple-900/40 via-[#050a18] to-black z-0"></div>
            <div className="absolute inset-0 opacity-30">
                 {[...Array(20)].map((_, i) => (
                    <div key={i} className="particle" style={{ left: `${Math.random()*100}%`, width: `${Math.random()*4+1}px`, height: `${Math.random()*4+1}px`, animationDuration: `${Math.random()*10+5}s`, animationDelay: `-${Math.random()*10}s` }}></div>
                 ))}
            </div>

            <div className="z-10 flex flex-col items-center gap-8 scale-110">
                <div className="mb-2 text-center relative">
                    <h1 className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-orange-500 to-red-600 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] tracking-tighter">WIZ BATTLES</h1>
                    <p className="text-blue-300 font-bold tracking-[0.3em] mt-2 text-sm uppercase drop-shadow-lg border-b-2 border-blue-500/50 pb-2 inline-block">Arcane Arena</p>
                    <div className="absolute -inset-10 bg-orange-500/20 blur-3xl -z-10 rounded-full animate-pulse"></div>
                </div>
                
                <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl border-2 border-indigo-500/50 shadow-[0_0_50px_rgba(79,70,229,0.3)] flex flex-col gap-6 w-[380px] relative overflow-hidden">
                    {/* Container internal glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/0 pointer-events-none"></div>
                    
                    <div className="flex flex-col gap-2 relative z-10">
                        <label className="text-xs text-indigo-300 font-black uppercase ml-1 tracking-wider">Wizard Name</label>
                        <div className="group flex items-center gap-3 bg-[#0a0f20] border-2 border-slate-700 p-4 rounded-xl focus-within:border-indigo-400 focus-within:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all">
                            <User size={20} className="text-indigo-500 group-focus-within:text-indigo-300 transition-colors" />
                            <input 
                                placeholder="e.g. Gandalf The Grey" 
                                className="bg-transparent text-lg text-white outline-none w-full font-bold placeholder:text-slate-600 placeholder:font-medium"
                                onChange={(e) => setPlayerName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 relative z-10">
                        <label className="text-xs text-indigo-300 font-black uppercase ml-1 tracking-wider">Arena Code</label>
                        <div className="group flex items-center gap-3 bg-[#0a0f20] border-2 border-slate-700 p-4 rounded-xl focus-within:border-indigo-400 focus-within:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all">
                            <GlobeIcon size={20} className="text-indigo-500 group-focus-within:text-indigo-300 transition-colors" />
                            <input 
                                placeholder="e.g. battle123" 
                                className="bg-transparent text-lg text-white outline-none w-full font-bold placeholder:text-slate-600 placeholder:font-medium"
                                onChange={(e) => setRoom(e.target.value)}
                            />
                        </div>
                    </div>

                    <button 
                        onClick={joinRoom}
                        className="relative z-10 mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 py-4 rounded-xl font-black text-xl text-white uppercase tracking-widest hover:scale-[1.02] active:scale-98 transition-all shadow-[0_0_30px_rgba(79,70,229,0.5)] border-t border-white/20 overflow-hidden group"
                    >
                        <span className="relative z-10 drop-shadow-md">Enter The Void</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity blur-md"></div>
                    </button>
                </div>
            </div>
        </div>
    );
  }

  // --- MAIN GAME SCREEN ---
  const myName = playerName;
  const oppName = myRole === 'p1' ? p2Name : p1Name;

  return (
    <div className="h-screen max-h-screen w-full bg-[#030712] text-white font-sans flex flex-col items-center overflow-hidden relative">
      <style>{styles}</style>
      
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-[#050a18] to-black"></div>
          <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
          {/* Drifting magic particles */}
          <div className="absolute inset-0 opacity-40 pointer-events-none">
                 {[...Array(30)].map((_, i) => (
                    <div key={i} className="particle" style={{ left: `${Math.random()*100}%`, width: `${Math.random()*3}px`, height: `${Math.random()*3}px`, animationDuration: `${Math.random()*15+10}s`, animationDelay: `-${Math.random()*15}s`, background: i % 2 === 0 ? 'cyan' : 'violet' }}></div>
                 ))}
          </div>
      </div>

      {/* Top Status Bar - "VS" Header */}
      <div className="w-full shrink-0 bg-slate-950/80 backdrop-blur-md border-b border-indigo-500/30 p-2 flex justify-between items-center z-20 relative shadow-[0_5px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2 pl-2">
            <h1 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600 drop-shadow-sm">WIZ BATTLES</h1>
        </div>
        
        {/* VS Display center */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-4">
             <span className="text-blue-400 font-black text-lg drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]">{p1Name}</span>
             <span className="text-slate-200 font-black text-2xl italic mx-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">VS</span>
             <span className="text-red-400 font-black text-lg drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">{p2Name}</span>
        </div>

        <div className="flex gap-4 text-xs font-bold uppercase tracking-wider pr-2">
            <div className="flex flex-col items-end">
                <span className="text-slate-400 text-[10px]">Wins</span>
                <div className="flex gap-3">
                    <span className="text-blue-400 drop-shadow-sm">{wins.p1}</span>
                    <span className="text-slate-600">/</span>
                    <span className="text-red-400 drop-shadow-sm">{wins.p2}</span>
                </div>
            </div>
        </div>
      </div>

      {/* Main Battle Arena Container - Applies Screen Shake */}
      <div className={`flex-1 w-full max-w-5xl flex flex-col relative justify-evenly py-2 px-4 z-10 ${triggerShake ? 'animate-[screen-shake_0.5s_ease-in-out]' : ''}`}>
          
          <BattleAnimations 
            gameState={gameState} 
            p1Move={p1Move} 
            p2Move={p2Move} 
            myRole={myRole}
          />

          {/* Opponent (Top) */}
          <PlayerDisplay 
             name={oppName}
             role={myRole === 'p1' ? 'p2' : 'p1'} 
             energy={myRole === 'p1' ? p2Energy : p1Energy} 
             move={myRole === 'p1' ? p2Move : p1Move}
             isWinner={winner === (myRole === 'p1' ? 'p2' : 'p1')}
             gameState={gameState}
             isSelf={false}
          />

          {/* Message Bar - More Dramatic */}
          <div className="w-full flex justify-center my-4 relative z-20">
             <div className="px-8 py-4 bg-gradient-to-r from-indigo-950/90 to-purple-950/90 backdrop-blur-xl border-y-2 border-indigo-400/50 rounded-2xl shadow-[0_0_40px_rgba(79,70,229,0.4)] text-center min-w-[350px] max-w-[95%] transition-all duration-300 overflow-hidden relative">
                {/* Internal light sweep effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[200%] animate-[drift_4s_infinite_linear] rotate-45 scale-150"></div>
                
                <span className="relative z-10 text-lg md:text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-white to-yellow-200 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] tracking-tight leading-tight">
                    {message}
                </span>
             </div>
          </div>

          {/* Self (Bottom) */}
          <PlayerDisplay 
             name={myName}
             role={myRole} 
             energy={myRole === 'p1' ? p1Energy : p2Energy} 
             move={myRole === 'p1' ? p1Move : p2Move}
             isWinner={winner === myRole}
             gameState={gameState}
             isSelf={true}
          />
      </div>

      {/* Controls - Spellbook Style */}
      <div className="w-full shrink-0 bg-[#0a0f20]/90 backdrop-blur-xl p-4 pb-6 rounded-t-[2.5rem] border-t-4 border-indigo-500/30 relative z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.7)]">
         {/* Decorative rune border */}
         <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-indigo-500/50 rounded-full blur-sm"></div>

         {gameState === 'gameover' ? (
             <div className="text-center py-6 relative">
                 <div className="absolute inset-0 bg-gradient-to-t from-red-500/0 via-red-500/10 to-red-500/0 blur-3xl -z-10"></div>
                 <h2 className="text-6xl font-black mb-4 italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-200 to-yellow-600 drop-shadow-[0_5px_10px_rgba(0,0,0,1)] scale-110">
                    {winner === 'draw' ? 'DRAW' : (winner === myRole ? 'VICTORY' : 'DEFEAT')}
                 </h2>
                 <button onClick={restartGame} className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-10 py-3 rounded-xl font-black text-xl uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_30px_rgba(234,179,8,0.5)] border-2 border-yellow-300/50">Play Again</button>
             </div>
         ) : (
            <div className="max-w-5xl mx-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-9 gap-3 relative z-10">
                {Object.keys(MOVES).map(key => renderCard(key))}
            </div>
         )}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

const BattleAnimations = ({ gameState, p1Move, p2Move, myRole }) => {
    if (gameState !== 'resolution') return null;

    const selfMove = myRole === 'p1' ? p1Move : p2Move;
    const enemyMove = myRole === 'p1' ? p2Move : p1Move;

    return (
        <div className="absolute inset-0 z-0 pointer-events-none flex flex-col justify-center items-center overflow-hidden">
            {/* Self Attack (Up) - More intense */}
            {selfMove?.type === 'attack' && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center justify-center animate-[shoot-up-intense_0.8s_ease-in_forwards]">
                    <div className={`p-4 rounded-full bg-gradient-to-t ${selfMove.bg} shadow-[0_0_50px_rgba(var(--tw-shadow-color),0.8)] ${selfMove.shadow} border-4 border-white`}>
                        <selfMove.icon size={48} className="text-white drop-shadow-[0_0_10px_white]" />
                    </div>
                    {/* Trail effect */}
                    <div className={`absolute bottom-0 w-16 h-48 bg-gradient-to-t ${selfMove.bg} to-transparent blur-2xl -z-10 opacity-70`}></div>
                </div>
            )}
            
            {/* Enemy Attack (Down) - More intense */}
            {enemyMove?.type === 'attack' && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 flex items-center justify-center animate-[shoot-down-intense_0.8s_ease-in_forwards]">
                    <div className={`p-4 rounded-full bg-gradient-to-b ${enemyMove.bg} shadow-[0_0_50px_rgba(var(--tw-shadow-color),0.8)] ${enemyMove.shadow} border-4 border-white`}>
                        <enemyMove.icon size={48} className="text-white drop-shadow-[0_0_10px_white]" />
                    </div>
                     {/* Trail effect */}
                     <div className={`absolute top-0 w-16 h-48 bg-gradient-to-b ${enemyMove.bg} to-transparent blur-2xl -z-10 opacity-70`}></div>
                </div>
            )}

            {/* Clash Explosion */}
            {selfMove?.type === 'attack' && enemyMove?.type === 'attack' && selfMove.power === enemyMove.power && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-[clash-boom-intense_0.6s_ease-out_forwards]">
                    <Swords size={100} className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,1)]" />
                    <div className="absolute inset-0 bg-white/50 blur-3xl rounded-full scale-150"></div>
                </div>
            )}
        </div>
    );
};

const PlayerDisplay = ({ name, role, energy, move, isWinner, gameState, isSelf }) => {
    const isShielding = gameState === 'resolution' && move?.id === 'shield';
    const isLoading = gameState === 'resolution' && move?.id === 'load';

    return (
        <div className={`flex flex-col items-center relative w-full shrink-0 z-10 transition-all duration-500 ${isWinner ? 'scale-110' : ''} ${!isSelf && isWinner ? 'grayscale-[0.5] opacity-70' : ''}`}>
            
            {/* Name & Energy Bar Container - "Rune Tablet" Look */}
            <div className={`mb-3 flex flex-col items-center gap-1 bg-[#0a0f20]/90 px-6 py-3 rounded-2xl border-2 transition-all duration-300 shadow-xl relative overflow-hidden
                ${isSelf ? 'border-blue-500/50 shadow-blue-900/30' : 'border-red-500/50 shadow-red-900/30'}
            `}>
                {/* Ambient internal glow */}
                <div className={`absolute inset-0 opacity-20 bg-gradient-to-r ${isSelf ? 'from-blue-600 to-cyan-600' : 'from-red-600 to-orange-600'} blur-xl pointer-events-none`}></div>

                <span className={`text-sm font-black uppercase tracking-[0.15em] drop-shadow-sm relative z-10 ${isSelf ? 'text-blue-300' : 'text-red-300'}`}>
                    {name}
                </span>
                
                {/* Energy Crystals */}
                <div className="flex gap-1.5 relative z-10 mt-1 p-1 bg-black/50 rounded-lg border border-white/5">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className={`h-3 w-2 rounded-sm transition-all duration-500 border-t border-white/20
                            ${i < energy 
                                ? (isSelf ? 'bg-gradient-to-t from-blue-600 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-[crystal-charge_2s_infinite]' : 'bg-gradient-to-t from-red-700 to-orange-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-[crystal-charge_2s_infinite_reverse]') 
                                : 'bg-slate-800/50 border-slate-700'}
                        `} />
                    ))}
                </div>
            </div>

            {/* Avatar Circle - "Arcane Focus" Look */}
            <div className={`
                relative w-28 h-28 rounded-full border-[5px] flex items-center justify-center transition-all duration-500 shadow-2xl bg-[#050a18] overflow-visible
                ${gameState === 'resolution' && move?.type === 'attack' ? 'scale-110 border-white shadow-[0_0_40px_rgba(255,255,255,0.4)]' : 'border-slate-700'}
                ${isWinner ? 'border-yellow-400 shadow-[0_0_60px_rgba(250,204,21,0.7)] scale-110 z-20' : ''}
            `}>
                 {/* Visual Effects Overlays */}
                 {isShielding && <div className="absolute inset-[-15px] rounded-full border-4 border-blue-400/80 bg-blue-500/10 animate-[shield-pulse-intense_1.5s_infinite]" />}
                 {isLoading && <div className="absolute inset-[-10px] rounded-full border-4 border-yellow-400/80 bg-transparent animate-[aura-glow-intense_1.5s_infinite]" />}

                 {isWinner ? <Trophy className="text-yellow-300 w-12 h-12 animate-bounce drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" /> : 
                  isSelf ? <div className="text-cyan-300 font-black text-sm tracking-widest drop-shadow-[0_0_10px_rgba(103,232,249,0.8)]">HERO</div> : <Skull className="text-red-400 w-10 h-10 drop-shadow-[0_0_10px_rgba(248,113,113,0.8)]" />
                 }
            </div>

            {/* Move Reveal Bubble - "Spell Manifestation" */}
            <div className={`absolute ${isSelf ? 'right-2 md:right-[25%]' : 'left-2 md:left-[25%]'} top-1/2 -translate-y-1/2 transition-all duration-500 z-30
                ${(gameState === 'resolution' || gameState === 'gameover' || (isSelf && move)) ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-50 translate-x-10'}
            `}>
                {move && (
                    <div className={`bg-[#0a0f20]/95 backdrop-blur-xl border-2 px-5 py-2.5 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center gap-3
                        ${isSelf ? 'border-blue-500/50 shadow-blue-500/20' : 'border-red-500/50 shadow-red-500/20'}
                    `}>
                        {(!isSelf && gameState !== 'resolution' && gameState !== 'gameover') ? (
                             <div className="flex items-center gap-2">
                                 <div className="w-4 h-4 rounded-full bg-slate-700 animate-pulse"></div>
                                 <span className="text-xs text-slate-300 italic font-bold tracking-widest">Casting...</span>
                             </div>
                        ) : (
                            <>
                                <div className={`p-1.5 rounded-full bg-black/50 border border-white/20 ${move.shadow}`}>
                                     <move.icon size={20} className={move.color + " drop-shadow-sm"} />
                                </div>
                                <span className={`font-black text-sm uppercase tracking-wider ${move.color} drop-shadow-sm`}>{move.name}</span>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default function App() { return <WizBattles />; }