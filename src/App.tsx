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
  const [selectedGames, setSelectedGames] = useState<string[]>(['chess']);
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

  const handleSelectionChange = (newSelection: string[]) => {
    setSelectedGames(newSelection);
    
    // If current active game is not selected anymore, switch to first selected game
    if (newSelection.length > 0 && !newSelection.includes(activeGame)) {
      setActiveGame(newSelection[0]);
    }
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
              selectedGames={selectedGames}
              onSelectionChange={handleSelectionChange}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {selectedGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Gamepad2 className="w-16 h-16 text-gray-400" />
            <h2 className="text-2xl font-semibold text-gray-600">No games selected</h2>
            <p className="text-gray-500 text-center">
              Use the dropdown above to select games you want to play
            </p>
          </div>
        ) : (
          <>
            {/* Game Tabs */}
            {selectedGames.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-8 p-1 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200">
                {selectedGames.map((gameId) => {
                  const game = AVAILABLE_GAMES.find(g => g.id === gameId);
                  if (!game) return null;
                  
                  return (
                    <button
                      key={gameId}
                      onClick={() => setActiveGame(gameId)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        activeGame === gameId
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'text-gray-700 hover:bg-white/80 hover:shadow-sm'
                      }`}
                    >
                      <span className="mr-2">{game.icon}</span>
                      {game.name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Active Game */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-8">
              {renderGame(activeGame)}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;