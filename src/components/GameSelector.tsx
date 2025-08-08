import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { Game } from '../types/games';

interface GameSelectorProps {
  games: Game[];
  selectedGames: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

const GameSelector: React.FC<GameSelectorProps> = ({
  games,
  selectedGames,
  onSelectionChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredGames = games.filter(game =>
    game.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGameToggle = (gameId: string) => {
    if (selectedGames.includes(gameId)) {
      onSelectionChange(selectedGames.filter(id => id !== gameId));
    } else {
      onSelectionChange([...selectedGames, gameId]);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full md:w-80 px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="text-gray-700">
          {selectedGames.length === 0
            ? 'Select games to play'
            : `${selectedGames.length} game${selectedGames.length > 1 ? 's' : ''} selected`}
        </span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search games..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {filteredGames.map((game) => (
              <label
                key={game.id}
                className="flex items-center px-3 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedGames.includes(game.id)}
                  onChange={() => handleGameToggle(game.id)}
                  className="sr-only"
                />
                <div className={`flex-shrink-0 w-5 h-5 border-2 rounded mr-3 flex items-center justify-center transition-colors ${
                  selectedGames.includes(game.id)
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-gray-300 hover:border-blue-400'
                }`}>
                  {selectedGames.includes(game.id) && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{game.name}</div>
                  <div className="text-xs text-gray-500">{game.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameSelector;