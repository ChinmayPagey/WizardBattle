import React, { useState, useEffect, useRef } from 'react';
import { Shield, Zap, Flame, Disc, Globe, Sun, RefreshCw, Skull, Trophy, Sparkles, Swords, User, Cpu, LogOut, Hash, MessageCircle, Send, Smile, ThumbsUp, Heart, Angry, Laugh, X, Book, Info, AlertTriangle } from 'lucide-react';
import io from 'socket.io-client';

// --- CONFIGURATION ---
const BACKEND_URL = import.meta.env.PROD
    ? "https://wizbattle.onrender.com/"
    : "http://localhost:3001";

const socket = io.connect(BACKEND_URL, { autoConnect: false });

// --- ASSETS & DATA ---
const MOVES = {
    LOAD: { id: 'load', name: 'Charge', cost: 0, power: 0, type: 'utility', icon: Zap, color: 'text-yellow-300', bg: 'from-yellow-600/80 to-amber-800/60', border: 'border-yellow-400/80', shadow: 'shadow-yellow-500/50', desc: 'Gain 1 Energy.' },
    SHIELD: { id: 'shield', name: 'Shield', cost: 0, power: 0, type: 'defense', icon: Shield, color: 'text-blue-300', bg: 'from-blue-600/80 to-indigo-800/60', border: 'border-blue-400/80', shadow: 'shadow-blue-500/50', desc: 'Blocks Fireball & Beam.' },
    FIREBALL: { id: 'fireball', name: 'Fireball', cost: 1, power: 1, type: 'attack', icon: Flame, color: 'text-orange-300', bg: 'from-orange-600/80 to-red-800/60', border: 'border-orange-400/80', shadow: 'shadow-orange-500/50', desc: 'Fireball!!' },
    BEAM: { id: 'beam', name: 'Beam', cost: 2, power: 2, type: 'attack', icon: Sun, color: 'text-cyan-300', bg: 'from-cyan-600/80 to-blue-800/60', border: 'border-cyan-400/80', shadow: 'shadow-cyan-500/50', desc: 'Light beam' },
    REBOUND: { id: 'rebound', name: 'Rebound', cost: 2, power: 0, type: 'counter', icon: RefreshCw, color: 'text-emerald-300', bg: 'from-emerald-600/80 to-teal-800/60', border: 'border-emerald-400/80', shadow: 'shadow-emerald-500/50', desc: 'Reflects attacks.' },
    DISC: { id: 'disc', name: 'Destructo', cost: 3, power: 3, type: 'attack', icon: Disc, color: 'text-pink-300', bg: 'from-pink-600/80 to-rose-800/60', border: 'border-pink-400/80', shadow: 'shadow-pink-500/50', desc: 'Pierces Shield.' },
    KAYOKEN: { id: 'kayoken', name: 'Kayoken', cost: 0, req: 4, power: 0, type: 'special', icon: Sparkles, color: 'text-red-300', bg: 'from-red-700/90 to-orange-800/70', border: 'border-red-500/80', shadow: 'shadow-red-600/60', desc: 'Dodge + 3 Energy.' },
    SPIRIT: { id: 'spirit', name: 'Spirit Bomb', cost: 5, power: 5, type: 'attack', icon: Globe, color: 'text-sky-300', bg: 'from-sky-600/80 to-indigo-900/70', border: 'border-sky-400/80', shadow: 'shadow-sky-500/60', desc: 'Massive Damage.' },
    DRAGON: { id: 'dragon', name: 'Dragon Fist', cost: 8, power: 8, type: 'attack', icon: Trophy, color: 'text-amber-200', bg: 'from-amber-500/90 to-yellow-800/80', border: 'border-amber-300/90', shadow: 'shadow-amber-400/70', desc: 'Unleash the dragon.' }
};

const INITIAL_ENERGY = 0;

const EMOJIS = [
    { id: 'thumbs', icon: ThumbsUp, label: 'Nice!', color: 'text-blue-400', bg: 'from-blue-500/80 to-blue-700/60' },
    { id: 'heart', icon: Heart, label: 'Love it', color: 'text-pink-400', bg: 'from-pink-500/80 to-rose-700/60' },
    { id: 'laugh', icon: Laugh, label: 'LOL', color: 'text-yellow-400', bg: 'from-yellow-500/80 to-amber-700/60' },
    { id: 'angry', icon: Angry, label: 'Grr!', color: 'text-red-400', bg: 'from-red-500/80 to-red-700/60' },
    { id: 'smile', icon: Smile, label: 'GG', color: 'text-green-400', bg: 'from-green-500/80 to-emerald-700/60' },
    { id: 'sparkle', icon: Sparkles, label: 'Wow!', color: 'text-amber-400', bg: 'from-amber-500/80 to-yellow-700/60' }
];

// --- STYLES ---
const styles = `
  @keyframes float-up {
    0% { transform: translateY(0px) scale(0.5); opacity: 0; }
    10% { opacity: 1; transform: translateY(-20px) scale(1); }
    80% { opacity: 1; }
    100% { transform: translateY(-150px) scale(1.1); opacity: 0; }
  }

  @keyframes float-down {
    0% { transform: translateY(0px) scale(0.5); opacity: 0; }
    10% { opacity: 1; transform: translateY(20px) scale(1); }
    80% { opacity: 1; }
    100% { transform: translateY(150px) scale(1.1); opacity: 0; }
  }

  .particle {
    position: absolute;
    background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
    border-radius: 50%;
    bottom: -20px;
    animation: drift 15s infinite linear;
  }
  @keyframes drift {
    0% { transform: translateY(0px); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(-800px); opacity: 0; }
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
    const [isBotMode, setIsBotMode] = useState(false);
    const [showRules, setShowRules] = useState(false);

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

    // Names
    const [p1Name, setP1Name] = useState("Player 1");
    const [p2Name, setP2Name] = useState("Player 2");

    // Chat and Emoji States
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [showChat, setShowChat] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [activeEmojis, setActiveEmojis] = useState([]);
    const chatEndRef = useRef(null);

    const gameStateRef = useRef({ p1Energy, p2Energy });
    useEffect(() => {
        gameStateRef.current = { p1Energy, p2Energy };
    }, [p1Energy, p2Energy]);

    // Auto-scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // --- SOCKET LISTENERS ---
    useEffect(() => {
        if (isBotMode) return;
        if (!joined) return;

        socket.connect();

        socket.on("player_assignment", (role) => {
            setMyRole(role);
            if (role === 'p1') setMessage(`Waiting for Challenger... Room: ${room}`);
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
            leaveGame();
        });

        socket.on("waiting_for_opponent", () => {
            setMessage("Move Locked. Waiting for opponent...");
            setGameState('waiting');
        });

        socket.on("round_complete", (data) => {
            handleRoundResolution(data.p1Move, data.p2Move);
        });

        socket.on("receive_chat", ({ message, playerName, timestamp, senderId }) => {
            const isSelf = senderId === socket.id;
            setChatMessages(prev => [...prev, { message, playerName, timestamp, id: Math.random(), isSelf }]);
        });

        socket.on("receive_emoji", ({ emoji, playerRole, timestamp, senderId }) => {
            const emojiData = EMOJIS.find(e => e.id === emoji);
            if (emojiData) {
                const id = Math.random();
                // Determine if this emoji is from us based on socket ID
                const isSelf = senderId === socket.id;
                setActiveEmojis(prev => [...prev, { ...emojiData, playerRole, id, timestamp, isSelf }]);
                setTimeout(() => {
                    setActiveEmojis(prev => prev.filter(e => e.id !== id));
                }, 2000); // Shortened for better performance
            }
        });

        return () => {
            socket.off("player_assignment");
            socket.off("game_start");
            socket.off("round_complete");
            socket.off("waiting_for_opponent");
            socket.off("player_disconnected");
            socket.off("receive_chat");
            socket.off("receive_emoji");
            socket.disconnect();
        }
    }, [isBotMode, joined, room]);

    // --- BOT LOGIC ---
    const botMemory = useRef({ playerMoves: [], consecutiveLoads: 0, aggressiveness: 0.5 });
    const getSmartBotMove = (botEnergy, playerEnergy) => {
        const moves = Object.values(MOVES);
        const affordable = moves.filter(m => (m.req ? botEnergy >= m.req : botEnergy >= m.cost));
        // Simplified strategy for brevity
        if (botEnergy >= 8) return MOVES.DRAGON;
        if (botEnergy === 0) return Math.random() > 0.3 ? MOVES.LOAD : MOVES.SHIELD;
        return affordable[Math.floor(Math.random() * affordable.length)] || MOVES.LOAD;
    };

    // --- GAMEPLAY FUNCTIONS ---

    const [showJoinInput, setShowJoinInput] = useState(false);

    const generateRoomCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const joinRoom = (roomCode) => {
        const codeToJoin = typeof roomCode === 'string' ? roomCode : room;

        if (codeToJoin !== "" && playerName !== "") {
            setIsBotMode(false);
            setJoined(true);
            setRoom(codeToJoin);
            socket.emit("join_room", codeToJoin);
            if (myRole === 'p1') setP1Name(playerName);
            else if (myRole === 'p2') setP2Name(playerName);

            // RESET CHAT ON JOIN
            setChatMessages([]);
            setActiveEmojis([]);
            setShowChat(false);
            setShowEmojiPicker(false);
            setChatInput("");
        } else {
            alert("Enter Name and Room Code");
        }
    };

    const createRoom = () => {
        if (playerName !== "") {
            const newCode = generateRoomCode();
            joinRoom(newCode);
        } else {
            alert("Enter Name");
        }
    };

    const startBotMode = () => {
        if (playerName !== "") {
            setIsBotMode(true);
            setJoined(true);
            setMyRole('p1');
            setP1Name(playerName);
            setP2Name("Bot Alpha");
            setGameState('playing');
            setMessage("BATTLE START! Select a move.");

            // RESET CHAT
            setChatMessages([]);
            setActiveEmojis([]);
            setShowChat(false);
            setShowEmojiPicker(false);
            setChatInput("");
        } else {
            alert("Enter Name");
        }
    }

    const leaveGame = () => {
        if (!isBotMode) {
            socket.disconnect();
        }
        setJoined(false);
        setGameState('menu');
        setWins({ p1: 0, p2: 0 });
        setP1Energy(INITIAL_ENERGY);
        setP2Energy(INITIAL_ENERGY);
        setMyRole(null);
        setMessage("Waiting for opponents...");
        setWinner(null);

        // RESET CHAT
        setChatMessages([]);
        setActiveEmojis([]);
        setShowChat(false);
        setShowEmojiPicker(false);
        setChatInput("");
    };

    const sendMove = (moveKey) => {
        if (gameState !== 'playing') return;
        const move = MOVES[moveKey];
        const playerMoveData = { ...move, playerName: playerName };

        if (isBotMode) {
            botMemory.current.playerMoves.push(move);
            if (botMemory.current.playerMoves.length > 10) botMemory.current.playerMoves.shift();

            setGameState('waiting');
            setMessage("Opponent is thinking...");

            setTimeout(() => {
                const botMove = getSmartBotMove(gameStateRef.current.p2Energy, gameStateRef.current.p1Energy);
                const botMoveData = { ...botMove, playerName: "Bot Alpha" };
                handleRoundResolution(playerMoveData, botMoveData);
            }, 800);
        } else {
            socket.emit("send_move", { room, move: playerMoveData, player: myRole });
            setMessage("Waiting for opponent...");
        }
    };

    const sendChatMessage = () => {
        if (!chatInput.trim() || chatInput.length > 200) return;

        if (isBotMode) {
            setChatMessages(prev => [...prev, { message: chatInput, playerName: playerName, timestamp: Date.now(), id: Math.random(), isSelf: true }]);
            if (Math.random() > 0.7) {
                setTimeout(() => {
                    setChatMessages(prev => [...prev, { message: "Nice move!", playerName: "Bot Alpha", timestamp: Date.now(), id: Math.random(), isSelf: false }]);
                }, 1500);
            }
        } else {
            socket.emit("send_chat", { room, message: chatInput, playerName });
        }
        setChatInput("");
    };

    const sendEmoji = (emojiId) => {
        if (isBotMode) {
            const emojiData = EMOJIS.find(e => e.id === emojiId);
            if (emojiData) {
                const id = Math.random();
                setActiveEmojis(prev => [...prev, { ...emojiData, playerRole: myRole, id, timestamp: Date.now(), isSelf: true }]);
                setTimeout(() => { setActiveEmojis(prev => prev.filter(e => e.id !== id)); }, 2000);
            }
            if (Math.random() > 0.6) {
                setTimeout(() => {
                    const randomEmoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
                    const botId = Math.random();
                    setActiveEmojis(prev => [...prev, { ...randomEmoji, playerRole: 'p2', id: botId, timestamp: Date.now(), isSelf: false }]);
                    setTimeout(() => { setActiveEmojis(prev => prev.filter(e => e.id !== botId)); }, 2000);
                }, 1000);
            }
        } else {
            socket.emit("send_emoji", { room, emoji: emojiId, playerRole: myRole });
        }
        setShowEmojiPicker(false);
    };

    const handleRoundResolution = (move1Data, move2Data) => {
        const move1 = MOVES[move1Data.id.toUpperCase()];
        const move2 = MOVES[move2Data.id.toUpperCase()];

        const name1 = isBotMode ? p1Name : (move1Data.playerName || "Player 1");
        const name2 = isBotMode ? p2Name : (move2Data.playerName || "Player 2");

        if (!isBotMode) {
            setP1Name(name1);
            setP2Name(name2);
        }

        setP1Move(move1);
        setP2Move(move2);
        setGameState('resolution');
        setMessage("Resolving...");

        if (move1.type === 'attack' || move2.type === 'attack') {
            setTimeout(() => { setShake(true); }, 800);
            setTimeout(() => { setShake(false); }, 1300);
        }

        setTimeout(() => {
            resolveTurn(move1, move2, name1, name2);
        }, 1500);
    };

    // Flavor text logic
    const getBattleFlavorText = (m1, m2, n1, n2, winner) => {
        if (m1.type === 'attack' && m2.type === 'attack') {
            if (m1.power === m2.power) return `CLASH! ${m1.name} meets ${m2.name}!`;
            return winner === 'p1' ? `${n1}'s ${m1.name} overpowers!` : `${n2}'s ${m2.name} overpowers!`;
        }
        if (m1.type === 'attack') {
            if (m2.id === 'shield') return m1.power > 2 ? `${m1.name} SHATTERED Shield!` : `Blocked by Shield.`;
            if (m2.id === 'rebound') return m1.power > 5 ? `Attack CRUSHED Rebound!` : `Attack reflected!`;
            if (m2.id === 'kayoken') return `Missed! ${n2} dodged!`;
            return `${n1} hits with ${m1.name}!`;
        }
        if (m2.type === 'attack') {
            if (m1.id === 'shield') return m2.power > 2 ? `${m2.name} SHATTERED Shield!` : `Blocked by Shield.`;
            if (m1.id === 'rebound') return m2.power > 5 ? `Attack CRUSHED Rebound!` : `Attack reflected!`;
            if (m1.id === 'kayoken') return `Missed! ${n1} dodged!`;
            return `${n2} hits with ${m2.name}!`;
        }
        return "Tactical maneuvering...";
    };

    const resolveTurn = (move1, move2, name1, name2) => {
        let p1Death = false;
        let p2Death = false;
        let p1Net = 0;
        let p2Net = 0;
        let roundWinner = null;

        if (move1.id === 'load') p1Net += 1; else if (move1.id === 'kayoken') p1Net += 3; else p1Net -= move1.cost;
        if (move2.id === 'load') p2Net += 1; else if (move2.id === 'kayoken') p2Net += 3; else p2Net -= move2.cost;

        const p1Atk = move1.type === 'attack';
        const p2Atk = move2.type === 'attack';

        if (p1Atk && p2Atk) {
            if (move1.power === move2.power) { roundWinner = 'clash'; }
            else if (move1.power > move2.power) { p2Death = true; roundWinner = 'p1'; }
            else { p1Death = true; roundWinner = 'p2'; }
        } else if (p1Atk) {
            if (move2.id === 'kayoken') { }
            else if (move2.id === 'rebound') {
                if (move1.id === 'dragon') { p2Death = true; roundWinner = 'p1'; } else { p1Death = true; roundWinner = 'p2'; }
            } else if (move2.id === 'shield') {
                if (move1.power > 2) { p2Death = true; roundWinner = 'p1'; }
            } else { p2Death = true; roundWinner = 'p1'; }
        } else if (p2Atk) {
            if (move1.id === 'kayoken') { }
            else if (move1.id === 'rebound') {
                if (move2.id === 'dragon') { p1Death = true; roundWinner = 'p2'; } else { p2Death = true; roundWinner = 'p1'; }
            } else if (move1.id === 'shield') {
                if (move2.power > 2) { p1Death = true; roundWinner = 'p2'; }
            } else { p1Death = true; roundWinner = 'p2'; }
        }

        const msg = getBattleFlavorText(move1, move2, name1, name2, roundWinner);
        setP1Energy(prev => Math.max(0, prev + p1Net));
        setP2Energy(prev => Math.max(0, prev + p2Net));

        if (p1Death || p2Death) {
            if (p1Death) {
                setWinner('p2');
                setWins(w => ({ ...w, p2: w.p2 + 1 }));
                setMessage(`${name2} WINS!`);
            } else {
                setWinner('p1');
                setWins(w => ({ ...w, p1: w.p1 + 1 }));
                setMessage(`${name1} WINS!`);
            }
            setTimeout(() => { setGameState('gameover'); }, 2500);
        } else {
            setMessage(msg);
            setTimeout(() => {
                setGameState('playing');
                setP1Move(null);
                setP2Move(null);
                setMessage("Select your next move!");
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
                className={`group relative flex flex-col items-center justify-between p-2 rounded-xl border-2 transition-all duration-300 overflow-hidden ${!canAfford ? 'opacity-40 grayscale scale-95 border-slate-700 bg-slate-900/50' : `hover:-translate-y-1 hover:shadow-xl cursor-pointer bg-gradient-to-br ${move.bg} ${move.border} ${move.shadow}`}`}
            >
                <div className={`relative z-10 p-2 rounded-full bg-black/40 mb-1 ${move.color} border border-white/10 shadow-inner`}>
                    <move.icon size={20} className="drop-shadow-sm" />
                </div>
                <span className={`relative z-10 font-black text-[10px] md:text-xs uppercase tracking-wider block ${move.color} drop-shadow-sm`}>{move.name}</span>
                <div className={`absolute top-0 right-0 rounded-bl-lg px-1.5 py-0.5 text-[10px] font-black text-white flex items-center justify-center border-l border-b border-white/20 ${move.req ? 'bg-red-900/80' : (move.cost > 0 ? 'bg-blue-900/80' : 'bg-slate-800/80')}`}>
                    {move.req ? '4+' : move.cost}
                </div>
            </button>
        );
    };

    if (!joined) {
        return (
            <div className="h-[100dvh] w-full bg-[#050a18] flex flex-col items-center justify-center text-white relative overflow-hidden font-sans">
                <RuleBookModal show={showRules} onClose={() => setShowRules(false)} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_var(--tw-gradient-stops))] from-cyan-900/40 via-[#050a18] to-black z-0"></div>
                <div className="z-10 flex flex-col items-center gap-8 scale-100 sm:scale-110">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-500 to-indigo-600 drop-shadow-lg tracking-tighter">WIZ BATTLES</h1>
                        <p className="text-cyan-300 font-bold tracking-[0.4em] mt-2 text-xs md:text-sm uppercase">Arcane Arena</p>
                    </div>
                    {/* ... (Login Form remains mostly the same) ... */}
                    <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl border-2 border-cyan-500/50 shadow-2xl flex flex-col gap-6 w-[320px] md:w-[350px]">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs text-cyan-300 font-black uppercase ml-1">Wizard Name</label>
                            <input type="text" name="wizard_username_game_field" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" placeholder="e.g. Gandalf" className="bg-[#0a0f20] border-2 border-slate-700 p-3 rounded-xl text-white outline-none font-bold focus:border-cyan-500 transition-colors" onChange={(e) => setPlayerName(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={startBotMode} className="flex-1 group relative flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl border border-slate-600 hover:border-cyan-400 transition-all">
                                <Cpu size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                                <span className="font-bold text-slate-200 uppercase tracking-wider text-xs md:text-sm">Practice</span>
                            </button>
                            <button onClick={() => setShowRules(true)} className="group flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 rounded-xl border border-slate-600 hover:border-yellow-400 transition-all">
                                <Book size={18} className="text-yellow-400 group-hover:scale-110 transition-transform" />
                                <span className="font-bold text-slate-200 uppercase tracking-wider text-xs md:text-sm">Rules</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-px bg-slate-700 flex-1"></div>
                            <span className="text-xs text-slate-500 font-bold uppercase">OR ONLINE</span>
                            <div className="h-px bg-slate-700 flex-1"></div>
                        </div>

                        {!showJoinInput ? (
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={createRoom} className="bg-gradient-to-r from-cyan-600 to-blue-600 py-4 rounded-xl font-black text-sm text-white uppercase tracking-wider hover:scale-[1.02] shadow-lg flex flex-col items-center gap-1">
                                    <Zap size={20} className="text-yellow-300" />
                                    Create Room
                                </button>
                                <button onClick={() => setShowJoinInput(true)} className="bg-slate-800 border-2 border-slate-700 hover:border-cyan-500 py-4 rounded-xl font-black text-sm text-slate-300 hover:text-white uppercase tracking-wider hover:scale-[1.02] transition-all flex flex-col items-center gap-1">
                                    <Hash size={20} className="text-cyan-400" />
                                    Join Room
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs text-cyan-300 font-black uppercase ml-1">Enter Room Code</label>
                                        <button onClick={() => setShowJoinInput(false)} className="text-[10px] text-slate-500 hover:text-white uppercase font-bold underline">Cancel</button>
                                    </div>
                                    <input type="text" name="room_code_field" autoComplete="off" autoCorrect="off" autoCapitalize="characters" spellCheck="false" autoFocus placeholder="e.g. X8J9L2" className="bg-[#0a0f20] border-2 border-slate-700 p-3 rounded-xl text-white outline-none font-bold text-center tracking-widest focus:border-cyan-500 transition-colors uppercase text-lg" onChange={(e) => setRoom(e.target.value.toUpperCase())} />
                                </div>
                                <button onClick={() => joinRoom()} className="bg-gradient-to-r from-cyan-600 to-blue-600 py-3 rounded-xl font-black text-lg text-white uppercase tracking-widest hover:scale-[1.02] shadow-lg">
                                    Join Battle
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const myName = myRole === 'p1' ? p1Name : p2Name;
    const oppName = myRole === 'p1' ? p2Name : p1Name;

    return (
        // USE 100dvh for mobile to prevent address bar scrolling
        <div className="h-[100dvh] w-full bg-[#030712] text-white font-sans flex flex-col items-center overflow-hidden relative overscroll-none touch-none">
            <style>{styles}</style>
            <RuleBookModal show={showRules} onClose={() => setShowRules(false)} />

            {/* BACKGROUND */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#050a18] to-black"></div>
                <div className="absolute inset-0 opacity-30 pointer-events-none">
                    {[...Array(20)].map((_, i) => (<div key={i} className="particle" style={{ left: `${Math.random() * 100}%`, width: `${Math.random() * 3}px`, height: `${Math.random() * 3}px`, animationDuration: `${Math.random() * 10 + 5}s`, animationDelay: `-${Math.random() * 5}s`, background: i % 2 === 0 ? 'cyan' : 'gold' }}></div>))}
                </div>
            </div>

            {/* --- TOP BAR (FIXED FOR MOBILE LAYOUT) --- */}
            {/* Uses Flexbox (not Grid, not Absolute) to guarantee NO overlapping */}
            <div className="w-full shrink-0 h-14 md:h-16 relative z-20 flex justify-between items-center px-3 md:px-4 bg-black/20 backdrop-blur-sm border-b border-white/5">

                {/* 1. Left: Title & Rules */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="bg-yellow-500/10 border border-yellow-500/30 p-1.5 rounded-lg shrink-0">
                        <Sparkles size={16} className="text-yellow-400" />
                    </div>
                    <span className="font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-blue-400 hidden md:block">WIZ BATTLES</span>
                    <button onClick={() => setShowRules(true)} className="md:hidden bg-slate-800 p-1.5 rounded-md border border-slate-700 text-slate-300 shrink-0">
                        <Book size={14} />
                    </button>
                </div>

                {/* 2. Center: VS Header */}
                {/* Constrained width to prevent it from pushing left/right elements out */}
                <div className="flex items-center justify-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-md mx-1 shrink-0 max-w-[55%] md:max-w-none">
                    <div className="flex items-center gap-1 min-w-0">
                        <span className="text-blue-400 font-black text-xs md:text-base drop-shadow-md truncate">{p1Name}</span>
                        <span className="text-slate-400 font-bold text-xs md:text-sm shrink-0">({wins.p1})</span>
                    </div>
                    <span className="text-white/80 font-black text-xs md:text-xl italic animate-pulse text-yellow-500 shrink-0">VS</span>
                    <div className="flex items-center gap-1 min-w-0">
                        <span className="text-slate-400 font-bold text-xs md:text-sm shrink-0">({wins.p2})</span>
                        <span className="text-red-400 font-black text-xs md:text-base drop-shadow-md truncate">{p2Name}</span>
                    </div>
                </div>

                {/* 3. Right: Room & Exit */}
                <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
                    {!isBotMode && (
                        <div className="flex flex-col items-end mr-1 flex">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Room</span>
                            <span className="text-sm font-black text-cyan-400 flex items-center gap-1 select-all cursor-pointer" onClick={() => { navigator.clipboard.writeText(room); alert("Room ID Copied!") }}>
                                <Hash size={12} className="opacity-50" /> {room}
                            </span>
                        </div>
                    )}
                    <button onClick={leaveGame} className="group flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all shrink-0">
                        <LogOut size={14} className="text-red-400 md:w-4 md:h-4" />
                        <span className="text-xs font-bold text-red-400 hidden md:block uppercase">Exit</span>
                    </button>
                </div>
            </div>

            {/* --- BATTLE ARENA --- */}
            <div className={`flex-1 w-full max-w-4xl flex flex-col relative justify-evenly py-2 px-4 z-10 min-h-0 ${shake ? 'animate-shake' : ''}`}>

                <BattleAnimations gameState={gameState} p1Move={p1Move} p2Move={p2Move} myRole={myRole} />

                {/* OPPONENT (Top) */}
                <PlayerDisplay name={oppName} role={myRole === 'p1' ? 'p2' : 'p1'} energy={myRole === 'p1' ? p2Energy : p1Energy} move={myRole === 'p1' ? p2Move : p1Move} isWinner={winner === (myRole === 'p1' ? 'p2' : 'p1')} gameState={gameState} isSelf={false} />

                {/* NARRATIVE BAR (Center) */}
                <div className="w-full flex justify-center my-2 relative z-20 h-12 md:h-16 items-center">
                    <div className={`px-6 py-2 md:py-3 backdrop-blur-md border rounded-full shadow-2xl text-center min-w-[280px] md:min-w-[300px] max-w-[95%] transition-colors duration-500 ${gameState === 'gameover' ? 'bg-gradient-to-r from-yellow-900/90 to-amber-950/90 border-yellow-500/50' : 'bg-gradient-to-r from-slate-900/90 to-cyan-950/90 border-cyan-500/30'}`}>
                        <span className={`text-xs md:text-lg font-black italic text-transparent bg-clip-text ${gameState === 'gameover' ? 'bg-gradient-to-r from-yellow-100 via-yellow-300 to-yellow-100 animate-pulse' : 'bg-gradient-to-r from-cyan-100 via-white to-cyan-100'}`}>
                            {message}
                        </span>
                    </div>
                </div>

                {/* SELF (Bottom) */}
                <PlayerDisplay name={myName} role={myRole} energy={myRole === 'p1' ? p1Energy : p2Energy} move={myRole === 'p1' ? p1Move : p2Move} isWinner={winner === myRole} gameState={gameState} isSelf={true} />
            </div>

            {/* --- CONTROLS --- */}
            <div className="w-full shrink-0 bg-[#0a0f20]/90 backdrop-blur-lg p-3 md:p-4 pb-6 rounded-t-[2rem] border-t border-cyan-500/20 relative z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-all duration-300">
                {gameState === 'gameover' ? (
                    <div className="flex justify-center items-center py-4">
                        <button onClick={restartGame} className="flex items-center gap-3 px-10 py-4 bg-white text-black rounded-full font-black text-xl hover:scale-105 hover:bg-yellow-300 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                            <RefreshCw size={24} className={shake ? "animate-spin" : ""} />
                            REMATCH
                        </button>
                    </div>
                ) : (
                    <div className="max-w-5xl mx-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-9 gap-2 relative z-10">
                        {Object.keys(MOVES).map(key => renderCard(key))}
                    </div>
                )}
            </div>

            {/* --- CHAT BOX --- */}
            <div className={`fixed right-4 bottom-24 z-40 transition-all duration-300 ${showChat ? 'translate-x-0' : 'translate-x-[calc(100%+2rem)]'}`}>
                <div className="bg-slate-900/95 backdrop-blur-xl border-2 border-cyan-500/30 rounded-2xl shadow-2xl w-72 md:w-80 h-80 md:h-96 flex flex-col">
                    <div className="flex items-center justify-between p-3 border-b border-cyan-500/20">
                        <div className="flex items-center gap-2">
                            <MessageCircle size={18} className="text-cyan-400" />
                            <span className="font-bold text-sm text-white">Chat</span>
                        </div>
                        <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                        {chatMessages.map((msg) => (
                            <div key={msg.id} className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}>
                                <span className="text-[9px] text-slate-500 mb-0.5">{msg.playerName}</span>
                                <div className={`px-2.5 py-1.5 rounded-lg max-w-[85%] break-words ${msg.isSelf ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                                    <p className="text-xs md:text-sm">{msg.message}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-3 border-t border-cyan-500/20">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value.slice(0, 200))}
                                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                                placeholder="Type message..."
                                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs md:text-sm text-white outline-none focus:border-cyan-500 transition-colors"
                            />
                            <button onClick={sendChatMessage} disabled={!chatInput.trim()} className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed p-2 rounded-lg transition-colors">
                                <Send size={16} className="text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <button onClick={() => setShowChat(!showChat)} className="fixed right-4 bottom-4 z-40 bg-cyan-600 hover:bg-cyan-500 p-3 rounded-full shadow-lg transition-all hover:scale-110 active:scale-90">
                <MessageCircle size={24} className="text-white" />
                {chatMessages.length > 0 && !showChat && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">!</div>
                )}
            </button>

            {/* --- EMOJI PICKER --- */}
            {showEmojiPicker && (
                <div className="fixed left-1/2 bottom-32 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-xl border-2 border-amber-500/30 rounded-2xl shadow-2xl p-4 w-[280px]">
                    <div className="flex items-center gap-3 mb-3">
                        <Smile size={18} className="text-amber-400" />
                        <span className="font-bold text-sm text-white">Reactions</span>
                        <button onClick={() => setShowEmojiPicker(false)} className="ml-auto text-slate-400 hover:text-white"><X size={16} /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {EMOJIS.map((emoji) => (
                            <button key={emoji.id} onClick={() => sendEmoji(emoji.id)} className={`group flex flex-col items-center gap-1 p-2 rounded-xl bg-gradient-to-br ${emoji.bg} border border-white/10 hover:scale-105 transition-all`}>
                                <emoji.icon size={20} className={emoji.color} />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="fixed left-4 bottom-4 z-40 bg-amber-500 hover:bg-amber-400 p-3 rounded-full shadow-lg transition-all hover:scale-110 active:scale-90">
                <Smile size={24} className="text-white" />
            </button>

            {/* --- ACTIVE EMOJIS OVERLAY (FIXED POSITIONING & PHYSICS) --- */}
            <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                {activeEmojis.map((emoji) => {
                    const isMyEmoji = emoji.isSelf !== undefined ? emoji.isSelf : (emoji.playerRole === myRole);
                    // Position emojis specifically near the avatars
                    // Self: Bottom Right | Opponent: Top Left
                    const initialClass = isMyEmoji
                        ? 'bottom-28 right-[15%] animate-[float-up_2s_ease-out_forwards]'
                        : 'top-28 left-[15%] animate-[float-down_2s_ease-out_forwards]';

                    return (
                        <div
                            key={emoji.id}
                            className={`absolute ${initialClass}`}
                        >
                            <div className={`p-3 rounded-full bg-gradient-to-br ${emoji.bg} border-2 border-white shadow-2xl backdrop-blur-sm`}>
                                <emoji.icon size={28} className={`${emoji.color} drop-shadow-lg`} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// --- NEW COMPONENT: RULEBOOK ---
const RuleBookModal = ({ show, onClose }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[boom-flash_0.2s_ease-out]">
            <div className="bg-[#0f172a] w-full max-w-4xl max-h-[85vh] rounded-3xl border-2 border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.2)] flex flex-col relative overflow-hidden">

                {/* Header */}
                <div className="p-4 md:p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800">
                    <div className="flex items-center gap-3">
                        <Book className="text-yellow-400" size={28} />
                        <h2 className="text-xl md:text-3xl font-black italic text-white tracking-wide">WIZARD'S GUIDE</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} className="text-slate-400 hover:text-white" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="overflow-y-auto p-4 md:p-6 space-y-8 custom-scrollbar">

                    {/* Section 1: The Basics */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Info className="text-blue-400" size={20} />
                            <h3 className="text-lg md:text-xl font-bold text-blue-300 uppercase tracking-wider">How To Play</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                                <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                                    <strong className="text-white">Simultaneous Turns:</strong> Both players choose a move at the same time. You cannot see what your opponent picks until the turn resolves.
                                </p>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                                <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                                    <strong className="text-white">Energy Management:</strong> Moves cost energy (loads). You must Charge to gain energy. Plan your attack strategy based on the charges you have!
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Move List (Grid) */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="text-yellow-400" size={20} />
                            <h3 className="text-lg md:text-xl font-bold text-yellow-300 uppercase tracking-wider">The Spellbook</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.values(MOVES).map((move) => (
                                <div key={move.id} className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-lg border border-white/5 relative overflow-hidden group hover:border-white/20 transition-all">
                                    <div className={`p-2 rounded-full bg-black/40 ${move.color} border border-white/10 shrink-0`}>
                                        <move.icon size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className={`font-bold text-sm uppercase ${move.color}`}>{move.name}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${move.cost === 0 && !move.req ? 'bg-slate-700 text-slate-300' : 'bg-blue-900 text-blue-200'}`}>
                                                {move.req ? `REQ: ${move.req}` : `COST: ${move.cost}`}
                                            </span>
                                        </div>
                                        <p className="text-[10px] md:text-[11px] text-slate-400 leading-tight">{move.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 3: Interactions (Logic) */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="text-red-400" size={20} />
                            <h3 className="text-lg md:text-xl font-bold text-red-300 uppercase tracking-wider">Battle Logic</h3>
                        </div>

                        <div className="grid gap-3 text-xs md:text-sm">
                            <div className="bg-slate-800 p-3 rounded-xl flex flex-col md:flex-row gap-2 md:gap-4 items-start md:items-center justify-between border-l-4 border-orange-500">
                                <div className="font-bold text-white w-full md:w-1/3">ATTACK vs ATTACK</div>
                                <div className="text-slate-300 flex-1">
                                    Higher power wins. If equal, they <span className="text-orange-400 font-bold">CLASH</span> and cancel out.
                                </div>
                            </div>

                            <div className="bg-slate-800 p-3 rounded-xl flex flex-col md:flex-row gap-2 md:gap-4 items-start md:items-center justify-between border-l-4 border-blue-500">
                                <div className="font-bold text-white w-full md:w-1/3">SHIELDING</div>
                                <div className="text-slate-300 flex-1">
                                    Blocks any attack with Power 2 or less (Fireball, Beam). <br />
                                    <span className="text-pink-400 font-bold">DESTRUCTO DISC</span>  (Power 3) or higher breaks shields!
                                </div>
                            </div>

                            <div className="bg-slate-800 p-3 rounded-xl flex flex-col md:flex-row gap-2 md:gap-4 items-start md:items-center justify-between border-l-4 border-emerald-500">
                                <div className="font-bold text-white w-full md:w-1/3">REBOUND</div>
                                <div className="text-slate-300 flex-1">
                                    Reflects any attack with Power 5 or less back at the user.<br />
                                    <span className="text-amber-400 font-bold">DRAGON FIST</span> (Power 8) crushes Rebound.
                                </div>
                            </div>

                            <div className="bg-slate-800 p-3 rounded-xl flex flex-col md:flex-row gap-2 md:gap-4 items-start md:items-center justify-between border-l-4 border-red-500">
                                <div className="font-bold text-white w-full md:w-1/3">KAYOKEN</div>
                                <div className="text-slate-300 flex-1">
                                    The ultimate dodge. Avoids <span className="text-white font-bold underline">ANY</span> incoming attack and instantly charges +3 Energy.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-slate-900 flex justify-center shrink-0">
                    <button onClick={onClose} className="px-8 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-widest rounded-lg transition-colors">
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENTS ---

const BattleAnimations = ({ gameState, p1Move, p2Move, myRole }) => {
    if (gameState !== 'resolution' && gameState !== 'gameover' && gameState !== 'playing') return null;
    if (!p1Move || !p2Move) return null;
    if (gameState === 'playing') return null;

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
    const isShielding = (gameState === 'resolution' || gameState === 'gameover') && move?.id === 'shield';
    const isLoading = (gameState === 'resolution' || gameState === 'gameover') && move?.id === 'load';

    return (
        <div className={`flex flex-col items-center relative w-full shrink-0 z-10 transition-all duration-500 ${isWinner ? 'scale-110' : ''}`}>
            <div className={`mb-3 flex flex-col items-center gap-1 bg-[#0a0f20]/80 px-5 py-2 rounded-xl border transition-all duration-300 shadow-lg relative overflow-hidden backdrop-blur-md
                ${isSelf ? 'border-blue-500/30' : 'border-red-500/30'}
            `}>
                <span className={`text-xs font-black uppercase tracking-widest ${isSelf ? 'text-blue-300' : 'text-red-300'}`}>{name}</span>
                <div className="flex gap-1">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className={`h-1.5 w-1.5 md:h-2 md:w-2 rounded-full transition-all duration-300 ${i < energy ? (isSelf ? 'bg-cyan-400 shadow-[0_0_8px_cyan]' : 'bg-red-500 shadow-[0_0_8px_red]') : 'bg-white/10'}`} />
                    ))}
                </div>
            </div>

            <div className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full border-4 flex items-center justify-center transition-all duration-500 shadow-2xl bg-[#050a18]
                ${(gameState === 'resolution' || gameState === 'gameover') && move?.type === 'attack' ? 'scale-110 border-white' : 'border-slate-700'}
                ${isWinner ? 'border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.6)]' : ''}
            `}>
                {isShielding && <div className="absolute inset-[-10px] rounded-full border-2 border-blue-400 bg-blue-500/20 animate-pulse" />}
                {isLoading && <div className="absolute inset-[-8px] rounded-full border-2 border-yellow-400 opacity-0 animate-[pulse-gold_1s_infinite]" />}

                {isWinner ? <Trophy className="text-yellow-300 w-8 h-8 md:w-10 md:h-10 animate-bounce" /> :
                    isSelf ? <User className="text-cyan-300 w-8 h-8 md:w-10 md:h-10" /> : <Skull className="text-red-400 w-8 h-8 md:w-10 md:h-10" />
                }
            </div>

            <div className={`absolute ${isSelf ? 'right-[5%] md:right-[10%]' : 'left-[5%] md:left-[10%]'} top-1/2 -translate-y-1/2 transition-all duration-500 z-30
                ${(gameState === 'resolution' || gameState === 'gameover' || (isSelf && move)) ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
            `}>
                {move && (
                    <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 px-3 py-1 md:px-4 md:py-2 rounded-xl shadow-xl flex items-center gap-2">
                        {!isSelf && gameState !== 'resolution' && gameState !== 'gameover' ? (
                            <span className="text-xs text-slate-400 italic font-bold">...</span>
                        ) : (
                            <>
                                <move.icon size={16} className={move.color} />
                                <span className={`font-black text-[10px] md:text-xs uppercase ${move.color}`}>{move.name}</span>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default function App() { return <WizBattles />; }