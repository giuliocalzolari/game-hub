import React, { useState, useCallback } from 'react';
import { useEffect, useRef } from 'react';
import { ChessPosition, ChessPiece } from '../../types/games';

interface ChessProps {
  isBotEnabled: boolean;
}

const Chess: React.FC<ChessProps> = ({ isBotEnabled }) => {
  const [board, setBoard] = useState<(ChessPiece | null)[][]>(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState<ChessPosition | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');
  const botTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const getAllValidMoves = (color: 'white' | 'black'): Array<{from: ChessPosition, to: ChessPosition, piece: ChessPiece}> => {
    const moves: Array<{from: ChessPosition, to: ChessPosition, piece: ChessPiece}> = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === color) {
          const validMoves = getValidMovesForPiece(piece, { row, col });
          validMoves.forEach(to => {
            moves.push({ from: { row, col }, to, piece });
          });
        }
      }
    }
    
    return moves;
  };

  const getValidMovesForPiece = (piece: ChessPiece, from: ChessPosition): ChessPosition[] => {
    const moves: ChessPosition[] = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const to = { row, col };
        if (isValidMove(from, to, piece) && !board[row][col]) {
          moves.push(to);
        } else if (isValidMove(from, to, piece) && board[row][col] && board[row][col]!.color !== piece.color) {
          moves.push(to); // Capture move
        }
      }
    }
    
    return moves;
  };

  const evaluateBoard = (): number => {
    const pieceValues = {
      pawn: 1,
      knight: 3,
      bishop: 3,
      rook: 5,
      queen: 9,
      king: 100
    };
    
    let score = 0;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          const value = pieceValues[piece.type];
          score += piece.color === 'black' ? value : -value;
        }
      }
    }
    
    return score;
  };

  const getBestMove = (): {from: ChessPosition, to: ChessPosition} | null => {
    const validMoves = getAllValidMoves('black');
    if (validMoves.length === 0) return null;
    
    let bestMove = validMoves[0];
    let bestScore = -Infinity;
    
    for (const move of validMoves) {
      // Simulate the move
      const capturedPiece = board[move.to.row][move.to.col];
      const tempBoard = board.map(row => [...row]);
      tempBoard[move.to.row][move.to.col] = move.piece;
      tempBoard[move.from.row][move.from.col] = null;
      
      // Simple evaluation: prioritize captures and central control
      let score = 0;
      
      // Bonus for captures
      if (capturedPiece) {
        const pieceValues = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 100 };
        score += pieceValues[capturedPiece.type] * 10;
      }
      
      // Bonus for central squares
      if (move.to.row >= 3 && move.to.row <= 4 && move.to.col >= 3 && move.to.col <= 4) {
        score += 2;
      }
      
      // Bonus for advancing pawns
      if (move.piece.type === 'pawn' && move.to.row > move.from.row) {
        score += 1;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove;
  };

  const makeBotMove = useCallback(() => {
    if (currentPlayer === 'black' && isBotEnabled) {
      const bestMove = getBestMove();
      if (bestMove) {
        const newBoard = board.map(row => [...row]);
        newBoard[bestMove.to.row][bestMove.to.col] = bestMove.piece;
        newBoard[bestMove.from.row][bestMove.from.col] = null;
        
        setBoard(newBoard);
        setCurrentPlayer('white');
      }
    }
  }, [currentPlayer, isBotEnabled, board]);

  useEffect(() => {
    if (currentPlayer === 'black' && isBotEnabled) {
      botTimeoutRef.current = setTimeout(() => {
        makeBotMove();
      }, 1000);
    }
    
    return () => {
      if (botTimeoutRef.current) {
        clearTimeout(botTimeoutRef.current);
      }
    };
  }, [currentPlayer, isBotEnabled, makeBotMove]);
  const isValidMove = (from: ChessPosition, to: ChessPosition, piece: ChessPiece): boolean => {
    // Basic move validation (simplified for demo)
    const dx = Math.abs(to.col - from.col);
    const dy = Math.abs(to.row - from.row);
    
    // Can't capture own pieces
    const targetPiece = board[to.row][to.col];
    if (targetPiece && targetPiece.color === piece.color) return false;
    
    switch (piece.type) {
      case 'pawn':
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;
        
        if (to.col === from.col && !targetPiece) {
          if (to.row === from.row + direction) return !board[to.row][to.col];
          if (from.row === startRow && to.row === from.row + 2 * direction) {
            return !board[to.row][to.col] && !board[from.row + direction][to.col];
          }
        } else if (Math.abs(to.col - from.col) === 1 && to.row === from.row + direction && targetPiece) {
          return true; // Diagonal capture
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
    
    // Prevent manual moves when bot is playing
    if (isBotEnabled && currentPlayer === 'black') return;
    
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
  }, [board, selectedSquare, currentPlayer, isBotEnabled]);

  const resetGame = () => {
    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current);
    }
    setBoard(initializeBoard());
    setSelectedSquare(null);
    setCurrentPlayer('white');
  };

  const getStatusMessage = () => {
    if (isBotEnabled && currentPlayer === 'black') return "Bot is thinking...";
    return `Current player: ${currentPlayer}`;
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
      
      <div className={`text-lg font-semibold ${
        isBotEnabled && currentPlayer === 'black' ? 'text-purple-600' : 'text-gray-700'
      }`}>
        {getStatusMessage()}
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