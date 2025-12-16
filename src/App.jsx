import React, { useState, useEffect } from 'react';
import { Shield, Zap, Flame, Disc, Globe, Sun, RefreshCw, Skull, Trophy, Sparkles, Swords, User } from 'lucide-react';
import io from 'socket.io-client';

// --- CONFIGURATION ---
const BACKEND_URL = import.meta.env.PROD 
  ? "https://wizbattle.onrender.com/" 
  : "http://localhost:3001";

const socket = io.connect(BACKEND_URL);

// --- ASSETS & DATA ---
const MOVES = {
  LOAD: { id: 'load', name: 'Charge', cost: 0, type: 'utility', icon: Zap, color: 'text-yellow-400', bg: 'from-yellow-900/40 to-yellow-600/20', border: 'border-yellow-500/50', shadow: 'shadow-yellow-500/20', desc: 'Gain 1 Energy.' },
  SHIELD: { id: 'shield', name: 'Shield', cost: 0, type: 'defense', icon: Shield, color: 'text-blue-400', bg: 'from-blue-900/40 to-blue-600/20', border: 'border-blue-500/50', shadow: 'shadow-blue-500/20', desc: 'Blocks Fireball & Beam.' },
  FIREBALL: { id: 'fireball', name: 'Fireball', cost: 1, power: 1, type: 'attack', icon: Flame, color: 'text-orange-500', bg: 'from-orange-900/40 to-red-600/20', border: 'border-orange-500/50', shadow: 'shadow-orange-500/20', desc: '1 Load. Blockable.' },
  BEAM: { id: 'beam', name: 'Beam', cost: 2, power: 2, type: 'attack', icon: Sun, color: 'text-cyan-400', bg: 'from-cyan-900/40 to-blue-600/20', border: 'border-cyan-500/50', shadow: 'shadow-cyan-500/20', desc: '2 Loads. Blockable.' },
  REBOUND: { id: 'rebound', name: 'Rebound', cost: 2, type: 'counter', icon: RefreshCw, color: 'text-purple-400', bg: 'from-purple-900/40 to-fuchsia-600/20', border: 'border-purple-500/50', shadow: 'shadow-purple-500/20', desc: 'Reflects attacks.' },
  DISC: { id: 'disc', name: 'Destructo', cost: 3, power: 3, type: 'attack', icon: Disc, color: 'text-pink-500', bg: 'from-pink-900/40 to-rose-600/20', border: 'border-pink-500/50', shadow: 'shadow-pink-500/20', desc: 'Pierces Shield.' },
  KAYOKEN: { id: 'kayoken', name: 'Kayoken', cost: 0, req: 4, type: 'special', icon: Sparkles, color: 'text-red-500', bg: 'from-red-900/40 to-orange-600/20', border: 'border-red-500/50', shadow: 'shadow-red-500/20', desc: 'Dodge + 3 Energy.' },
  SPIRIT: { id: 'spirit', name: 'Spirit Bomb', cost: 5, power: 5, type: 'attack', icon: Globe, color: 'text-sky-400', bg: 'from-sky-900/40 to-indigo-600/20', border: 'border-sky-500/50', shadow: 'shadow-sky-500/20', desc: 'Massive Damage.' },
  DRAGON: { id: 'dragon', name: 'Dragon Fist', cost: 8, power: 8, type: 'attack', icon: Trophy, color: 'text-amber-400', bg: 'from-amber-900/40 to-yellow-600/20', border: 'border-amber-500/50', shadow: 'shadow-amber-500/20', desc: 'Wins Game.' }
};

const INITIAL_ENERGY = 0;

// --- CSS STYLES FOR ANIMATIONS ---
const styles = `
  @keyframes shoot-up {
    0% { transform: translateY(100px) scale(0.5); opacity: 0; }
    20% { opacity: 1; }
    100% { transform: translateY(-300px) scale(1.5); opacity: 0; }
  }
  @keyframes shoot-down {
    0% { transform: translateY(-100px) scale(0.5); opacity: 0; }
    20% { opacity: 1; }
    100% { transform: translateY(300px) scale(1.5); opacity: 0; }
  }
  @keyframes clash-boom {
    0% { transform: scale(0); opacity: 1; }
    50% { transform: scale(2); opacity: 1; }
    100% { transform: scale(3); opacity: 0; }
  }
  @keyframes shield-pulse {
    0% { transform: scale(1); opacity: 0.5; }
    50% { transform: scale(1.1); opacity: 0.8; }
    100% { transform: scale(1); opacity: 0.5; }
  }
  @keyframes aura-rise {
    0% { transform: translateY(0) scale(1); opacity: 0.5; }
    100% { transform: translateY(-50px) scale(1.2); opacity: 0; }
  }
`;

// --- MAIN COMPONENT ---
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
  
  // New State for Names
  const [p1Name, setP1Name] = useState("Player 1");
  const [p2Name, setP2Name] = useState("Player 2");

  useEffect(() => {
    socket.on("player_assignment", (role) => {
        setMyRole(role);
        if (role === 'p1') setMessage("Waiting for opponent to join...");
    });

    socket.on("game_start", () => {
        setMessage("BATTLE START! Choose your move.");
        setGameState('playing');
    });

    socket.on("room_full", () => {
        alert("Room Full!");
        setJoined(false);
    });

    socket.on("player_disconnected", () => {
        alert("Opponent Left.");
        window.location.reload();
    });

    socket.on("waiting_for_opponent", () => {
        setMessage("Move Locked. Waiting for opponent...");
        setGameState('waiting');
    });

    socket.on("round_complete", (data) => {
        const move1 = MOVES[data.p1Move.id.toUpperCase()];
        const move2 = MOVES[data.p2Move.id.toUpperCase()];
        
        // Extract names from the move payload if available
        const name1 = data.p1Move.playerName || "Player 1";
        const name2 = data.p2Move.playerName || "Player 2";
        
        setP1Name(name1);
        setP2Name(name2);
        setP1Move(move1);
        setP2Move(move2);
        
        setGameState('resolution');
        setMessage("Resolving moves..."); 
        
        setTimeout(() => {
            resolveTurn(move1, move2, name1, name2);
        }, 1500); // Wait for animation
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
      socket.emit("join_room", room); // We send name in move payload later to keep backend generic
      setJoined(true);
    } else {
        alert("Please enter both Room Name and Your Name");
    }
  };

  const sendMove = (moveKey) => {
    if (gameState !== 'playing') return;
    const move = MOVES[moveKey];
    // We attach playerName here so it travels to the opponent
    socket.emit("send_move", { room, move: { ...move, playerName }, player: myRole });
    setMessage("Waiting for opponent...");
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
            msg = `CLASH! ${name1} and ${name2}'s attacks cancel out!`;
        } else if (move1.power > move2.power) {
            msg = `${name1}'s ${move1.name} crushed ${name2}'s ${move2.name}!`;
            p2Death = true;
        } else {
            msg = `${name2}'s ${move2.name} crushed ${name1}'s ${move1.name}!`;
            p1Death = true;
        }
    } 
    // Scenario 2: P1 Attacks
    else if (p1Atk) {
        if (move2.id === 'kayoken') msg = `${name2} speed-blitzed the ${move1.name}! Miss!`;
        else if (move2.id === 'rebound') {
            if (move1.id === 'dragon') { msg = `Dragon Fist is uncounterable! Goodbye ${name2}!`; p2Death = true; }
            else { msg = `${name2} Rebounded ${name1}'s attack back!`; p1Death = true; }
        } else if (move2.id === 'shield') {
            if (move1.power > 2) { msg = `CRITICAL! ${name1} shattered ${name2}'s Shield!`; p2Death = true; }
            else msg = `${name2}'s Shield absorbed the hit.`;
        } else { msg = `Direct Hit! ${name1} blasted ${name2}!`; p2Death = true; }
    } 
    // Scenario 3: P2 Attacks
    else if (p2Atk) {
        if (move1.id === 'kayoken') msg = `${name1} speed-blitzed the ${move2.name}! Miss!`;
        else if (move1.id === 'rebound') {
            if (move2.id === 'dragon') { msg = `Dragon Fist is uncounterable! Goodbye ${name1}!`; p1Death = true; }
            else { msg = `${name1} Rebounded ${name2}'s attack back!`; p2Death = true; }
        } else if (move1.id === 'shield') {
            if (move2.power > 2) { msg = `CRITICAL! ${name2} shattered ${name1}'s Shield!`; p1Death = true; }
            else msg = `${name1}'s Shield absorbed the hit.`;
        } else { msg = `Direct Hit! ${name2} blasted ${name1}!`; p1Death = true; }
    } 
    // Scenario 4: Passive
    else {
        msg = `${name1} and ${name2} are gathering energy...`;
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
            setMessage("Choose your move!");
        }, 3000);
    }
  };

  const restartGame = () => {
    setGameState('playing');
    setP1Energy(0);
    setP2Energy(0);
    setP1Move(null);
    setP2Move(null);
    setWinner(null);
    setMessage("Battle Restarted!");
  };

  const renderCard = (moveKey) => {
    const move = MOVES[moveKey];
    const myEnergy = myRole === 'p1' ? p1Energy : p2Energy;
    const canAfford = move.id === 'kayoken' ? myEnergy >= move.req : myEnergy >= move.cost;
    
    return (
      <button
        key={move.id}
        disabled={!canAfford || gameState !== 'playing'}
        onClick={() => sendMove(moveKey)}
        className={`
          group relative flex flex-col items-center justify-between p-2 rounded-lg border transition-all duration-300
          ${move.shadow}
          ${!canAfford ? 'opacity-40 grayscale scale-95' : 'hover:scale-[1.02] hover:shadow-lg cursor-pointer bg-gradient-to-br ' + move.bg + ' ' + move.border}
          ${gameState === 'playing' ? 'bg-slate-800/50' : 'bg-slate-900'}
        `}
      >
        <div className={`p-1.5 rounded-full bg-slate-900/50 mb-0.5 ${move.color}`}>
            <move.icon size={20} />
        </div>
        <span className={`font-bold text-[10px] md:text-xs block ${move.color}`}>{move.name}</span>
        <div className="absolute -top-1 -right-1 bg-slate-900 border border-slate-600 rounded-full w-4 h-4 text-[10px] font-bold text-white shadow-sm flex items-center justify-center">
            {move.req ? '4+' : move.cost}
        </div>
      </button>
    );
  };

  if (!joined) {
    return (
        <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-black z-0"></div>
            
            <div className="z-10 flex flex-col items-center gap-6">
                <div className="mb-4 text-center">
                    <h1 className="text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-lg">WIZ BATTLES</h1>
                    <p className="text-blue-300 font-medium tracking-widest mt-2">ONLINE DUELS</p>
                </div>
                
                <div className="bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl border border-slate-700 shadow-2xl flex flex-col gap-4 w-[350px]">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-400 font-bold uppercase ml-1">Your Name</label>
                        <div className="flex items-center gap-2 bg-slate-800 border border-slate-600 p-3 rounded-lg focus-within:border-blue-500 transition-colors">
                            <User size={18} className="text-slate-400" />
                            <input 
                                placeholder="e.g. Wizard King" 
                                className="bg-transparent text-white outline-none w-full font-bold"
                                onChange={(e) => setPlayerName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-400 font-bold uppercase ml-1">Room Code</label>
                        <div className="flex items-center gap-2 bg-slate-800 border border-slate-600 p-3 rounded-lg focus-within:border-blue-500 transition-colors">
                            <Globe size={18} className="text-slate-400" />
                            <input 
                                placeholder="e.g. battle1" 
                                className="bg-transparent text-white outline-none w-full font-bold"
                                onChange={(e) => setRoom(e.target.value)}
                            />
                        </div>
                    </div>

                    <button 
                        onClick={joinRoom}
                        className="mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 py-3 rounded-lg font-black text-white hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                    >
                        ENTER ARENA
                    </button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="h-screen max-h-screen w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black text-white font-sans flex flex-col items-center overflow-hidden">
      <style>{styles}</style>
      
      {/* Top Bar */}
      <div className="w-full shrink-0 bg-slate-900/50 border-b border-white/10 p-3 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
            <h1 className="text-lg font-black italic text-yellow-400">WIZ BATTLES</h1>
            <span className="bg-blue-600 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">
                {myRole === 'p1' ? 'P1' : 'P2'}
            </span>
        </div>
        <div className="flex gap-4 text-xs font-bold uppercase tracking-wider">
            <span className="text-blue-400">{wins.p1} Wins</span>
            <span className="text-slate-600">VS</span>
            <span className="text-red-400">{wins.p2} Wins</span>
        </div>
      </div>

      {/* Battle Arena */}
      <div className="flex-1 w-full max-w-5xl flex flex-col relative justify-evenly py-2 px-4">
          
          {/* Animation Layer */}
          <BattleAnimations 
            gameState={gameState} 
            p1Move={p1Move} 
            p2Move={p2Move} 
          />

          {/* Opponent (Top) */}
          <PlayerDisplay 
             name={myRole === 'p1' ? p2Name : p1Name}
             role={myRole === 'p1' ? 'p2' : 'p1'} 
             energy={myRole === 'p1' ? p2Energy : p1Energy} 
             move={myRole === 'p1' ? p2Move : p1Move}
             isWinner={winner === (myRole === 'p1' ? 'p2' : 'p1')}
             gameState={gameState}
             isSelf={false}
          />

          {/* Message Bar */}
          <div className="w-full flex justify-center my-2 relative z-20">
             <div className="px-6 py-3 bg-black/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl text-center min-w-[320px] max-w-[90%] transition-all duration-300">
                <span className="text-base md:text-lg font-black italic text-yellow-200 drop-shadow-md">
                    {message}
                </span>
             </div>
          </div>

          {/* Self (Bottom) */}
          <PlayerDisplay 
             name={playerName}
             role={myRole} 
             energy={myRole === 'p1' ? p1Energy : p2Energy} 
             move={myRole === 'p1' ? p1Move : p2Move}
             isWinner={winner === myRole}
             gameState={gameState}
             isSelf={true}
          />
      </div>

      {/* Controls */}
      <div className="w-full shrink-0 bg-black/60 backdrop-blur-xl p-3 rounded-t-[2rem] border-t border-white/10 relative z-30">
         {gameState === 'gameover' ? (
             <div className="text-center py-4">
                 <h2 className="text-4xl font-black mb-2 italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
                    {winner === 'draw' ? 'DRAW' : (winner === myRole ? 'VICTORY' : 'DEFEAT')}
                 </h2>
                 <button onClick={restartGame} className="bg-white text-black px-8 py-2 rounded-full font-bold hover:scale-105 transition-transform">PLAY AGAIN</button>
             </div>
         ) : (
            <div className="max-w-4xl mx-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-9 gap-2">
                {Object.keys(MOVES).map(key => renderCard(key))}
            </div>
         )}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

const BattleAnimations = ({ gameState, p1Move, p2Move }) => {
    if (gameState !== 'resolution') return null;

    return (
        <div className="absolute inset-0 z-0 pointer-events-none flex flex-col justify-center items-center overflow-hidden">
            {/* P1 Attack Animation (Going Up) */}
            {p1Move?.type === 'attack' && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-12 h-12 flex items-center justify-center animate-[shoot-up_1s_ease-in-out_forwards]">
                    <div className={`p-3 rounded-full ${p1Move.bg} ${p1Move.shadow} border-2 border-white/50`}>
                        <p1Move.icon size={32} className="text-white" />
                    </div>
                </div>
            )}
            
            {/* P2 Attack Animation (Going Down) */}
            {p2Move?.type === 'attack' && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-12 h-12 flex items-center justify-center animate-[shoot-down_1s_ease-in-out_forwards]">
                    <div className={`p-3 rounded-full ${p2Move.bg} ${p2Move.shadow} border-2 border-white/50`}>
                        <p2Move.icon size={32} className="text-white" />
                    </div>
                </div>
            )}

            {/* Clash Animation (Both Attack with Equal Power) */}
            {p1Move?.type === 'attack' && p2Move?.type === 'attack' && p1Move.power === p2Move.power && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-[clash-boom_0.5s_ease-out_forwards]">
                    <Swords size={64} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
                </div>
            )}
        </div>
    );
};

const PlayerDisplay = ({ name, role, energy, move, isWinner, gameState, isSelf }) => {
    // Determine visuals based on current move processing
    const isShielding = gameState === 'resolution' && move?.id === 'shield';
    const isLoading = gameState === 'resolution' && move?.id === 'load';

    return (
        <div className="flex flex-col items-center relative w-full shrink-0 z-10">
            {/* Health/Energy Bar */}
            <div className="mb-2 flex items-center gap-3 bg-slate-900/80 px-4 py-1.5 rounded-full border border-white/10 shadow-lg">
                <span className={`text-xs font-black uppercase tracking-wider ${isSelf ? 'text-blue-400' : 'text-red-400'}`}>
                    {name || (isSelf ? 'YOU' : 'ENEMY')}
                </span>
                <div className="flex gap-1">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className={`h-2.5 w-1.5 rounded-[1px] transition-all duration-500 ${i < energy ? (isSelf ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]') : 'bg-slate-800'}`} />
                    ))}
                </div>
            </div>

            {/* Avatar Circle */}
            <div className={`
                relative w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-500 shadow-2xl bg-slate-800
                ${gameState === 'resolution' && move?.type === 'attack' ? 'scale-110 border-white shadow-white/20' : 'border-slate-700'}
                ${isWinner ? 'border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)] scale-110' : ''}
            `}>
                 {/* Visual Effects Overlays */}
                 {isShielding && <div className="absolute inset-[-10px] rounded-full border-2 border-blue-400 bg-blue-500/20 animate-[shield-pulse_1s_infinite]" />}
                 {isLoading && <div className="absolute inset-[-10px] rounded-full border-2 border-yellow-400 bg-yellow-500/10 animate-[aura-rise_1s_ease-out]" />}

                 {isWinner ? <Trophy className="text-yellow-400 w-10 h-10 animate-bounce" /> : 
                  isSelf ? <div className="text-cyan-400 font-black text-xs">HERO</div> : <Skull className="text-red-400 w-8 h-8" />
                 }
            </div>

            {/* Move Reveal Bubble */}
            <div className={`absolute ${isSelf ? 'right-4 md:right-1/3' : 'left-4 md:left-1/3'} top-1/2 -translate-y-1/2 transition-all duration-500 z-20
                ${(gameState === 'resolution' || gameState === 'gameover' || (isSelf && move)) ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
            `}>
                {move && (
                    <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-500 px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-2">
                        {(!isSelf && gameState !== 'resolution' && gameState !== 'gameover') ? (
                            <span className="text-xs text-slate-400 italic font-bold">...</span>
                        ) : (
                            <>
                                <move.icon size={16} className={move.color} />
                                <span className="font-bold text-white text-xs uppercase">{move.name}</span>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default function App() { return <WizBattles />; }