import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { Game } from '../types/games';

interface GameSelectorProps {
  games: Game[];
  selectedGame: string;
  onSelectionChange: (gameId: string) => void;
}

const GameSelector: React.FC<GameSelectorProps> = ({
  games,
  selectedGame,
  onSelectionChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGameSelect = (gameId: string) => {
    onSelectionChange(gameId);
    setIsOpen(false);
  };

  const selectedGameData = games.find(game => game.id === selectedGame);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full md:w-64 px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">{selectedGameData?.icon}</span>
          <span className="text-gray-700 font-medium">{selectedGameData?.name}</span>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999]">
          <div className="max-h-64 overflow-y-auto">
            {games.map((game) => (
              <button
                key={game.id}
                onClick={() => handleGameSelect(game.id)}
                className={`w-full flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors text-left ${
                  selectedGame === game.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{game.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{game.name}</div>
                    <div className="text-xs text-gray-500">{game.description}</div>
                  </div>
                  {selectedGame === game.id && (
                    <Check className="w-4 h-4 text-blue-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameSelector;