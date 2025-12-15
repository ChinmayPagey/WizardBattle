# WizardBattle

A real-time multiplayer turn-based strategy game where wizards duel to the death! Built with React, Socket.io, and Tailwind CSS.

## How the Game Works

WizardBattle is a psychological strategy game. You and your opponent choose moves simultaneously, and the outcome is determined by the interactions between those moves.

### The Objective
Predict your opponent, manage your energy, and land a killing blow to win the round.

### Energy System
*   You start with **0 Energy**.
*   Some moves cost Energy.
*   Use **Charge** to gain energy.
*   If you don't have enough energy for a move, you cannot use it.

### Move List

| Move | Type | Cost | Effect |
| :--- | :--- | :--- | :--- |
| **Charge** | Utility | 0 | Gain **+1 Energy**. |
| **Shield** | Defense | 0 | Blocks **Fireball** and **Beam**. Breaks against stronger attacks. |
| **Fireball** | Attack | 1 | Basic attack (Power 1). Blockable. |
| **Beam** | Attack | 2 | Stronger attack (Power 2). Blockable. |
| **Rebound** | Counter | 2 | Reflects standard attacks back at the user! Kills the attacker. |
| **Destructo** | Attack | 3 | **Unblockable Shield Breaker** (Power 3). Pierces standard shields. |
| **Kayoken** | Special | 0 (Req 4) | Requires 4+ Energy to use. **Dodges all attacks** and grants **+3 Energy**. |
| **Spirit Bomb** | Attack | 5 | Massive damage (Power 5). |
| **Dragon Fist**| Attack | 8 | The Ultimate Move (Power 8). **Unstoppable.** Punches through Rebound. |

### Combat Mechanics

1.  **Attack vs Attack**: The move with higher **Power** wins. If Power is equal, they, **Clash** and cancel out.
2.  **Attack vs Shield**:
    *   **Fireball (1)** and **Beam (2)** are **BLOCKED**.
    *   **Destructo (3)**, **Spirit Bomb (5)**, and **Dragon Fist (8)** **BREAK** the shield and kill the defender.
3.  **Attack vs Rebound**:
    *   The Attacker dies! (Rebound reflects the attack).
    *   *Exception:* **Dragon Fist** crushes Rebound.
4.  **Attack vs Kayoken**:
    *   Kayoken dodges everything. No one dies.
5.  **Attack vs Charge**:
    *   The Charging player is defenseless and dies.

---

## Technology Stack

*   **Frontend**: React, Vite, Tailwind CSS, Lucide Icons
*   **Backend**: Node.js, Express, Socket.io
*   **Deployment**: Ready for Vercel (Frontend) and Render (Backend)

---

## How to Run Locally

You need to run the Frontend and the Backend in separate terminals.

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Backend Server
Open a terminal and run:
```bash
npm run server
```
*Server runs on port 3001*

### 3. Start the Frontend
Open a **new** terminal and run:
```bash
npm run dev
```
*Open the link provided (usually `http://localhost:5173`)*

### 4. Play!
Open the game in two different browser tabs (or use two different devices on the same network if configured) to simulate a multiplayer battle. Join the same Room Name to connect.
