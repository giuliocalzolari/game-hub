import React, { useState, useCallback } from 'react';
import { Dice6 } from 'lucide-react';
import { SnakesAndLaddersPlayer } from '../../types/games';

interface SnakesAndLaddersProps {
  isBotEnabled: boolean;
}

const SnakesAndLadders: React.FC<SnakesAndLaddersProps> = ({ isBotEnabled }) => {
  const [players] = useState<SnakesAndLaddersPlayer[]>([
    { id: '1', name: 'Player 1', position: 1, color: 'bg-blue-500' },
    { id: '2', name: 'Bot Player', position: 1, color: 'bg-red-500' },
  ]);
  
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [gameBoard, setGameBoard] = useState<SnakesAndLaddersPlayer[]>(players);
  const [winner, setWinner] = useState<string | null>(null);

  // Snakes and Ladders positions (simplified)
  const snakes: Record<number, number> = {
    16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78
  };
  
  const ladders: Record<number, number> = {
    1: 38, 4: 14, 9: 21, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100
  };

  const rollDice = useCallback(async () => {
    if (isRolling || winner) return;
    
    // Auto-roll for bot player
    if (isBotEnabled && currentPlayerIndex === 1) {
      // Add a small delay for bot moves
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setIsRolling(true);
    
    // Animate dice roll
    for (let i = 0; i < 10; i++) {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const finalDiceValue = Math.floor(Math.random() * 6) + 1;
    setDiceValue(finalDiceValue);
    
    // Move current player
    const currentPlayer = gameBoard[currentPlayerIndex];
    let newPosition = Math.min(currentPlayer.position + finalDiceValue, 100);
    
    // Check for snakes or ladders
    if (snakes[newPosition]) {
      newPosition = snakes[newPosition];
    } else if (ladders[newPosition]) {
      newPosition = ladders[newPosition];
    }
    
    const newGameBoard = [...gameBoard];
    newGameBoard[currentPlayerIndex] = { ...currentPlayer, position: newPosition };
    
    setGameBoard(newGameBoard);
    
    // Check for winner
    if (newPosition === 100) {
      setWinner(currentPlayer.name);
    } else {
      // Next player's turn
      setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
    }
    
    setIsRolling(false);
  }, [isRolling, winner, gameBoard, currentPlayerIndex, players.length]);

  // Auto-roll for bot player
  React.useEffect(() => {
    if (isBotEnabled && currentPlayerIndex === 1 && !isRolling && !winner) {
      const timeout = setTimeout(() => {
        rollDice();
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [isBotEnabled, currentPlayerIndex, isRolling, winner, rollDice]);

  const resetGame = () => {
    setGameBoard(players.map(p => ({ ...p, position: 1 })));
    setCurrentPlayerIndex(0);
    setDiceValue(null);
    setWinner(null);
  };

  const getSquareContent = (squareNumber: number) => {
    const playersHere = gameBoard.filter(p => p.position === squareNumber);
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span className="text-xs font-medium text-gray-700">{squareNumber}</span>
        {playersHere.map((player, index) => (
          <div
            key={player.id}
            className={`absolute w-3 h-3 rounded-full ${player.color} border border-white`}
            style={{
              top: `${index * 4 + 2}px`,
              right: `${index * 4 + 2}px`,
            }}
          />
        ))}
        {snakes[squareNumber] && (
          <div className="absolute top-0 left-0 w-full h-full bg-red-200 opacity-30 flex items-center justify-center">
            <span className="text-xs">🐍</span>
          </div>
        )}
        {ladders[squareNumber] && (
          <div className="absolute top-0 left-0 w-full h-full bg-green-200 opacity-30 flex items-center justify-center">
            <span className="text-xs">🪜</span>
          </div>
        )}
      </div>
    );
  };

  const getBoardSquares = () => {
    const squares = [];
    for (let row = 0; row < 10; row++) {
      const rowSquares = [];
      for (let col = 0; col < 10; col++) {
        const squareNumber = row % 2 === 0 
          ? (9 - row) * 10 + col + 1
          : (9 - row) * 10 + (9 - col) + 1;
        
        rowSquares.push(
          <div
            key={squareNumber}
            className={`w-8 h-8 border border-gray-300 relative ${
              (row + col) % 2 === 0 ? 'bg-amber-50' : 'bg-amber-100'
            }`}
          >
            {getSquareContent(squareNumber)}
          </div>
        );
      }
      squares.push(
        <div key={row} className="flex">
          {rowSquares}
        </div>
      );
    }
    return squares;
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="flex items-center justify-between w-full max-w-md">
        <h3 className="text-2xl font-bold text-gray-800">Snakes and Ladders</h3>
        <button
          onClick={resetGame}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Reset Game
        </button>
      </div>
      
      {winner ? (
        <div className="text-2xl font-bold text-green-600">
          🎉 {winner} Wins! 🎉
        </div>
      ) : (
        <div className="text-lg font-semibold text-gray-700">
          Current turn: <span className="text-blue-600">
            {isBotEnabled && currentPlayerIndex === 1 ? 'Bot Player' : gameBoard[currentPlayerIndex].name}
          </span>
        </div>
      )}
      
      <div className="flex items-center space-x-4">
        <button
          onClick={rollDice}
          disabled={isRolling || !!winner || (isBotEnabled && currentPlayerIndex === 1)}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-white font-semibold transition-all ${
            isRolling || winner || (isBotEnabled && currentPlayerIndex === 1)
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 active:scale-95'
          }`}
        >
          <Dice6 className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
          <span>Roll Dice</span>
        </button>
        
        {diceValue && (
          <div className="flex items-center justify-center w-12 h-12 bg-white border-2 border-gray-300 rounded-lg text-2xl font-bold">
            {diceValue}
          </div>
        )}
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-gray-200">
        <div className="grid grid-cols-1 gap-1">
          {getBoardSquares()}
        </div>
      </div>
      
      <div className="flex space-x-4">
        {gameBoard.map((player, index) => (
          <div key={player.id} className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full ${player.color}`} />
            <span className="text-sm font-medium">
              {isBotEnabled && index === 1 ? 'Bot Player' : player.name}: {player.position}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SnakesAndLadders;