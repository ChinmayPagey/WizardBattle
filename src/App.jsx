import React, { useState, useEffect } from 'react';
import { Shield, Zap, Flame, Disc, Globe, Sun, RefreshCw, Skull, Trophy, Sword, Sparkles } from 'lucide-react';
import io from 'socket.io-client';

const BACKEND_URL = import.meta.env.PROD
    ? "https://wiz-battles-server.onrender.com"
    : "http://localhost:3001";

const socket = io.connect(BACKEND_URL);

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

function WizBattles() {
    const [room, setRoom] = useState("");
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
            alert("This room is full! Try another name.");
            setJoined(false);
        });

        socket.on("player_disconnected", () => {
            alert("Opponent disconnected! The room has been closed.");
            alert("Opponent disconnected! The room has been closed.");
            window.location.reload();
        });

        socket.on("waiting_for_opponent", () => {
            setMessage("Move Locked. Waiting for opponent...");
            setMessage("Move Locked. Waiting for opponent...");
            setGameState('waiting');
        });

        socket.on("round_complete", (data) => {

            const move1 = MOVES[data.p1Move.id.toUpperCase()];
            const move2 = MOVES[data.p2Move.id.toUpperCase()];

            setP1Move(move1);
            setP2Move(move2);
            setGameState('resolution');

            setTimeout(() => {
                resolveTurn(move1, move2);
            }, 1000);
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
        if (room !== "") {
            socket.emit("join_room", room);
            setJoined(true);
        }
    };

    const sendMove = (moveKey) => {
        if (gameState !== 'playing') return;
        const move = MOVES[moveKey];
        socket.emit("send_move", { room, move, player: myRole });
        setMessage("Waiting for opponent...");
    };

    const resolveTurn = (move1, move2) => {
        let p1Death = false;
        let p2Death = false;
        let msg = "";
        let p1Net = 0;
        let p2Net = 0;

        if (move1.id === 'load') p1Net += 1;
        else if (move1.id === 'kayoken') p1Net += 3;
        else p1Net -= move1.cost;

        if (move2.id === 'load') p2Net += 1;
        else if (move2.id === 'kayoken') p2Net += 3;
        else p2Net -= move2.cost;

        const p1Atk = move1.type === 'attack';
        const p2Atk = move2.type === 'attack';

        if (p1Atk && p2Atk) {
            if (move1.power === move2.power) msg = "CLASH! Attacks Cancel!";
            else if (move1.power > move2.power) { msg = "P1 OVERPOWERS!"; p2Death = true; }
            else { msg = "P2 OVERPOWERS!"; p1Death = true; }
        } else if (p1Atk) {
            if (move2.id === 'kayoken') msg = "P2 Dodges!";
            else if (move2.id === 'rebound') {
                if (move1.id === 'dragon') { msg = "Dragon Fist Unstoppable! P2 Dies!"; p2Death = true; }
                else { msg = "P2 Rebounds! P1 Dies!"; p1Death = true; }
            } else if (move2.id === 'shield') {
                if (move1.power > 2) { msg = "Shield Broken! P2 Dies!"; p2Death = true; }
                else msg = "Blocked!";
            } else { msg = "Direct Hit on P2!"; p2Death = true; }
        } else if (p2Atk) {
            if (move1.id === 'kayoken') msg = "P1 Dodges!";
            else if (move1.id === 'rebound') {
                if (move2.id === 'dragon') { msg = "Dragon Fist Unstoppable! P1 Dies!"; p1Death = true; }
                else { msg = "P1 Rebounds! P2 Dies!"; p2Death = true; }
            } else if (move1.id === 'shield') {
                if (move2.power > 2) { msg = "Shield Broken! P1 Dies!"; p1Death = true; }
                else msg = "Blocked!";
            } else { msg = "Direct Hit on P1!"; p1Death = true; }
        } else {
            msg = "Energy charges...";
        }

        setP1Energy(prev => Math.max(0, prev + p1Net));
        setP2Energy(prev => Math.max(0, prev + p2Net));
        setMessage(msg);

        if (p1Death || p2Death) {
            setGameState('gameover');
            if (p1Death && p2Death) setWinner('draw');
            else if (p1Death) { setWinner('p2'); setWins(w => ({ ...w, p2: w.p2 + 1 })); }
            else { setWinner('p1'); setWins(w => ({ ...w, p1: w.p1 + 1 })); }
        } else {
            setTimeout(() => {
                setGameState('playing');
                setP1Move(null);
                setP2Move(null);
                setMessage("Choose your move!");
            }, 2000);
        }
    };

    const restartGame = () => {
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
                <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-white">
                    <h1 className="text-4xl font-bold mb-8 text-yellow-400">WIZ BATTLES ONLINE</h1>
                    <div className="bg-slate-900 p-8 rounded-2xl border border-slate-700 shadow-2xl flex flex-col gap-4">
                        <input
                            placeholder="Enter Room Name (e.g. 'arena1')"
                            className="bg-slate-800 border border-slate-600 p-3 rounded-lg text-white text-center text-xl outline-none focus:border-blue-500"
                            onChange={(event) => setRoom(event.target.value)}
                        />
                        <button
                            onClick={joinRoom}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 py-3 rounded-lg font-bold text-xl hover:scale-105 transition-transform"
                        >
                            JOIN ROOM
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="h-screen max-h-screen w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black text-white font-sans flex flex-col items-center overflow-hidden">

                <div className="w-full shrink-0 bg-slate-900/50 border-b border-white/10 p-3 flex justify-between items-center z-10">
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-black italic text-yellow-400">WIZ BATTLES</h1>
                        <span className="bg-blue-600 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">
                            {myRole === 'p1' ? 'You are P1' : 'You are P2'}
                        </span>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-blue-400 font-bold">P1: {wins.p1}</span>
                        <span className="text-red-400 font-bold">P2: {wins.p2}</span>
                    </div>
                </div>

                {/* Arena */}
                <div className="flex-1 w-full max-w-5xl flex flex-col relative justify-evenly py-2 px-4">

                    <PlayerDisplay
                        role={myRole === 'p1' ? 'p2' : 'p1'}
                        energy={myRole === 'p1' ? p2Energy : p1Energy}
                        move={myRole === 'p1' ? p2Move : p1Move}
                        isWinner={winner === (myRole === 'p1' ? 'p2' : 'p1')}
                        gameState={gameState}
                    />


                    <div className="w-full flex justify-center my-2">
                        <div className="px-6 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl text-center min-w-[280px]">
                            <span className="text-lg font-black italic text-yellow-200">{message}</span>
                        </div>
                    </div>

                    <PlayerDisplay
                        role={myRole}
                        energy={myRole === 'p1' ? p1Energy : p2Energy}
                        move={myRole === 'p1' ? p1Move : p2Move}
                        isWinner={winner === myRole}
                        gameState={gameState}
                        isSelf={true}
                    />
                </div>

                <div className="w-full shrink-0 bg-black/60 backdrop-blur-xl p-3 rounded-t-[2rem] border-t border-white/10 relative z-20">
                    {gameState === 'gameover' ? (
                        <div className="text-center py-4">
                            <h2 className="text-3xl font-bold mb-2">{winner === 'draw' ? 'DRAW' : (winner === myRole ? 'VICTORY' : 'DEFEAT')}</h2>
                            <button onClick={restartGame} className="bg-white text-black px-6 py-2 rounded-full font-bold">New Round</button>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-9 gap-1.5">
                            {Object.keys(MOVES).map(key => renderCard(key))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const PlayerDisplay = ({ role, energy, move, isWinner, gameState, isSelf }) => {
        return (
            <div className="flex flex-col items-center relative w-full shrink-0">
                {/* Energy Bar */}
                <div className="mb-2 flex items-center gap-2 bg-slate-900/80 px-3 py-1 rounded-full border border-white/5">
                    <span className={`text-[10px] font-bold uppercase ${isSelf ? 'text-blue-400' : 'text-red-400'}`}>
                        {isSelf ? 'YOU' : 'ENEMY'}
                    </span>
                    <div className="flex gap-0.5">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className={`h-2 w-2 rounded-[1px] transition-all ${i < energy ? (isSelf ? 'bg-cyan-400' : 'bg-red-500') : 'bg-slate-800'}`} />
                        ))}
                    </div>
                </div>

                {/* Avatar */}
                <div className={`
                relative w-20 h-20 rounded-2xl border-2 flex items-center justify-center transition-all shadow-2xl
                ${gameState === 'resolution' && move?.type === 'attack' ? 'scale-110 border-white shadow-white/20' : 'border-slate-700 bg-slate-800'}
                ${isWinner ? 'border-yellow-400 shadow-yellow-500/50' : ''}
            `}>
                    {isWinner ? <Trophy className="text-yellow-400 animate-bounce" /> :
                        isSelf ? <div className="text-cyan-400 font-black">HERO</div> : <Skull className="text-red-400" />
                    }
                </div>

                {/* Move Bubble */}
                <div className={`absolute ${isSelf ? '-right-24' : '-right-24'} top-1/2 -translate-y-1/2 transition-all duration-300
                ${(gameState === 'resolution' || gameState === 'gameover' || (isSelf && move)) ? 'opacity-100 translate-x-0' : 'opacity-0'}
            `}>
                    {move && (
                        <div className="bg-slate-800 border border-slate-600 px-3 py-1 rounded-lg flex items-center gap-2">
                            {(!isSelf && gameState !== 'resolution' && gameState !== 'gameover') ? (
                                <span className="text-xs text-slate-400 italic">Hidden</span>
                            ) : (
                                <>
                                    <move.icon size={14} className={move.color} />
                                    <span className="font-bold text-white text-xs">{move.name}</span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    export default function App() { return <WizBattles />; }