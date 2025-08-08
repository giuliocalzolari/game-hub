import React, { useState, useCallback } from 'react';
import { DamaPosition, DamaPiece } from '../../types/games';

const Dama: React.FC = () => {
  const [board, setBoard] = useState<(DamaPiece | null)[][]>(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState<DamaPosition | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<'red' | 'black'>('red');

  function initializeBoard(): (DamaPiece | null)[][] {
    const newBoard: (DamaPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Initialize red pieces (bottom)
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          newBoard[row][col] = { color: 'red', position: { row, col }, isKing: false };
        }
      }
    }
    
    // Initialize black pieces (top)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          newBoard[row][col] = { color: 'black', position: { row, col }, isKing: false };
        }
      }
    }
    
    return newBoard;
  }

  const isValidMove = (from: DamaPosition, to: DamaPosition, piece: DamaPiece): boolean => {
    const dx = to.col - from.col;
    const dy = to.row - from.row;
    
    // Can only move to dark squares
    if ((to.row + to.col) % 2 === 0) return false;
    
    // Square must be empty
    if (board[to.row][to.col]) return false;
    
    if (piece.isKing) {
      // Kings can move diagonally in any direction
      return Math.abs(dx) === Math.abs(dy);
    } else {
      // Regular pieces move diagonally forward
      const direction = piece.color === 'red' ? -1 : 1;
      return Math.abs(dx) === 1 && dy === direction;
    }
  };

  const handleSquareClick = useCallback((row: number, col: number) => {
    const clickedPiece = board[row][col];
    
    if (selectedSquare) {
      const selectedPiece = board[selectedSquare.row][selectedSquare.col];
      
      if (selectedPiece && isValidMove(selectedSquare, { row, col }, selectedPiece)) {
        // Make the move
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = { ...selectedPiece, position: { row, col } };
        newBoard[selectedSquare.row][selectedSquare.col] = null;
        
        // Check for king promotion
        if ((selectedPiece.color === 'red' && row === 0) || (selectedPiece.color === 'black' && row === 7)) {
          newBoard[row][col]!.isKing = true;
        }
        
        setBoard(newBoard);
        setCurrentPlayer(currentPlayer === 'red' ? 'black' : 'red');
      }
      
      setSelectedSquare(null);
    } else if (clickedPiece && clickedPiece.color === currentPlayer) {
      setSelectedSquare({ row, col });
    }
  }, [board, selectedSquare, currentPlayer]);

  const resetGame = () => {
    setBoard(initializeBoard());
    setSelectedSquare(null);
    setCurrentPlayer('red');
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="flex items-center justify-between w-full max-w-md">
        <h3 className="text-2xl font-bold text-gray-800">Dama (Checkers)</h3>
        <button
          onClick={resetGame}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Reset Game
        </button>
      </div>
      
      <div className="text-lg font-semibold text-gray-700">
        Current player: <span className="capitalize text-red-600">{currentPlayer}</span>
      </div>
      
      <div className="grid grid-cols-8 gap-0 border-2 border-gray-800 bg-white">
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              onClick={() => handleSquareClick(rowIndex, colIndex)}
              className={`
                w-12 h-12 flex items-center justify-center cursor-pointer transition-colors relative
                ${(rowIndex + colIndex) % 2 === 0 ? 'bg-amber-100' : 'bg-amber-800'}
                ${selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex ? 'ring-4 ring-blue-400' : ''}
                hover:brightness-110
              `}
            >
              {piece && (
                <div className={`
                  w-8 h-8 rounded-full border-2 border-gray-800 flex items-center justify-center font-bold text-sm
                  ${piece.color === 'red' ? 'bg-red-500 text-white' : 'bg-gray-800 text-white'}
                `}>
                  {piece.isKing ? '♔' : ''}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dama;