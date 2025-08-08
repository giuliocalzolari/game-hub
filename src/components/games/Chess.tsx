import React, { useState, useCallback } from 'react';
import { ChessPosition, ChessPiece } from '../../types/games';

const Chess: React.FC = () => {
  const [board, setBoard] = useState<(ChessPiece | null)[][]>(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState<ChessPosition | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');

  function initializeBoard(): (ChessPiece | null)[][] {
    const newBoard: (ChessPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Initialize pawns
    for (let col = 0; col < 8; col++) {
      newBoard[1][col] = { type: 'pawn', color: 'black', position: { row: 1, col } };
      newBoard[6][col] = { type: 'pawn', color: 'white', position: { row: 6, col } };
    }
    
    // Initialize other pieces
    const pieceOrder: ChessPiece['type'][] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    
    for (let col = 0; col < 8; col++) {
      newBoard[0][col] = { type: pieceOrder[col], color: 'black', position: { row: 0, col } };
      newBoard[7][col] = { type: pieceOrder[col], color: 'white', position: { row: 7, col } };
    }
    
    return newBoard;
  }

  const getPieceSymbol = (piece: ChessPiece): string => {
    const symbols = {
      king: piece.color === 'white' ? '♔' : '♚',
      queen: piece.color === 'white' ? '♕' : '♛',
      rook: piece.color === 'white' ? '♖' : '♜',
      bishop: piece.color === 'white' ? '♗' : '♝',
      knight: piece.color === 'white' ? '♘' : '♞',
      pawn: piece.color === 'white' ? '♙' : '♟',
    };
    return symbols[piece.type];
  };

  const isValidMove = (from: ChessPosition, to: ChessPosition, piece: ChessPiece): boolean => {
    // Basic move validation (simplified for demo)
    const dx = Math.abs(to.col - from.col);
    const dy = Math.abs(to.row - from.row);
    
    switch (piece.type) {
      case 'pawn':
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;
        
        if (to.col === from.col) {
          if (to.row === from.row + direction) return !board[to.row][to.col];
          if (from.row === startRow && to.row === from.row + 2 * direction) {
            return !board[to.row][to.col] && !board[from.row + direction][to.col];
          }
        }
        return false;
      
      case 'rook':
        return (dx === 0 || dy === 0);
      
      case 'bishop':
        return (dx === dy);
      
      case 'queen':
        return (dx === 0 || dy === 0 || dx === dy);
      
      case 'king':
        return (dx <= 1 && dy <= 1);
      
      case 'knight':
        return ((dx === 2 && dy === 1) || (dx === 1 && dy === 2));
      
      default:
        return false;
    }
  };

  const handleSquareClick = useCallback((row: number, col: number) => {
    const clickedPiece = board[row][col];
    
    if (selectedSquare) {
      const selectedPiece = board[selectedSquare.row][selectedSquare.col];
      
      if (selectedPiece && isValidMove(selectedSquare, { row, col }, selectedPiece)) {
        // Make the move
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = selectedPiece;
        newBoard[selectedSquare.row][selectedSquare.col] = null;
        
        setBoard(newBoard);
        setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white');
      }
      
      setSelectedSquare(null);
    } else if (clickedPiece && clickedPiece.color === currentPlayer) {
      setSelectedSquare({ row, col });
    }
  }, [board, selectedSquare, currentPlayer]);

  const resetGame = () => {
    setBoard(initializeBoard());
    setSelectedSquare(null);
    setCurrentPlayer('white');
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="flex items-center justify-between w-full max-w-md">
        <h3 className="text-2xl font-bold text-gray-800">Chess</h3>
        <button
          onClick={resetGame}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Reset Game
        </button>
      </div>
      
      <div className="text-lg font-semibold text-gray-700">
        Current player: <span className="capitalize text-blue-600">{currentPlayer}</span>
      </div>
      
      <div className="grid grid-cols-8 gap-0 border-2 border-gray-800 bg-white">
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              onClick={() => handleSquareClick(rowIndex, colIndex)}
              className={`
                w-12 h-12 flex items-center justify-center cursor-pointer text-2xl font-bold transition-colors
                ${(rowIndex + colIndex) % 2 === 0 ? 'bg-amber-100' : 'bg-amber-700'}
                ${selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex ? 'ring-4 ring-blue-400' : ''}
                hover:brightness-110
              `}
            >
              {piece && getPieceSymbol(piece)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Chess;