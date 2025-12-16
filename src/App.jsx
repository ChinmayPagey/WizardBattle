import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Zap, Flame, Disc, Globe, Sun, RefreshCw, Trophy, Sparkles, Swords, Skull } from 'lucide-react';
import io from 'socket.io-client';

// --- CONFIGURATION ---
const BACKEND_URL = import.meta.env.PROD 
  ? "https://wizbattle.onrender.com/" 
  : "http://localhost:3001";

const socket = io.connect(BACKEND_URL);

// --- MOVES DATA ---
const MOVES = {
  LOAD: { id: 'load', name: 'Charge', cost: 0, power: 0, type: 'utility', icon: Zap, color: 'text-yellow-400', bg: 'from-yellow-600 to-amber-800' },
  SHIELD: { id: 'shield', name: 'Shield', cost: 0, power: 0, type: 'defense', icon: Shield, color: 'text-blue-400', bg: 'from-blue-600 to-indigo-800' },
  FIREBALL: { id: 'fireball', name: 'Fireball', cost: 1, power: 1, type: 'attack', icon: Flame, color: 'text-orange-400', bg: 'from-orange-600 to-red-800' },
  BEAM: { id: 'beam', name: 'Beam', cost: 2, power: 2, type: 'attack', icon: Sun, color: 'text-cyan-400', bg: 'from-cyan-600 to-blue-800' },
  REBOUND: { id: 'rebound', name: 'Rebound', cost: 2, power: 0, type: 'counter', icon: RefreshCw, color: 'text-purple-400', bg: 'from-purple-600 to-fuchsia-800' },
  DISC: { id: 'disc', name: 'Destructo', cost: 3, power: 3, type: 'attack', icon: Disc, color: 'text-pink-400', bg: 'from-pink-600 to-rose-800' },
  KAYOKEN: { id: 'kayoken', name: 'Kayoken', cost: 0, req: 4, power: 0, type: 'special', icon: Sparkles, color: 'text-red-400', bg: 'from-red-700 to-orange-800' },
  SPIRIT: { id: 'spirit', name: 'Spirit Bomb', cost: 5, power: 5, type: 'attack', icon: Globe, color: 'text-sky-400', bg: 'from-sky-600 to-indigo-900' },
  DRAGON: { id: 'dragon', name: 'Dragon Fist', cost: 8, power: 8, type: 'attack', icon: Trophy, color: 'text-amber-200', bg: 'from-amber-500 to-yellow-800' }
};

const INITIAL_ENERGY = 0;

// --- CSS STYLES ---
const styles = `
  /* WIZARD ANIMATIONS */
  @keyframes float-idle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
  
  /* Staff Movements */
  @keyframes staff-raise { 0% { transform: rotate(0deg); } 100% { transform: rotate(-90deg) translateY(-10px); } }
  @keyframes staff-point { 0% { transform: rotate(0deg); } 100% { transform: rotate(-45deg) translateX(10px); } }
  @keyframes staff-slam { 0% { transform: rotate(0deg); } 50% { transform: rotate(-100deg); } 100% { transform: rotate(0deg); } }

  /* Spell Effects */
  @keyframes lightning-strike {
    0% { height: 0; opacity: 0; }
    10% { height: 100%; opacity: 1; }
    20% { opacity: 0; }
    30% { opacity: 1; }
    100% { height: 100%; opacity: 0; }
  }
  
  @keyframes shield-form {
    0% { transform: scale(0); opacity: 0; }
    100% { transform: scale(1); opacity: 0.6; }
  }

  @keyframes spirit-grow {
    0% { transform: scale(0) translateY(0); opacity: 0; }
    50% { transform: scale(1) translateY(-80px); opacity: 1; }
    100% { transform: scale(1) translateY(-80px) translateX(200px); opacity: 0; }
  }

  @keyframes dragon-path {
    0% { transform: translateX(0) scale(0.5); opacity: 0; }
    20% { opacity: 1; }
    100% { transform: translateX(400px) scale(1.5); opacity: 0; }
  }

  @keyframes beam-stretch {
    0% { width: 0; opacity: 1; }
    20% { width: 100%; opacity: 1; }
    100% { width: 100%; opacity: 0; }
  }

  @keyframes aura-kayoken {
    0% { box-shadow: 0 0 10px #ef4444; }
    50% { box-shadow: 0 0 30px #22d3ee; }
    100% { box-shadow: 0 0 10px #eab308; }
  }
`;

// --- WIZARD FIGURE COMPONENT ---
const WizardFigure = ({ isSelf, move, gameState, isWinner }) => {
    // Determine animation states
    const isActing = gameState === 'resolution';
    
    // Default Idle
    let staffClass = "origin-[20%_80%]"; 
    let effect = null;
    let wizardClass = "animate-[float-idle_3s_infinite_ease-in-out]";

    if (isActing && move) {
        switch (move.id) {
            case 'load':
                staffClass += " animate-[staff-raise_0.5s_forwards]";
                effect = (
                    <div className="absolute -top-20 left-6 w-2 h-40 bg-yellow-300 shadow-[0_0_20px_yellow] origin-top animate-[lightning-strike_0.8s_ease-out]"></div>
                );
                break;
            case 'shield':
                staffClass += " animate-[staff-slam_0.5s_forwards]";
                effect = (
                    <div className="absolute -top-4 -left-4 w-32 h-32 rounded-full border-4 border-blue-400 bg-blue-500/20 shadow-[0_0_30px_blue] animate-[shield-form_0.5s_ease-out_forwards]"></div>
                );
                break;
            case 'fireball':
            case 'disc':
                staffClass += " animate-[staff-point_0.3s_forwards]";
                // Projectile is handled by StageAnimations, but we add a flash at tip
                effect = <div className={`absolute top-0 right-[-10px] w-8 h-8 rounded-full ${move.bg} blur-md animate-ping`}></div>;
                break;
            case 'beam':
                staffClass += " animate-[staff-point_0.3s_forwards]";
                effect = (
                     <div className="absolute top-2 left-12 h-4 bg-cyan-400 shadow-[0_0_15px_cyan] origin-left animate-[beam-stretch_1s_ease-out]" style={{ width: '400px' }}></div>
                );
                break;
            case 'kayoken':
                staffClass += " animate-[staff-point_0.5s_forwards]";
                effect = <div className="absolute inset-0 rounded-full animate-[aura-kayoken_1s_infinite]"></div>
                break;
            case 'spirit':
                staffClass += " animate-[staff-raise_0.5s_forwards]";
                effect = (
                    <div className="absolute -top-10 left-0 w-24 h-24 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-600 shadow-[0_0_50px_cyan] animate-[spirit-grow_1.5s_ease-in-out_forwards]"></div>
                );
                break;
            case 'dragon':
                staffClass += " animate-[staff-point_0.5s_forwards]";
                // Dragon handled in stage mostly, but we add a gold flare
                effect = <div className="absolute top-0 right-0 w-12 h-12 bg-amber-400 blur-xl animate-pulse"></div>
                break;
            default: break;
        }
    }

    if (isWinner) wizardClass += " animate-bounce";

    // Colors
    const robeColor = isSelf ? "fill-cyan-900 stroke-cyan-400" : "fill-red-950 stroke-red-500";
    const hatColor = isSelf ? "fill-slate-800 stroke-cyan-400" : "fill-slate-800 stroke-red-500";
    const staffColor = "stroke-amber-600";
    const gemColor = move ? move.color.replace('text-', 'fill-') : "fill-emerald-400";

    // Important: ENEMY is flipped via scale-x
    return (
        <div className={`relative w-24 h-48 flex items-end justify-center ${wizardClass} ${!isSelf ? '-scale-x-100' : ''}`}>
            {effect}
            
            <svg viewBox="0 0 100 200" className="w-full h-full drop-shadow-2xl overflow-visible">
                {/* ROBE / BODY */}
                <path d="M 30,180 L 70,180 L 60,80 L 40,80 Z" className={`${robeColor} stroke-2`} />
                
                {/* HEAD */}
                <circle cx="50" cy="70" r="15" className="fill-slate-200" />
                
                {/* HAT */}
                <path d="M 25,60 L 75,60 L 50,10 Z" className={`${hatColor} stroke-2`} />
                
                {/* STAFF ARM GROUP (Rotates based on move) */}
                <g className={`transition-transform duration-500 ${staffClass}`} style={{ transformOrigin: '50px 80px' }}>
                    {/* ARM */}
                    <line x1="50" y1="80" x2="70" y2="100" className={`${robeColor} stroke-[6]`} strokeLinecap="round" />
                    
                    {/* STAFF STICK */}
                    <line x1="70" y1="130" x2="70" y2="30" className={`${staffColor} stroke-[4]`} strokeLinecap="round" />
                    
                    {/* STAFF GEM */}
                    <circle cx="70" cy="30" r="6" className={`${gemColor} animate-pulse shadow-lg`} />
                </g>

                {/* EYES (Direction) */}
                <circle cx="55" cy="68" r="2" fill="black" />
            </svg>

            {/* GROUND SHADOW */}
            <div className="absolute bottom-0 w-20 h-4 bg-black/60 blur-md rounded-full"></div>
            
            {/* NAME TAG (Unflip text for enemy) */}
             <div className={`absolute -top-10 whitespace-nowrap ${!isSelf ? '-scale-x-100' : ''}`}>
                 <span className={`font-black uppercase text-xs px-2 py-1 rounded bg-black/60 border ${isSelf ? 'border-cyan-500 text-cyan-200' : 'border-red-500 text-red-200'}`}>
                    {isSelf ? "YOU" : "ENEMY"}
                 </span>
            </div>
        </div>
    );
};

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
  const [message, setMessage] = useState("Awaiting Challengers...");
  const [winner, setWinner] = useState(null);
  const [wins, setWins] = useState({ p1: 0, p2: 0 });
  const [p1Name, setP1Name] = useState("Player 1");
  const [p2Name, setP2Name] = useState("Player 2");

  // --- NARRATIVE ENGINE ---
  const getNarrative = (m1, m2, n1, n2, winner) => {
    // n1 is P1 (Left), n2 is P2 (Right)
    const bothAtk = m1.type === 'attack' && m2.type === 'attack';

    if (bothAtk && m1.power === m2.power) {
        if(m1.id === 'dragon') return "HEAVENS SHAKE! Two Dragon Fists collide!";
        return `CLASH! ${m1.name} meets ${m2.name} in a burst of light!`;
    }
    if (bothAtk) {
        return winner === 'p1' 
            ? `${n1}'s ${m1.name} obliterated ${n2}'s ${m2.name}!` 
            : `${n2}'s ${m2.name} overpowered ${n1}'s ${m1.name}!`;
    }
    
    // Attack vs Defense
    const attacker = m1.type === 'attack' ? n1 : n2;
    const defender = m1.type === 'attack' ? n2 : n1;
    const atkMove = m1.type === 'attack' ? m1 : m2;
    const defMove = m1.type === 'attack' ? m2 : m1;

    if (defMove.id === 'shield') {
        return atkMove.power > 2 
            ? `${atkMove.name} SHATTERED ${defender}'s Shield!` 
            : `${defender}'s barrier absorbed the ${atkMove.name}.`;
    }
    if (defMove.id === 'rebound') {
        return atkMove.id === 'dragon' 
            ? `Dragon Fist ignores the Rebound! ${defender} is crushed!` 
            : `${defender} deflected the ${atkMove.name} right back!`;
    }
    if (defMove.id === 'kayoken') return `${defender} vanished into a prism of light! ${atkMove.name} missed!`;
    if (defMove.id === 'load') return `Direct hit! ${defender} was caught channeling energy!`;

    return `The wizards circle each other... gathering power.`;
  };

  useEffect(() => {
    socket.on("player_assignment", (role) => setMyRole(role));
    socket.on("game_start", () => { setMessage("BATTLE START! Cast your spell!"); setGameState('playing'); });
    socket.on("room_full", () => { alert("Room Full!"); setJoined(false); });
    socket.on("player_disconnected", () => { alert("Opponent Left."); window.location.reload(); });
    socket.on("waiting_for_opponent", () => { setMessage("Spell Prepared. Waiting..."); setGameState('waiting'); });

    socket.on("round_complete", (data) => {
        const move1 = MOVES[data.p1Move.id.toUpperCase()];
        const move2 = MOVES[data.p2Move.id.toUpperCase()];
        const name1 = data.p1Move.playerName || "Player 1";
        const name2 = data.p2Move.playerName || "Player 2";
        
        setP1Name(name1); setP2Name(name2);
        setP1Move(move1); setP2Move(move2);
        setGameState('resolution');
        
        setTimeout(() => { resolveTurn(move1, move2, name1, name2); }, 2500); 
    });

    return () => {
        socket.off("player_assignment"); socket.off("game_start"); socket.off("round_complete"); socket.off("waiting_for_opponent"); socket.off("player_disconnected");
    }
  }, []);

  const joinRoom = () => {
    if (room && playerName) {
      socket.emit("join_room", room);
      if (myRole === 'p1') setP1Name(playerName);
      if (myRole === 'p2') setP2Name(playerName);
      setJoined(true);
    } else { alert("Name & Room required"); }
  };

  const sendMove = (moveKey) => {
    if (gameState !== 'playing') return;
    const move = MOVES[moveKey];
    socket.emit("send_move", { room, move: { ...move, playerName }, player: myRole });
    setMessage("Waiting...");
  };

  const resolveTurn = (move1, move2, name1, name2) => {
    let p1Death = false, p2Death = false, p1Net = 0, p2Net = 0, roundWinner = null;

    // Costs
    if (move1.id === 'load') p1Net += 1; else if (move1.id === 'kayoken') p1Net += 3; else p1Net -= move1.cost;
    if (move2.id === 'load') p2Net += 1; else if (move2.id === 'kayoken') p2Net += 3; else p2Net -= move2.cost;

    // Combat
    const p1Atk = move1.type === 'attack';
    const p2Atk = move2.type === 'attack';

    if (p1Atk && p2Atk) {
        if (move1.power > move2.power) { p2Death = true; roundWinner = 'p1'; }
        else if (move2.power > move1.power) { p1Death = true; roundWinner = 'p2'; }
    } else if (p1Atk) {
        if (move2.id === 'rebound') { 
            if (move1.id === 'dragon') { p2Death = true; roundWinner = 'p1'; } else { p1Death = true; roundWinner = 'p2'; }
        } else if (move2.id === 'shield') { 
            if (move1.power > 2) { p2Death = true; roundWinner = 'p1'; }
        } else if (move2.id !== 'kayoken') { p2Death = true; roundWinner = 'p1'; }
    } else if (p2Atk) {
         if (move1.id === 'rebound') {
            if (move2.id === 'dragon') { p1Death = true; roundWinner = 'p2'; } else { p2Death = true; roundWinner = 'p1'; }
        } else if (move1.id === 'shield') {
            if (move2.power > 2) { p1Death = true; roundWinner = 'p2'; }
        } else if (move1.id !== 'kayoken') { p1Death = true; roundWinner = 'p2'; }
    }

    const narrative = getNarrative(move1, move2, name1, name2, roundWinner);
    setMessage(narrative);

    setP1Energy(prev => Math.max(0, prev + p1Net));
    setP2Energy(prev => Math.max(0, prev + p2Net));

    if (p1Death || p2Death) {
        setGameState('gameover');
        if (p1Death && p2Death) setWinner('draw');
        else if (p1Death) { setWinner('p2'); setWins(w => ({...w, p2: w.p2+1})); }
        else { setWinner('p1'); setWins(w => ({...w, p1: w.p1+1})); }
    } else {
        setTimeout(() => {
            setGameState('playing'); setP1Move(null); setP2Move(null); setMessage("Select next spell!");
        }, 4000);
    }
  };

  const restartGame = () => { setGameState('playing'); setP1Energy(0); setP2Energy(0); setP1Move(null); setP2Move(null); setWinner(null); setMessage("Duel Restarted"); };
  const renderCard = (moveKey) => {
    const move = MOVES[moveKey];
    const myEnergy = myRole === 'p1' ? p1Energy : p2Energy;
    const canAfford = move.id === 'kayoken' ? myEnergy >= move.req : myEnergy >= move.cost;
    return (
      <button key={move.id} disabled={!canAfford || gameState !== 'playing'} onClick={() => sendMove(moveKey)}
        className={`group relative flex flex-col items-center justify-between p-2 rounded-xl border-2 transition-all duration-300 ${!canAfford ? 'opacity-40 grayscale scale-95 border-slate-700 bg-slate-900/50' : `hover:-translate-y-1 hover:shadow-xl cursor-pointer bg-gradient-to-br ${move.bg} border-white/20 shadow-lg`}`}>
        <div className={`relative z-10 p-2 rounded-full bg-black/40 mb-1 ${move.color} border border-white/10`}><move.icon size={20} /></div>
        <span className={`relative z-10 font-black text-[10px] uppercase text-white drop-shadow-md`}>{move.name}</span>
        <div className={`absolute top-0 right-0 rounded-bl-lg px-1.5 py-0.5 text-[10px] font-black text-white ${move.req ? 'bg-red-900' : (move.cost > 0 ? 'bg-blue-900' : 'bg-slate-800')}`}>{move.req ? '4+' : move.cost}</div>
      </button>
    );
  };

  if (!joined) return (
    <div className="h-screen w-full bg-[#050a18] flex flex-col items-center justify-center text-white relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-indigo-900/40 via-black to-black"></div>
        <h1 className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-purple-600 drop-shadow-2xl z-10 mb-8 tracking-tighter">WIZ BATTLES</h1>
        <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl border border-white/10 flex flex-col gap-4 w-[350px] z-10 shadow-2xl">
            <input placeholder="Wizard Name" className="bg-[#0a0f20] border border-slate-700 p-3 rounded-xl text-white font-bold outline-none focus:border-cyan-500" onChange={(e) => setPlayerName(e.target.value)} />
            <input placeholder="Room Code" className="bg-[#0a0f20] border border-slate-700 p-3 rounded-xl text-white font-bold outline-none focus:border-cyan-500" onChange={(e) => setRoom(e.target.value)} />
            <button onClick={joinRoom} className="bg-gradient-to-r from-cyan-600 to-blue-600 py-3 rounded-xl font-black text-white hover:scale-105 transition-transform uppercase tracking-widest">Enter Arena</button>
        </div>
    </div>
  );

  const myName = playerName;
  const oppName = myRole === 'p1' ? p2Name : p1Name;

  return (
    <div className="h-screen w-full bg-[#030712] text-white font-sans flex flex-col overflow-hidden relative selection:bg-none">
      <style>{styles}</style>
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-slate-900 via-[#050a18] to-black"></div>
      
      {/* HEADER */}
      <div className="relative z-20 w-full h-16 flex justify-between items-center px-6 bg-slate-950/80 border-b border-white/5 backdrop-blur-sm">
        <span className="font-black italic text-cyan-400 text-xl tracking-tighter">WIZ BATTLES</span>
        <div className="flex gap-4 font-bold text-xs uppercase text-slate-500">
             <span>Wins: <span className="text-white">{wins.p1}</span> - <span className="text-white">{wins.p2}</span></span>
        </div>
      </div>

      {/* BATTLE STAGE */}
      <div className="flex-1 relative flex items-end justify-between px-4 md:px-20 pb-20 max-w-7xl mx-auto w-full z-10">
          
          <StageAnimations gameState={gameState} p1Move={p1Move} p2Move={p2Move} myRole={myRole} />

          {/* LEFT: SELF */}
          <div className="flex flex-col items-center gap-4 relative z-20">
             <div className="flex flex-col items-center">
                <div className="flex gap-1 mb-2">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className={`w-3 h-1.5 rounded-sm ${i < (myRole === 'p1' ? p1Energy : p2Energy) ? 'bg-cyan-400 shadow-[0_0_8px_cyan]' : 'bg-slate-800'}`}></div>
                    ))}
                </div>
                <span className="text-cyan-400 font-black uppercase tracking-widest text-lg drop-shadow-md">{myName}</span>
             </div>
             <WizardFigure isSelf={true} move={myRole === 'p1' ? p1Move : p2Move} gameState={gameState} isWinner={winner === myRole} />
          </div>

          {/* MESSAGE CENTER */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-center w-full max-w-3xl z-30 pointer-events-none px-4">
             <h2 className="text-xl md:text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] leading-tight">
                {message}
             </h2>
          </div>

          {/* RIGHT: ENEMY */}
          <div className="flex flex-col items-center gap-4 relative z-20">
             <div className="flex flex-col items-center">
                <div className="flex gap-1 mb-2">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className={`w-3 h-1.5 rounded-sm ${i < (myRole === 'p1' ? p2Energy : p1Energy) ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-slate-800'}`}></div>
                    ))}
                </div>
                <span className="text-red-400 font-black uppercase tracking-widest text-lg drop-shadow-md">{oppName}</span>
             </div>
             <WizardFigure isSelf={false} move={myRole === 'p1' ? p2Move : p1Move} gameState={gameState} isWinner={winner === (myRole === 'p1' ? 'p2' : 'p1')} />
          </div>
      </div>

      {/* CONTROLS */}
      <div className="relative z-30 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 p-4 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
         <div className="max-w-4xl mx-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-9 gap-2">
            {Object.keys(MOVES).map(key => renderCard(key))}
         </div>
      </div>

      {/* GAME OVER */}
      {gameState === 'gameover' && (
         <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-500">
            <div className="bg-gradient-to-b from-slate-900 to-black border-2 border-yellow-500/50 p-12 rounded-3xl text-center flex flex-col gap-6 shadow-[0_0_100px_rgba(234,179,8,0.3)]">
                <Trophy size={64} className="text-yellow-400 mx-auto animate-bounce" />
                <h2 className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-600">
                    {winner === 'draw' ? 'DRAW' : (winner === myRole ? 'VICTORY' : 'DEFEAT')}
                </h2>
                <button onClick={restartGame} className="px-10 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-black text-xl rounded-full hover:scale-105 transition-transform uppercase tracking-widest shadow-lg">Play Again</button>
            </div>
         </div>
      )}
    </div>
  );
}

// --- PROJECTILE STAGE ---
const StageAnimations = ({ gameState, p1Move, p2Move, myRole }) => {
    if (gameState !== 'resolution') return null;

    // Self is Left (P1 if role is p1), Enemy is Right (P2 if role is p1)
    const selfMove = myRole === 'p1' ? p1Move : p2Move;
    const enemyMove = myRole === 'p1' ? p2Move : p1Move;

    const renderProjectile = (move, isSelf) => {
        if (!move || move.type !== 'attack') return null;
        
        // CSS classes for direction
        const animClass = isSelf 
            ? "left-24 animate-[dragon-path_1s_ease-in_forwards]" 
            : "right-24 animate-[dragon-path_1s_ease-in_forwards] -scale-x-100"; // Enemy shoots right-to-left
            
        if (move.id === 'dragon') {
            return (
                <div className={`absolute top-1/2 -translate-y-1/2 w-32 h-32 ${animClass}`}>
                     {/* SVG DRAGON SHAPE */}
                     <svg viewBox="0 0 100 50" className="w-full h-full drop-shadow-[0_0_20px_orange]">
                        <path d="M 10,25 Q 30,5 50,25 T 90,25 L 80,15 M 90,25 L 80,35" fill="none" stroke="gold" strokeWidth="4" />
                        <circle cx="90" cy="25" r="5" fill="red" />
                     </svg>
                </div>
            );
        }
        
        if (move.id === 'fireball' || move.id === 'disc') {
            return (
                <div className={`absolute top-1/2 -translate-y-1/2 ${animClass}`}>
                     <div className={`w-12 h-12 rounded-full ${move.bg} border-2 border-white shadow-[0_0_20px_currentColor] flex items-center justify-center`}>
                        <move.icon className="text-white animate-spin" size={24} />
                     </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
             {renderProjectile(selfMove, true)}
             {renderProjectile(enemyMove, false)}
             
             {/* Clash */}
             {selfMove?.type === 'attack' && enemyMove?.type === 'attack' && selfMove.power === enemyMove.power && (
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
                     <Swords size={96} className="text-white animate-ping" />
                     <div className="absolute inset-0 bg-white blur-3xl rounded-full scale-150 animate-pulse"></div>
                 </div>
             )}
        </div>
    );
};

export default function App() { return <WizBattles />; }