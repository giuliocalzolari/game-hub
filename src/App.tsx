import React, { useState } from 'react';
import { Gamepad2 } from 'lucide-react';
import GameSelector from './components/GameSelector';
import Chess from './components/games/Chess';
import Dama from './components/games/Dama';
import Tris from './components/games/Tris';
import SnakesAndLadders from './components/games/SnakesAndLadders';
import { Game } from './types/games';

const AVAILABLE_GAMES: Game[] = [
  {
    id: 'chess',
    name: 'Chess',
    description: 'Strategic board game with pieces and tactics',
    icon: '♔',
  },
  {
    id: 'dama',
    name: 'Dama (Checkers)',
    description: 'Jump and capture opponent pieces',
    icon: '⚫',
  },
  {
    id: 'tris',
    name: 'Tris (Tic-Tac-Toe)',
    description: 'Get three in a row to win',
    icon: '❌',
  },
  {
    id: 'snakes-and-ladders',
    name: 'Snakes and Ladders',
    description: 'Roll dice and climb to victory',
    icon: '🎲',
  },
];

function App() {
  const [selectedGame, setSelectedGame] = useState<string>('chess');
  const [activeGame, setActiveGame] = useState<string>('chess');

  const renderGame = (gameId: string) => {
    switch (gameId) {
      case 'chess':
        return <Chess />;
      case 'dama':
        return <Dama />;
      case 'tris':
        return <Tris />;
      case 'snakes-and-ladders':
        return <SnakesAndLadders />;
      default:
        return <div>Game not found</div>;
    }
  };

  const handleSelectionChange = (gameId: string) => {
    setSelectedGame(gameId);
    setActiveGame(gameId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Gamepad2 className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">GameHub</h1>
            </div>
            
            <GameSelector
              games={AVAILABLE_GAMES}
              selectedGame={selectedGame}
              onSelectionChange={handleSelectionChange}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Active Game */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-8">
          {renderGame(activeGame)}
        </div>
      </main>
    </div>
  );
}

export default App;