import React, { useState, useCallback, useEffect } from 'react';
import { TrisBoard } from '../../types/games';

const Tris: React.FC = () => {
  const [board, setBoard] = useState<TrisBoard>({
    squares: Array(9).fill(null),
    currentPlayer: 'X',
    winner: null,
  });

  const checkWinner = useCallback((squares: Array<'X' | 'O' | null>): 'X' | 'O' | 'tie' | null => {
    const winningCombinations = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6], // diagonals
    ];

    for (const [a, b, c] of winningCombinations) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }

    if (squares.every(square => square !== null)) {
      return 'tie';
    }

    return null;
  }, []);

  const handleSquareClick = useCallback((index: number) => {
    if (board.squares[index] || board.winner) return;

    const newSquares = [...board.squares];
    newSquares[index] = board.currentPlayer;
    
    const winner = checkWinner(newSquares);
    
    setBoard({
      squares: newSquares,
      currentPlayer: board.currentPlayer === 'X' ? 'O' : 'X',
      winner,
    });
  }, [board, checkWinner]);

  const resetGame = () => {
    setBoard({
      squares: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null,
    });
  };

  const getStatusMessage = () => {
    if (board.winner === 'tie') return "It's a tie!";
    if (board.winner) return `Player ${board.winner} wins!`;
    return `Current player: ${board.currentPlayer}`;
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="flex items-center justify-between w-full max-w-md">
        <h3 className="text-2xl font-bold text-gray-800">Tris (Tic-Tac-Toe)</h3>
        <button
          onClick={resetGame}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Reset Game
        </button>
      </div>
      
      <div className={`text-lg font-semibold ${
        board.winner ? 'text-green-600' : 'text-gray-700'
      }`}>
        {getStatusMessage()}
      </div>
      
      <div className="grid grid-cols-3 gap-2 bg-gray-800 p-2 rounded-lg">
        {board.squares.map((square, index) => (
          <button
            key={index}
            onClick={() => handleSquareClick(index)}
            className={`
              w-20 h-20 bg-white rounded-lg flex items-center justify-center text-4xl font-bold
              transition-all duration-200 hover:bg-gray-50 active:scale-95
              ${square === 'X' ? 'text-blue-500' : 'text-red-500'}
              ${!square && !board.winner ? 'cursor-pointer hover:shadow-md' : 'cursor-not-allowed'}
            `}
            disabled={!!square || !!board.winner}
          >
            {square}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tris;