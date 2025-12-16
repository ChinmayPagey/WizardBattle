import React, { useState, useEffect } from 'react';
import { Shield, Zap, Flame, Disc, Globe, Sun, RefreshCw, Skull, Trophy, Sparkles, Swords, User, Globe as GlobeIcon, Sword } from 'lucide-react';
import io from 'socket.io-client';

// --- CONFIGURATION ---
const BACKEND_URL = import.meta.env.PROD 
  ? "https://wizbattle.onrender.com/" 
  : "http://localhost:3001";

const socket = io.connect(BACKEND_URL);

// --- ASSETS & DATA ---
const MOVES = {
  LOAD: { id: 'load', name: 'Charge', cost: 0, power: 0, type: 'utility', icon: Zap, color: 'text-yellow-300', bg: 'from-yellow-600/80 to-amber-800/60', border: 'border-yellow-400/80', shadow: 'shadow-yellow-500/50', desc: 'Gain 1 Energy.' },
  SHIELD: { id: 'shield', name: 'Shield', cost: 0, power: 0, type: 'defense', icon: Shield, color: 'text-blue-300', bg: 'from-blue-600/80 to-indigo-800/60', border: 'border-blue-400/80', shadow: 'shadow-blue-500/50', desc: 'Blocks Fireball & Beam.' },
  FIREBALL: { id: 'fireball', name: 'Fireball', cost: 1, power: 1, type: 'attack', icon: Flame, color: 'text-orange-300', bg: 'from-orange-600/80 to-red-800/60', border: 'border-orange-400/80', shadow: 'shadow-orange-500/50', desc: '1 Load. Blockable.' },
  BEAM: { id: 'beam', name: 'Beam', cost: 2, power: 2, type: 'attack', icon: Sun, color: 'text-cyan-300', bg: 'from-cyan-600/80 to-blue-800/60', border: 'border-cyan-400/80', shadow: 'shadow-cyan-500/50', desc: '2 Loads. Blockable.' },
  REBOUND: { id: 'rebound', name: 'Rebound', cost: 2, power: 0, type: 'counter', icon: RefreshCw, color: 'text-purple-300', bg: 'from-purple-600/80 to-fuchsia-800/60', border: 'border-purple-400/80', shadow: 'shadow-purple-500/50', desc: 'Reflects attacks.' },
  DISC: { id: 'disc', name: 'Destructo', cost: 3, power: 3, type: 'attack', icon: Disc, color: 'text-pink-300', bg: 'from-pink-600/80 to-rose-800/60', border: 'border-pink-400/80', shadow: 'shadow-pink-500/50', desc: 'Pierces Shield.' },
  KAYOKEN: { id: 'kayoken', name: 'Kayoken', cost: 0, req: 4, power: 0, type: 'special', icon: Sparkles, color: 'text-red-300', bg: 'from-red-700/90 to-orange-800/70', border: 'border-red-500/80', shadow: 'shadow-red-600/60', desc: 'Dodge + 3 Energy.' },
  SPIRIT: { id: 'spirit', name: 'Spirit Bomb', cost: 5, power: 5, type: 'attack', icon: Globe, color: 'text-sky-300', bg: 'from-sky-600/80 to-indigo-900/70', border: 'border-sky-400/80', shadow: 'shadow-sky-500/60', desc: 'Massive Damage.' },
  DRAGON: { id: 'dragon', name: 'Dragon Fist', cost: 8, power: 8, type: 'attack', icon: Trophy, color: 'text-amber-200', bg: 'from-amber-500/90 to-yellow-800/80', border: 'border-amber-300/90', shadow: 'shadow-amber-400/70', desc: 'Wins Game.' }
};

const INITIAL_ENERGY = 0;

// --- ANIMATION STYLES ---
const styles = `
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
    
  @keyframes shoot-up-smooth {
    0% { transform: translateY(0) scale(0.8); opacity: 0; }
    10% { opacity: 1; transform: translateY(-20px) scale(1); }
    100% { transform: translateY(-300px) scale(1.5); opacity: 0; }
  }
  @keyframes shoot-down-smooth {
    0% { transform: translateY(0) scale(0.8); opacity: 0; }
    10% { opacity: 1; transform: translateY(20px) scale(1); }
    100% { transform: translateY(300px) scale(1.5); opacity: 0; }
  }
  
  @keyframes boom-flash {
    0% { transform: scale(0); opacity: 1; }
    40% { transform: scale(1.5); opacity: 1; }
    100% { transform: scale(2); opacity: 0; }
  }

  @keyframes shake-screen {
    0% { transform: translate(1px, 1px) rotate(0deg); }
    10% { transform: translate(-1px, -2px) rotate(-1deg); }
    20% { transform: translate(-3px, 0px) rotate(1deg); }
    30% { transform: translate(3px, 2px) rotate(0deg); }
    40% { transform: translate(1px, -1px) rotate(1deg); }
    50% { transform: translate(-1px, 2px) rotate(-1deg); }
    60% { transform: translate(-3px, 1px) rotate(0deg); }
    70% { transform: translate(3px, 1px) rotate(-1deg); }
    80% { transform: translate(-1px, -1px) rotate(1deg); }
    90% { transform: translate(1px, 2px) rotate(0deg); }
    100% { transform: translate(1px, -2px) rotate(-1deg); }
  }
  
  @keyframes pulse-gold {
    0% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(234, 179, 8, 0); }
    100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0); }
  }

  .animate-shake {
    animation: shake-screen 0.5s cubic-bezier(.36,.07,.19,.97) both;
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
  const [message, setMessage] = useState("Waiting for opponents...");
  const [winner, setWinner] = useState(null);
  const [wins, setWins] = useState({ p1: 0, p2: 0 });
  const [shake, setShake] = useState(false);
  
  const [p1Name, setP1Name] = useState("Player 1");
  const [p2Name, setP2Name] = useState("Player 2");

  useEffect(() => {
    socket.on("player_assignment", (role) => {
        setMyRole(role);
        if (role === 'p1') setMessage("Waiting for a challenger...");
    });

    socket.on("game_start", () => {
        setMessage("BATTLE START! Select a move.");
        setGameState('playing');
    });

    socket.on("room_full", () => {
        alert("Room Full!");
        setJoined(false);
    });

    socket.on("player_disconnected", () => {
        alert("Opponent Disconnected.");
        window.location.reload();
    });

    socket.on("waiting_for_opponent", () => {
        setMessage("Move Locked. Waiting for opponent...");
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
        setMessage("Resolving..."); 

        // Trigger shake on impact
        if (move1.type === 'attack' || move2.type === 'attack') {
             setTimeout(() => { setShake(true); }, 800);
             setTimeout(() => { setShake(false); }, 1300);
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
        alert("Enter Name and Room Code");
    }
  };

  const sendMove = (moveKey) => {
    if (gameState !== 'playing') return;
    const move = MOVES[moveKey];
    socket.emit("send_move", { room, move: { ...move, playerName }, player: myRole });
    setMessage("Waiting for opponent...");
  };

  // --- NEW FLAVOR TEXT LOGIC ---
  const getBattleFlavorText = (m1, m2, n1, n2, winner) => {
    const bothAtk = m1.type === 'attack' && m2.type === 'attack';
    const m1Atk = m1.type === 'attack';
    const m2Atk = m2.type === 'attack';

    // 1. Clash
    if (bothAtk && m1.power === m2.power) {
        if (m1.id === 'dragon') return "EARTH SHATTERING! Two Dragon Fists collide!";
        if (m1.id === 'beam') return "BEAM STRUGGLE! They cancel out perfectly!";
        return `CLASH! ${m1.name} meets ${m2.name} in mid-air!`;
    }

    // 2. Overpower
    if (bothAtk) {
        if (winner === 'p1') return `${n1}'s ${m1.name} tore through ${n2}'s ${m2.name}!`;
        return `${n2}'s ${m2.name} tore through ${n1}'s ${m1.name}!`;
    }

    // 3. Attack vs Defense/Utility
    if (m1Atk) {
        if (m2.id === 'kayoken') return `${n2} vanished! The ${m1.name} hit nothing!`;
        if (m2.id === 'rebound') return m1.id === 'dragon' ? `Dragon Fist CRUSHED the Rebound!` : `Ouch! ${n2} deflected the ${m1.name} back!`;
        if (m2.id === 'shield') return m1.power > 2 ? `${m1.name} SHATTERED ${n2}'s Shield!` : `${n2}'s Shield blocked the ${m1.name}.`;
        if (m2.id === 'load') return `Direct hit! ${n2} was caught charging!`;
        return `${n1} blasted ${n2} with ${m1.name}!`;
    }
    
    if (m2Atk) {
        if (m1.id === 'kayoken') return `${n1} vanished! The ${m2.name} hit nothing!`;
        if (m1.id === 'rebound') return m2.id === 'dragon' ? `Dragon Fist CRUSHED the Rebound!` : `Ouch! ${n1} deflected the ${m2.name} back!`;
        if (m1.id === 'shield') return m2.power > 2 ? `${m2.name} SHATTERED ${n1}'s Shield!` : `${n1}'s Shield blocked the ${m2.name}.`;
        if (m1.id === 'load') return `Direct hit! ${n1} was caught charging!`;
        return `${n2} blasted ${n1} with ${m2.name}!`;
    }

    // 4. Passives
    if (m1.id === 'load' && m2.id === 'load') return "The air hums as both wizards power up.";
    if (m1.id === 'shield' && m2.id === 'shield') return "A cautious standoff. No damage dealt.";
    if (m1.id === 'kayoken' && m2.id === 'kayoken') return "Blurring speeds! Both dodged nothing.";
    
    return "Tactical maneuvering... no clear hit.";
  };

  const resolveTurn = (move1, move2, name1, name2) => {
    let p1Death = false;
    let p2Death = false;
    let p1Net = 0;
    let p2Net = 0;
    let roundWinner = null;

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

    // Logic determination
    if (p1Atk && p2Atk) {
        if (move1.power > move2.power) { p2Death = true; roundWinner = 'p1'; }
        else if (move2.power > move1.power) { p1Death = true; roundWinner = 'p2'; }
    } else if (p1Atk) {
        if (move2.id === 'kayoken') { /* Miss */ }
        else if (move2.id === 'rebound') { 
            if (move1.id === 'dragon') { p2Death = true; roundWinner = 'p1'; }
            else { p1Death = true; roundWinner = 'p2'; }
        }
        else if (move2.id === 'shield') { 
            if (move1.power > 2) { p2Death = true; roundWinner = 'p1'; }
        }
        else { p2Death = true; roundWinner = 'p1'; }
    } else if (p2Atk) {
        if (move1.id === 'kayoken') { /* Miss */ }
        else if (move1.id === 'rebound') {
            if (move2.id === 'dragon') { p1Death = true; roundWinner = 'p2'; }
            else { p2Death = true; roundWinner = 'p1'; }
        }
        else if (move1.id === 'shield') {
            if (move2.power > 2) { p1Death = true; roundWinner = 'p2'; }
        }
        else { p1Death = true; roundWinner = 'p2'; }
    }

    const msg = getBattleFlavorText(move1, move2, name1, name2, roundWinner);

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
            setMessage("Select your next move!");
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
    setMessage("New Round Started!");
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
          group relative flex flex-col items-center justify-between p-2 rounded-xl border-2 transition-all duration-300 overflow-hidden
          ${!canAfford ? 'opacity-40 grayscale scale-95 border-slate-700 bg-slate-900/50' : `hover:-translate-y-1 hover:shadow-xl cursor-pointer bg-gradient-to-br ${move.bg} ${move.border} ${move.shadow}`}
        `}
      >
        <div className={`relative z-10 p-2 rounded-full bg-black/40 mb-1 ${move.color} border border-white/10 shadow-inner`}>
            <move.icon size={20} className="drop-shadow-sm" />
        </div>
        <span className={`relative z-10 font-black text-[10px] md:text-xs uppercase tracking-wider block ${move.color} drop-shadow-sm`}>{move.name}</span>
        
        <div className={`absolute top-0 right-0 rounded-bl-lg px-1.5 py-0.5 text-[10px] font-black text-white flex items-center justify-center border-l border-b border-white/20
            ${move.req ? 'bg-red-900/80' : (move.cost > 0 ? 'bg-blue-900/80' : 'bg-slate-800/80')}
        `}>
            {move.req ? '4+' : move.cost}
        </div>
      </button>
    );
  };

  if (!joined) {
    return (
        <div className="h-screen w-full bg-[#050a18] flex flex-col items-center justify-center text-white relative overflow-hidden font-sans">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_var(--tw-gradient-stops))] from-purple-900/40 via-[#050a18] to-black z-0"></div>
            <div className="z-10 flex flex-col items-center gap-8 scale-110">
                <div className="text-center">
                    <h1 className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-500 to-red-600 drop-shadow-lg tracking-tighter">WIZ BATTLES</h1>
                    <p className="text-blue-300 font-bold tracking-[0.4em] mt-2 text-sm uppercase">Arcane Arena</p>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl border-2 border-indigo-500/50 shadow-2xl flex flex-col gap-6 w-[350px]">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-indigo-300 font-black uppercase ml-1">Wizard Name</label>
                        <input placeholder="e.g. Gandalf" className="bg-[#0a0f20] border-2 border-slate-700 p-3 rounded-xl text-white outline-none font-bold focus:border-indigo-500 transition-colors" onChange={(e) => setPlayerName(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-indigo-300 font-black uppercase ml-1">Arena Code</label>
                        <input placeholder="e.g. battle1" className="bg-[#0a0f20] border-2 border-slate-700 p-3 rounded-xl text-white outline-none font-bold focus:border-indigo-500 transition-colors" onChange={(e) => setRoom(e.target.value)} />
                    </div>
                    <button onClick={joinRoom} className="mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 py-3 rounded-xl font-black text-lg text-white uppercase tracking-widest hover:scale-[1.02] shadow-lg">Enter The Void</button>
                </div>
            </div>
        </div>
    );
  }

  const myName = playerName;
  const oppName = myRole === 'p1' ? p2Name : p1Name;

  return (
    <div className="h-screen max-h-screen w-full bg-[#030712] text-white font-sans flex flex-col items-center overflow-hidden relative">
      <style>{styles}</style>
      
      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-[#050a18] to-black"></div>
          <div className="absolute inset-0 opacity-30 pointer-events-none">
             {[...Array(20)].map((_, i) => (<div key={i} className="particle" style={{ left: `${Math.random()*100}%`, width: `${Math.random()*3}px`, height: `${Math.random()*3}px`, animationDuration: `${Math.random()*10+5}s`, animationDelay: `-${Math.random()*5}s`, background: i%2===0 ? 'cyan':'violet' }}></div>))}
          </div>
      </div>

      {/* --- TOP BAR --- */}
      <div className="w-full shrink-0 h-16 relative z-20 flex justify-between items-center px-4">
        {/* Left: Title */}
        <div className="flex items-center gap-2">
             <div className="bg-yellow-500/10 border border-yellow-500/30 p-1.5 rounded-lg"><Sparkles size={16} className="text-yellow-400" /></div>
             <span className="font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-orange-400 hidden sm:block">WIZ BATTLES</span>
        </div>

        {/* CENTER: VS HEADER (Absolute Center) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-4 bg-black/40 px-6 py-2 rounded-full border border-white/5 backdrop-blur-md">
             <span className="text-blue-400 font-black text-sm md:text-base drop-shadow-md truncate max-w-[100px]">{p1Name}</span>
             <span className="text-white/80 font-black text-xl italic mx-1 animate-pulse">VS</span>
             <span className="text-red-400 font-black text-sm md:text-base drop-shadow-md truncate max-w-[100px]">{p2Name}</span>
        </div>

        {/* Right: Scores */}
        <div className="flex gap-4 text-xs font-bold uppercase tracking-wider">
            <div className="flex flex-col items-end">
                <span className="text-slate-500 text-[9px]">Score</span>
                <div className="flex gap-1 items-center">
                    <span className="text-blue-400 text-lg">{wins.p1}</span>
                    <span className="text-slate-700">-</span>
                    <span className="text-red-400 text-lg">{wins.p2}</span>
                </div>
            </div>
        </div>
      </div>

      {/* --- BATTLE ARENA --- */}
      <div className={`flex-1 w-full max-w-4xl flex flex-col relative justify-evenly py-2 px-4 z-10 ${shake ? 'animate-shake' : ''}`}>
          
          <BattleAnimations gameState={gameState} p1Move={p1Move} p2Move={p2Move} myRole={myRole} />

          {/* OPPONENT (Top) */}
          <PlayerDisplay name={oppName} role={myRole === 'p1' ? 'p2' : 'p1'} energy={myRole === 'p1' ? p2Energy : p1Energy} move={myRole === 'p1' ? p2Move : p1Move} isWinner={winner === (myRole === 'p1' ? 'p2' : 'p1')} gameState={gameState} isSelf={false} />

          {/* NARRATIVE BAR (Center) */}
          <div className="w-full flex justify-center my-2 relative z-20 h-16 items-center">
             <div className="px-6 py-3 bg-gradient-to-r from-slate-900/90 to-indigo-950/90 backdrop-blur-md border border-indigo-500/30 rounded-full shadow-2xl text-center min-w-[300px] max-w-[95%]">
                <span className="text-sm md:text-lg font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-white to-yellow-100">
                    {message}
                </span>
             </div>
          </div>

          {/* SELF (Bottom) */}
          <PlayerDisplay name={myName} role={myRole} energy={myRole === 'p1' ? p1Energy : p2Energy} move={myRole === 'p1' ? p1Move : p2Move} isWinner={winner === myRole} gameState={gameState} isSelf={true} />
      </div>

      {/* --- CONTROLS --- */}
      <div className="w-full shrink-0 bg-[#0a0f20]/90 backdrop-blur-lg p-4 pb-8 rounded-t-[2rem] border-t border-indigo-500/20 relative z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="max-w-5xl mx-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-9 gap-2 relative z-10">
                {Object.keys(MOVES).map(key => renderCard(key))}
            </div>
      </div>

      {/* --- GAME OVER OVERLAY (ABSOLUTE CENTER) --- */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-[boom-flash_0.3s_ease-out]">
            <div className="scale-150 flex flex-col items-center gap-6 p-10 bg-gradient-to-b from-indigo-900/50 to-black/80 rounded-3xl border-2 border-yellow-500/50 shadow-[0_0_100px_rgba(234,179,8,0.3)]">
                 <Trophy size={64} className="text-yellow-400 animate-bounce" />
                 <h2 className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-200 to-orange-500 drop-shadow-xl">
                    {winner === 'draw' ? 'DRAW' : (winner === myRole ? 'VICTORY' : 'DEFEAT')}
                 </h2>
                 <p className="text-blue-200 font-bold uppercase tracking-widest">{winner === myRole ? "You dominated the arena!" : "Better luck next time..."}</p>
                 <button onClick={restartGame} className="mt-4 px-10 py-4 bg-white text-black rounded-full font-black text-xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                    PLAY AGAIN
                 </button>
            </div>
        </div>
      )}
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
            {selfMove?.type === 'attack' && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center justify-center animate-[shoot-up-smooth_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
                    <div className={`p-4 rounded-full bg-gradient-to-t ${selfMove.bg} shadow-[0_0_30px_rgba(255,255,255,0.4)] border-2 border-white`}>
                        <selfMove.icon size={40} className="text-white" />
                    </div>
                </div>
            )}
            {enemyMove?.type === 'attack' && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 flex items-center justify-center animate-[shoot-down-smooth_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
                    <div className={`p-4 rounded-full bg-gradient-to-b ${enemyMove.bg} shadow-[0_0_30px_rgba(255,255,255,0.4)] border-2 border-white`}>
                        <enemyMove.icon size={40} className="text-white" />
                    </div>
                </div>
            )}
            {selfMove?.type === 'attack' && enemyMove?.type === 'attack' && selfMove.power === enemyMove.power && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-[boom-flash_0.5s_ease-out_forwards]">
                    <Swords size={80} className="text-white" />
                </div>
            )}
        </div>
    );
};

const PlayerDisplay = ({ name, role, energy, move, isWinner, gameState, isSelf }) => {
    const isShielding = gameState === 'resolution' && move?.id === 'shield';
    const isLoading = gameState === 'resolution' && move?.id === 'load';

    return (
        <div className={`flex flex-col items-center relative w-full shrink-0 z-10 transition-all duration-500 ${isWinner ? 'scale-110' : ''}`}>
            
            {/* Status Bar */}
            <div className={`mb-3 flex flex-col items-center gap-1 bg-[#0a0f20]/80 px-5 py-2 rounded-xl border transition-all duration-300 shadow-lg relative overflow-hidden backdrop-blur-md
                ${isSelf ? 'border-blue-500/30' : 'border-red-500/30'}
            `}>
                <span className={`text-xs font-black uppercase tracking-widest ${isSelf ? 'text-blue-300' : 'text-red-300'}`}>{name}</span>
                <div className="flex gap-1">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className={`h-2 w-2 rounded-full transition-all duration-300 ${i < energy ? (isSelf ? 'bg-cyan-400 shadow-[0_0_8px_cyan]' : 'bg-red-500 shadow-[0_0_8px_red]') : 'bg-white/10'}`} />
                    ))}
                </div>
            </div>

            {/* Avatar */}
            <div className={`relative w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-500 shadow-2xl bg-[#050a18]
                ${gameState === 'resolution' && move?.type === 'attack' ? 'scale-110 border-white' : 'border-slate-700'}
                ${isWinner ? 'border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.6)]' : ''}
            `}>
                 {isShielding && <div className="absolute inset-[-10px] rounded-full border-2 border-blue-400 bg-blue-500/20 animate-pulse" />}
                 {isLoading && <div className="absolute inset-[-8px] rounded-full border-2 border-yellow-400 opacity-0 animate-[pulse-gold_1s_infinite]" />}

                 {isWinner ? <Trophy className="text-yellow-300 w-10 h-10 animate-bounce" /> : 
                  isSelf ? <User className="text-cyan-300 w-10 h-10" /> : <Skull className="text-red-400 w-10 h-10" />
                 }
            </div>

            {/* Spell Text Bubble */}
            <div className={`absolute ${isSelf ? 'right-[10%]' : 'left-[10%]'} top-1/2 -translate-y-1/2 transition-all duration-500 z-30
                ${(gameState === 'resolution' || gameState === 'gameover' || (isSelf && move)) ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
            `}>
                {move && (
                    <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl shadow-xl flex items-center gap-2">
                        {!isSelf && gameState !== 'resolution' && gameState !== 'gameover' ? (
                             <span className="text-xs text-slate-400 italic font-bold">...</span>
                        ) : (
                            <>
                                <move.icon size={16} className={move.color} />
                                <span className={`font-black text-xs uppercase ${move.color}`}>{move.name}</span>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default function App() { return <WizBattles />; }