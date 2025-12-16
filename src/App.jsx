import React, { useState, useEffect } from 'react';
import { Shield, Zap, Flame, Disc, Globe, Sun, RefreshCw, Trophy, Sparkles, Swords, Skull } from 'lucide-react';
import io from 'socket.io-client';

// --- CONFIGURATION ---
const BACKEND_URL = import.meta.env.PROD 
  ? "https://wizbattle.onrender.com/" 
  : "http://localhost:3001";

const socket = io.connect(BACKEND_URL);

// --- ASSETS & DATA ---
const MOVES = {
  LOAD: { id: 'load', name: 'Charge', cost: 0, power: 0, type: 'utility', icon: Zap, color: 'text-yellow-300', bg: 'from-yellow-600 to-amber-800', border: 'border-yellow-400', shadow: 'shadow-yellow-500', desc: 'Gain 1 Energy.' },
  SHIELD: { id: 'shield', name: 'Shield', cost: 0, power: 0, type: 'defense', icon: Shield, color: 'text-blue-300', bg: 'from-blue-600 to-indigo-800', border: 'border-blue-400', shadow: 'shadow-blue-500', desc: 'Blocks Fireball & Beam.' },
  FIREBALL: { id: 'fireball', name: 'Fireball', cost: 1, power: 1, type: 'attack', icon: Flame, color: 'text-orange-300', bg: 'from-orange-600 to-red-800', border: 'border-orange-400', shadow: 'shadow-orange-500', desc: '1 Load. Blockable.' },
  BEAM: { id: 'beam', name: 'Beam', cost: 2, power: 2, type: 'attack', icon: Sun, color: 'text-cyan-300', bg: 'from-cyan-600 to-blue-800', border: 'border-cyan-400', shadow: 'shadow-cyan-500', desc: '2 Loads. Blockable.' },
  REBOUND: { id: 'rebound', name: 'Rebound', cost: 2, power: 0, type: 'counter', icon: RefreshCw, color: 'text-purple-300', bg: 'from-purple-600 to-fuchsia-800', border: 'border-purple-400', shadow: 'shadow-purple-500', desc: 'Reflects attacks.' },
  DISC: { id: 'disc', name: 'Destructo', cost: 3, power: 3, type: 'attack', icon: Disc, color: 'text-pink-300', bg: 'from-pink-600 to-rose-800', border: 'border-pink-400', shadow: 'shadow-pink-500', desc: 'Pierces Shield.' },
  KAYOKEN: { id: 'kayoken', name: 'Kayoken', cost: 0, req: 4, power: 0, type: 'special', icon: Sparkles, color: 'text-red-300', bg: 'from-red-700 to-orange-800', border: 'border-red-500', shadow: 'shadow-red-600', desc: 'Dodge + 3 Energy.' },
  SPIRIT: { id: 'spirit', name: 'Spirit Bomb', cost: 5, power: 5, type: 'attack', icon: Globe, color: 'text-sky-300', bg: 'from-sky-600 to-indigo-900', border: 'border-sky-400', shadow: 'shadow-sky-500', desc: 'Massive Damage.' },
  DRAGON: { id: 'dragon', name: 'Dragon Fist', cost: 8, power: 8, type: 'attack', icon: Trophy, color: 'text-amber-200', bg: 'from-amber-500 to-yellow-800', border: 'border-amber-300', shadow: 'shadow-amber-400', desc: 'Wins Game.' }
};

const INITIAL_ENERGY = 0;

// --- CSS STYLES ---
const styles = `
  /* STICK FIGURE ANIMATIONS */
  @keyframes idle-breath {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-2px); }
  }
  @keyframes arm-idle-l { 0%, 100% { transform: rotate(10deg); } 50% { transform: rotate(15deg); } }
  @keyframes arm-idle-r { 0%, 100% { transform: rotate(-10deg); } 50% { transform: rotate(-15deg); } }

  @keyframes attack-lunge {
    0% { transform: translateX(0); }
    20% { transform: translateX(-10px); } /* Wind up */
    40% { transform: translateX(30px); } /* Strike */
    100% { transform: translateX(0); }
  }
  
  @keyframes cast-arm {
    0% { transform: rotate(0deg); }
    30% { transform: rotate(-120deg); } /* Raise arm */
    100% { transform: rotate(0deg); }
  }

  @keyframes hit-stagger {
    0% { transform: translateX(0); }
    20% { transform: translateX(-20px) rotate(-10deg); filter: brightness(3) sepia(1) hue-rotate(-50deg) saturate(5); } /* Flash Red */
    100% { transform: translateX(0); }
  }
  
  @keyframes die-fall {
    0% { transform: rotate(0); }
    100% { transform: rotate(90deg) translateY(50px); opacity: 0.5; }
  }

  /* PROJECTILES */
  @keyframes shot-right-to-left {
    0% { left: 90%; opacity: 0; transform: scale(0.5); }
    10% { opacity: 1; transform: scale(1); }
    90% { opacity: 1; transform: scale(1); }
    100% { left: 10%; opacity: 0; transform: scale(0.5); }
  }
  @keyframes shot-left-to-right {
    0% { left: 10%; opacity: 0; transform: scale(0.5); }
    10% { opacity: 1; transform: scale(1); }
    90% { opacity: 1; transform: scale(1); }
    100% { left: 90%; opacity: 0; transform: scale(0.5); }
  }
  
  /* ENVIRONMENT */
  @keyframes clash-shake {
    0%, 100% { transform: translate(0,0) rotate(0); }
    25% { transform: translate(-5px, 5px) rotate(-1deg); }
    75% { transform: translate(5px, -5px) rotate(1deg); }
  }
  
  @keyframes particle-float {
    0% { transform: translateY(0) scale(1); opacity: 0; }
    50% { opacity: 0.5; }
    100% { transform: translateY(-100px) scale(0); opacity: 0; }
  }
`;

// --- STICK FIGURE COMPONENT ---
const StickFigure = ({ isSelf, pose, isWinner, isDead, color }) => {
    // Determine classes based on pose state
    let containerClass = "animate-[idle-breath_2s_infinite_ease-in-out]";
    let armLClass = "animate-[arm-idle-l_2s_infinite]";
    let armRClass = "animate-[arm-idle-r_2s_infinite]";
    let bodyEffect = "";

    // IMPORTANT: "Self" is on Right, facing Left. "Enemy" is on Left, facing Right.
    // We use scale-x-[-1] on the PARENT container of the Right figure to flip everything easily.
    
    if (pose === 'attack') {
        containerClass = "animate-[attack-lunge_0.5s_ease-out]";
        armRClass = "animate-[cast-arm_0.5s_ease-out]"; // Casting arm
    } else if (pose === 'hit') {
        containerClass = "animate-[hit-stagger_0.4s_ease-out]";
    } else if (pose === 'charge') {
        bodyEffect = "drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]"; // Gold glow
    } else if (pose === 'block') {
        armLClass = "rotate-[-45deg] translate-x-2";
        armRClass = "rotate-[-45deg] translate-x-2";
    }

    if (isDead) containerClass = "animate-[die-fall_1s_forwards]";
    if (isWinner) containerClass = "animate-bounce";

    // Colors
    const headColor = isSelf ? "bg-cyan-400" : "bg-red-500";
    const bodyColor = "bg-white";

    return (
        <div className={`relative w-24 h-48 flex flex-col items-center justify-center transition-all duration-300 ${containerClass} ${isSelf ? '-scale-x-100' : ''} ${bodyEffect}`}>
            {/* HEAD */}
            <div className={`w-12 h-12 rounded-full ${headColor} shadow-[0_0_10px_currentColor] z-20 relative`}>
                {/* Eyes (to show direction) */}
                <div className="absolute top-4 right-2 w-2 h-2 bg-black rounded-full opacity-70"></div>
            </div>

            {/* TORSO */}
            <div className={`w-2 h-20 ${bodyColor} rounded-full z-10 relative -mt-1`}>
                {/* ARMS (Anchored at top) */}
                <div className={`absolute top-2 left-1/2 w-16 h-2 ${bodyColor} origin-left -translate-x-1/2 rounded-full ${armLClass}`} style={{ transformOrigin: '2px 50%' }}></div>
                <div className={`absolute top-2 left-1/2 w-16 h-2 ${bodyColor} origin-left -translate-x-1/2 rounded-full ${armRClass}`} style={{ transformOrigin: '2px 50%' }}></div>
            </div>

            {/* LEGS (Anchored at bottom of torso) */}
            <div className="relative -mt-2">
                <div className={`absolute top-0 left-1/2 w-2 h-16 ${bodyColor} origin-top -translate-x-1/2 rotate-[20deg] rounded-full`}></div>
                <div className={`absolute top-0 left-1/2 w-2 h-16 ${bodyColor} origin-top -translate-x-1/2 rotate-[-20deg] rounded-full`}></div>
            </div>
            
            {/* SHADOW */}
            <div className="absolute bottom-0 w-24 h-4 bg-black/50 blur-md rounded-[100%] scale-y-50 translate-y-4 z-0"></div>
            
            {/* NAME TAG (Un-flipped via scale-x) */}
            <div className={`absolute -top-10 whitespace-nowrap ${isSelf ? '-scale-x-100' : ''}`}>
                 <span className={`font-black uppercase text-sm px-2 py-1 rounded bg-black/50 backdrop-blur-md ${isSelf ? 'text-cyan-300 border border-cyan-500/30' : 'text-red-400 border border-red-500/30'}`}>
                    {isSelf ? "YOU" : "ENEMY"}
                 </span>
            </div>
        </div>
    );
};

// --- MAIN GAME ---
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
  const [message, setMessage] = useState("Waiting for challenger...");
  const [winner, setWinner] = useState(null);
  const [wins, setWins] = useState({ p1: 0, p2: 0 });
  const [shake, setShake] = useState(false);
  
  // Names
  const [p1Name, setP1Name] = useState("Player 1");
  const [p2Name, setP2Name] = useState("Player 2");

  useEffect(() => {
    socket.on("player_assignment", (role) => {
        setMyRole(role);
    });

    socket.on("game_start", () => {
        setMessage("BATTLE START!");
        setGameState('playing');
    });

    socket.on("room_full", () => { alert("Room Full!"); setJoined(false); });
    socket.on("player_disconnected", () => { alert("Opponent Disconnected."); window.location.reload(); });
    socket.on("waiting_for_opponent", () => { setMessage("Locked in..."); setGameState('waiting'); });

    socket.on("round_complete", (data) => {
        const move1 = MOVES[data.p1Move.id.toUpperCase()];
        const move2 = MOVES[data.p2Move.id.toUpperCase()];
        const name1 = data.p1Move.playerName || "Player 1";
        const name2 = data.p2Move.playerName || "Player 2";
        
        setP1Name(name1); setP2Name(name2);
        setP1Move(move1); setP2Move(move2);
        
        setGameState('resolution');
        
        // Calculate collision time for shake
        if (move1.type === 'attack' || move2.type === 'attack') {
             setTimeout(() => { setShake(true); }, 750); // Impact time
             setTimeout(() => { setShake(false); }, 1200);
        }
        
        setTimeout(() => { resolveTurn(move1, move2, name1, name2); }, 2000); 
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
    if (room && playerName) {
      socket.emit("join_room", room);
      if (myRole === 'p1') setP1Name(playerName);
      if (myRole === 'p2') setP2Name(playerName);
      setJoined(true);
    } else { alert("Enter Name & Room"); }
  };

  const sendMove = (moveKey) => {
    if (gameState !== 'playing') return;
    const move = MOVES[moveKey];
    socket.emit("send_move", { room, move: { ...move, playerName }, player: myRole });
    setMessage("Waiting...");
  };

  const resolveTurn = (move1, move2, name1, name2) => {
    let p1Death = false, p2Death = false, p1Net = 0, p2Net = 0;

    // Costs
    if (move1.id === 'load') p1Net += 1; else if (move1.id === 'kayoken') p1Net += 3; else p1Net -= move1.cost;
    if (move2.id === 'load') p2Net += 1; else if (move2.id === 'kayoken') p2Net += 3; else p2Net -= move2.cost;

    // Combat
    const p1Atk = move1.type === 'attack';
    const p2Atk = move2.type === 'attack';

    let msg = "";

    if (p1Atk && p2Atk) {
        if (move1.power === move2.power) msg = "CLASH! Attacks Cancelled!";
        else if (move1.power > move2.power) { msg = `${name1} Overpowered ${name2}!`; p2Death = true; }
        else { msg = `${name2} Overpowered ${name1}!`; p1Death = true; }
    } else if (p1Atk) {
        if (move2.id === 'kayoken') msg = `${name2} Dodged!`;
        else if (move2.id === 'rebound') { 
            if (move1.id === 'dragon') { msg = "Dragon Fist Breaks Rebound!"; p2Death = true; }
            else { msg = "Rebounded!"; p1Death = true; }
        }
        else if (move2.id === 'shield') { 
            if (move1.power > 2) { msg = "Shield Broken!"; p2Death = true; }
            else msg = "Blocked!";
        }
        else { msg = `Direct Hit on ${name2}!`; p2Death = true; }
    } else if (p2Atk) {
        if (move1.id === 'kayoken') msg = `${name1} Dodged!`;
        else if (move1.id === 'rebound') {
            if (move2.id === 'dragon') { msg = "Dragon Fist Breaks Rebound!"; p1Death = true; }
            else { msg = "Rebounded!"; p2Death = true; }
        }
        else if (move1.id === 'shield') {
            if (move2.power > 2) { msg = "Shield Broken!"; p1Death = true; }
            else msg = "Blocked!";
        }
        else { msg = `Direct Hit on ${name1}!`; p1Death = true; }
    } else {
        msg = "Tactical Manuevering...";
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
            setP1Move(null); setP2Move(null);
            setMessage("Select Move");
        }, 2500);
    }
  };

  const restartGame = () => {
    setGameState('playing'); setP1Energy(0); setP2Energy(0);
    setP1Move(null); setP2Move(null); setWinner(null); setMessage("Round Start");
  };

  const renderCard = (moveKey) => {
    const move = MOVES[moveKey];
    const myEnergy = myRole === 'p1' ? p1Energy : p2Energy;
    const canAfford = move.id === 'kayoken' ? myEnergy >= move.req : myEnergy >= move.cost;
    
    return (
      <button key={move.id} disabled={!canAfford || gameState !== 'playing'} onClick={() => sendMove(moveKey)}
        className={`group relative flex flex-col items-center justify-between p-2 rounded-xl border-2 transition-all duration-300 overflow-hidden ${!canAfford ? 'opacity-40 grayscale scale-95 border-slate-700 bg-slate-900/50' : `hover:-translate-y-1 hover:shadow-xl cursor-pointer bg-gradient-to-br ${move.bg} ${move.border} ${move.shadow}`}`}>
        <div className={`relative z-10 p-2 rounded-full bg-black/40 mb-1 ${move.color} border border-white/10`}><move.icon size={20} /></div>
        <span className={`relative z-10 font-black text-[10px] uppercase ${move.color}`}>{move.name}</span>
        <div className={`absolute top-0 right-0 rounded-bl-lg px-1.5 py-0.5 text-[10px] font-black text-white ${move.req ? 'bg-red-900' : (move.cost > 0 ? 'bg-blue-900' : 'bg-slate-800')}`}>{move.req ? '4+' : move.cost}</div>
      </button>
    );
  };

  // --- JOIN SCREEN ---
  if (!joined) return (
    <div className="h-screen w-full bg-[#050a18] flex flex-col items-center justify-center text-white font-sans relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-indigo-900/30 to-black z-0"></div>
        <h1 className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-red-600 drop-shadow-lg z-10 mb-8">WIZ BATTLES</h1>
        <div className="bg-slate-900/60 backdrop-blur-md p-8 rounded-2xl border-2 border-indigo-500/50 flex flex-col gap-4 w-[350px] z-10">
            <input placeholder="Wizard Name" className="bg-[#0a0f20] border border-slate-700 p-3 rounded-xl text-white font-bold outline-none focus:border-indigo-500" onChange={(e) => setPlayerName(e.target.value)} />
            <input placeholder="Room Code" className="bg-[#0a0f20] border border-slate-700 p-3 rounded-xl text-white font-bold outline-none focus:border-indigo-500" onChange={(e) => setRoom(e.target.value)} />
            <button onClick={joinRoom} className="bg-gradient-to-r from-indigo-600 to-purple-600 py-3 rounded-xl font-black text-white hover:scale-105 transition-transform">FIGHT</button>
        </div>
    </div>
  );

  // --- GAME RENDERING ---
  const myName = playerName;
  const oppName = myRole === 'p1' ? p2Name : p1Name;

  return (
    <div className="h-screen w-full bg-[#030712] text-white font-sans flex flex-col overflow-hidden relative selection:bg-none">
      <style>{styles}</style>
      
      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-slate-900 via-black to-black">
         {[...Array(30)].map((_, i) => (<div key={i} className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-[particle-float_5s_infinite_linear]" style={{ left: `${Math.random()*100}%`, top: `${Math.random()*100}%`, animationDelay: `-${Math.random()*5}s` }}></div>))}
      </div>

      {/* TOP HEADER */}
      <div className="relative z-20 w-full h-16 flex justify-between items-center px-6 bg-slate-950/80 border-b border-white/5">
        <span className="font-black italic text-yellow-400 text-xl tracking-tighter">WIZ BATTLES</span>
        <div className="flex gap-4 font-bold text-xs uppercase text-slate-500">
             <span>Wins: <span className="text-white">{wins.p1}</span> - <span className="text-white">{wins.p2}</span></span>
        </div>
      </div>

      {/* BATTLE STAGE (SIDE BY SIDE) */}
      <div className={`flex-1 relative flex items-end justify-between px-10 pb-20 max-w-6xl mx-auto w-full z-10 ${shake ? 'animate-[clash-shake_0.5s]' : ''}`}>
          
          {/* ANIMATIONS LAYER */}
          <StageAnimations gameState={gameState} p1Move={p1Move} p2Move={p2Move} myRole={myRole} />

          {/* LEFT SIDE: OPPONENT */}
          <div className="flex flex-col items-center gap-4 relative z-20">
             <div className="flex flex-col items-center">
                <div className="flex gap-1 mb-2">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className={`w-3 h-1.5 rounded-sm ${i < (myRole === 'p1' ? p2Energy : p1Energy) ? 'bg-red-500 shadow-[0_0_5px_red]' : 'bg-slate-800'}`}></div>
                    ))}
                </div>
                <span className="text-red-400 font-black uppercase tracking-widest text-lg drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]">{oppName}</span>
             </div>
             
             {/* STICK FIGURE (ENEMY) */}
             <StickFigure 
                isSelf={false} 
                pose={determinePose(gameState, myRole === 'p1' ? p2Move : p1Move, winner, myRole === 'p1' ? 'p2' : 'p1')}
                isWinner={winner === (myRole === 'p1' ? 'p2' : 'p1')}
                isDead={gameState === 'gameover' && winner !== (myRole === 'p1' ? 'p2' : 'p1') && winner !== 'draw'}
             />
          </div>

          {/* CENTER MESSAGE */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-center w-full z-30 pointer-events-none">
             <h2 className={`text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-xl transition-all duration-300 ${gameState === 'resolution' ? 'scale-110' : 'scale-100'}`}>
                {message}
             </h2>
          </div>

          {/* RIGHT SIDE: SELF */}
          <div className="flex flex-col items-center gap-4 relative z-20">
             <div className="flex flex-col items-center">
                <div className="flex gap-1 mb-2">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className={`w-3 h-1.5 rounded-sm ${i < (myRole === 'p1' ? p1Energy : p2Energy) ? 'bg-cyan-400 shadow-[0_0_5px_cyan]' : 'bg-slate-800'}`}></div>
                    ))}
                </div>
                <span className="text-cyan-400 font-black uppercase tracking-widest text-lg drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">{myName}</span>
             </div>

             {/* STICK FIGURE (YOU) */}
             <StickFigure 
                isSelf={true} 
                pose={determinePose(gameState, myRole === 'p1' ? p1Move : p2Move, winner, myRole)}
                isWinner={winner === myRole}
                isDead={gameState === 'gameover' && winner !== myRole && winner !== 'draw'}
             />
          </div>
      </div>

      {/* CARD DECK */}
      <div className="relative z-30 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 p-4 pb-8">
         <div className="max-w-4xl mx-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-9 gap-2">
            {Object.keys(MOVES).map(key => renderCard(key))}
         </div>
      </div>

      {/* GAME OVER MODAL */}
      {gameState === 'gameover' && (
         <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-slate-900 border-2 border-yellow-500/50 p-10 rounded-3xl text-center flex flex-col gap-6 shadow-[0_0_50px_rgba(234,179,8,0.2)]">
                <h2 className="text-6xl font-black italic text-white">{winner === 'draw' ? 'DRAW' : (winner === myRole ? 'VICTORY' : 'DEFEAT')}</h2>
                <button onClick={restartGame} className="px-8 py-3 bg-yellow-500 text-black font-black text-xl rounded-full hover:scale-105 transition-transform">PLAY AGAIN</button>
            </div>
         </div>
      )}
    </div>
  );
}

// Helper to calculate stick figure pose
function determinePose(gameState, move, winner, role) {
    if (gameState === 'gameover') return 'idle'; // Dead/Win handled by props
    if (gameState !== 'resolution' || !move) return 'idle';
    
    // In resolution phase:
    if (move.id === 'load') return 'charge';
    if (move.id === 'shield') return 'block';
    if (move.id === 'kayoken') return 'charge';
    if (move.type === 'attack') return 'attack';
    // Logic for getting hit? (Need to know if *I* lost the exchange to show 'hit' pose. Simplified for now.)
    return 'idle';
}

// Helper for projectiles
const StageAnimations = ({ gameState, p1Move, p2Move, myRole }) => {
    if (gameState !== 'resolution') return null;

    // Logic: My attacks go Right -> Left? No, sticking to standard fighter logic:
    // Left Player (Enemy) shoots Left->Right
    // Right Player (You) shoots Right->Left
    
    const leftMove = myRole === 'p1' ? p2Move : p1Move; // Enemy is Left
    const rightMove = myRole === 'p1' ? p1Move : p2Move; // You are Right

    return (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
            {/* Left Player Projectile (Enemy) -> Travels Left to Right */}
            {leftMove?.type === 'attack' && (
                <div className="absolute top-1/2 left-0 w-full h-20 -translate-y-1/2 flex items-center animate-[shot-left-to-right_0.8s_ease-in_forwards]">
                     <div className={`w-16 h-16 rounded-full ${leftMove.bg} shadow-[0_0_30px_white] border-4 border-white flex items-center justify-center`}>
                        <leftMove.icon className="text-white" size={32}/>
                     </div>
                     <div className={`flex-1 h-8 bg-gradient-to-r ${leftMove.bg} to-transparent opacity-50 rounded-r-full -ml-8`}></div>
                </div>
            )}

            {/* Right Player Projectile (You) -> Travels Right to Left */}
            {rightMove?.type === 'attack' && (
                <div className="absolute top-1/2 right-0 w-full h-20 -translate-y-1/2 flex flex-row-reverse items-center animate-[shot-right-to-left_0.8s_ease-in_forwards]">
                     <div className={`w-16 h-16 rounded-full ${rightMove.bg} shadow-[0_0_30px_white] border-4 border-white flex items-center justify-center z-10`}>
                        <rightMove.icon className="text-white" size={32}/>
                     </div>
                     <div className={`flex-1 h-8 bg-gradient-to-l ${rightMove.bg} to-transparent opacity-50 rounded-l-full -mr-8`}></div>
                </div>
            )}

            {/* Clash Explosion in Middle */}
            {leftMove?.type === 'attack' && rightMove?.type === 'attack' && leftMove.power === rightMove.power && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
                    <Swords size={120} className="text-white animate-ping" />
                    <div className="absolute inset-0 bg-white blur-3xl rounded-full scale-150 animate-pulse"></div>
                </div>
            )}
            
            {/* Shield Effect Logic could go here too */}
        </div>
    );
}

export default function App() { return <WizBattles />; }