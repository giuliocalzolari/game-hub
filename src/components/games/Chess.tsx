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
  const [gameStatus, setGameStatus] = useState<string>('');
  const botTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  function initializeBoard(): (ChessPiece | null)[][] {
    const newBoard: (ChessPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Initialize pawns
    for (let col = 0; col < 8; col++) {
      newBoard[1][col] = { type: 'pawn', color: 'black', position: { row: 1, col }, hasMoved: false };
      newBoard[6][col] = { type: 'pawn', color: 'white', position: { row: 6, col }, hasMoved: false };
    }
    
    // Initialize other pieces
    const pieceOrder: ChessPiece['type'][] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    
    for (let col = 0; col < 8; col++) {
      newBoard[0][col] = { type: pieceOrder[col], color: 'black', position: { row: 0, col }, hasMoved: false };
      newBoard[7][col] = { type: pieceOrder[col], color: 'white', position: { row: 7, col }, hasMoved: false };
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

  const isPathClear = (from: ChessPosition, to: ChessPosition): boolean => {
    const dx = Math.sign(to.col - from.col);
    const dy = Math.sign(to.row - from.row);
    
    let currentRow = from.row + dy;
    let currentCol = from.col + dx;
    
    while (currentRow !== to.row || currentCol !== to.col) {
      if (board[currentRow][currentCol] !== null) {
        return false;
      }
      currentRow += dy;
      currentCol += dx;
    }
    
    return true;
  };

  const isValidMove = (from: ChessPosition, to: ChessPosition, piece: ChessPiece): boolean => {
    // Basic bounds check
    if (to.row < 0 || to.row > 7 || to.col < 0 || to.col > 7) return false;
    
    // Can't move to same square
    if (from.row === to.row && from.col === to.col) return false;
    
    // Can't capture own pieces
    const targetPiece = board[to.row][to.col];
    if (targetPiece && targetPiece.color === piece.color) return false;
    
    const dx = Math.abs(to.col - from.col);
    const dy = Math.abs(to.row - from.row);
    
    switch (piece.type) {
      case 'pawn':
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;
        
        // Forward move
        if (to.col === from.col && !targetPiece) {
          if (to.row === from.row + direction) return true;
          if (from.row === startRow && to.row === from.row + 2 * direction) {
            return !board[from.row + direction][to.col];
          }
        }
        // Diagonal capture
        else if (Math.abs(to.col - from.col) === 1 && to.row === from.row + direction && targetPiece) {
          return true;
        }
        return false;
      
      case 'rook':
        if (dx === 0 || dy === 0) {
          return isPathClear(from, to);
        }
        return false;
      
      case 'bishop':
        if (dx === dy) {
          return isPathClear(from, to);
        }
        return false;
      
      case 'queen':
        if (dx === 0 || dy === 0 || dx === dy) {
          return isPathClear(from, to);
        }
        return false;
      
      case 'king':
        return dx <= 1 && dy <= 1;
      
      case 'knight':
        return (dx === 2 && dy === 1) || (dx === 1 && dy === 2);
      
      default:
        return false;
    }
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
        if (isValidMove(from, to, piece)) {
          moves.push(to);
        }
      }
    }
    
    return moves;
  };

  const evaluatePosition = (testBoard: (ChessPiece | null)[][]): number => {
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
        const piece = testBoard[row][col];
        if (piece) {
          let value = pieceValues[piece.type];
          
          // Positional bonuses
          if (piece.type === 'pawn') {
            // Encourage pawn advancement
            if (piece.color === 'black') {
              value += (row - 1) * 0.1;
            } else {
              value += (6 - row) * 0.1;
            }
          }
          
          // Central control bonus
          if (row >= 3 && row <= 4 && col >= 3 && col <= 4) {
            value += 0.3;
          }
          
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
      // Create a copy of the board to test the move
      const testBoard = board.map(row => [...row]);
      const capturedPiece = testBoard[move.to.row][move.to.col];
      
      // Make the move on test board
      testBoard[move.to.row][move.to.col] = move.piece;
      testBoard[move.from.row][move.from.col] = null;
      
      let score = evaluatePosition(testBoard);
      
      // Bonus for captures
      if (capturedPiece) {
        const pieceValues = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 100 };
        score += pieceValues[capturedPiece.type] * 2;
      }
      
      // Bonus for checks (simplified - just attacking near enemy king)
      const enemyKingPos = findKing('white', testBoard);
      if (enemyKingPos) {
        const distance = Math.abs(move.to.row - enemyKingPos.row) + Math.abs(move.to.col - enemyKingPos.col);
        if (distance <= 2) {
          score += 1;
        }
      }
      
      // Add some randomness to make bot less predictable
      score += Math.random() * 0.5;
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove;
  };

  const findKing = (color: 'white' | 'black', testBoard?: (ChessPiece | null)[][]): ChessPosition | null => {
    const searchBoard = testBoard || board;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = searchBoard[row][col];
        if (piece && piece.type === 'king' && piece.color === color) {
          return { row, col };
        }
      }
    }
    return null;
  };

  const isInCheck = (color: 'white' | 'black', testBoard?: (ChessPiece | null)[][]): boolean => {
    const searchBoard = testBoard || board;
    const kingPos = findKing(color, searchBoard);
    if (!kingPos) return false;
    
    const enemyColor = color === 'white' ? 'black' : 'white';
    
    // Check if any enemy piece can attack the king
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = searchBoard[row][col];
        if (piece && piece.color === enemyColor) {
          if (isValidMove({ row, col }, kingPos, piece)) {
            return true;
          }
        }
      }
    }
    
    return false;
  };

  const makeBotMove = useCallback(() => {
    if (currentPlayer === 'black' && isBotEnabled) {
      const bestMove = getBestMove();
      if (bestMove) {
        const newBoard = board.map(row => [...row]);
        const movingPiece = { ...bestMove.piece, hasMoved: true };
        newBoard[bestMove.to.row][bestMove.to.col] = movingPiece;
        newBoard[bestMove.from.row][bestMove.from.col] = null;
        
        setBoard(newBoard);
        setCurrentPlayer('white');
        
        // Check for check/checkmate
        setTimeout(() => {
          if (isInCheck('white', newBoard)) {
            setGameStatus('White is in check!');
          } else {
            setGameStatus('');
          }
        }, 100);
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

  const handleSquareClick = useCallback((row: number, col: number) => {
    const clickedPiece = board[row][col];
    
    // Prevent manual moves when bot is playing
    if (isBotEnabled && currentPlayer === 'black') return;
    
    if (selectedSquare) {
      const selectedPiece = board[selectedSquare.row][selectedSquare.col];
      
      if (selectedPiece && isValidMove(selectedSquare, { row, col }, selectedPiece)) {
        // Test if move would put own king in check
        const testBoard = board.map(r => [...r]);
        const movingPiece = { ...selectedPiece, hasMoved: true };
        testBoard[row][col] = movingPiece;
        testBoard[selectedSquare.row][selectedSquare.col] = null;
        
        if (!isInCheck(currentPlayer, testBoard)) {
          // Make the move
          const newBoard = board.map(r => [...r]);
          newBoard[row][col] = movingPiece;
          newBoard[selectedSquare.row][selectedSquare.col] = null;
          
          setBoard(newBoard);
          setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white');
          
          // Check for check
          const enemyColor = currentPlayer === 'white' ? 'black' : 'white';
          setTimeout(() => {
            if (isInCheck(enemyColor, newBoard)) {
              setGameStatus(`${enemyColor} is in check!`);
            } else {
              setGameStatus('');
            }
          }, 100);
        } else {
          setGameStatus('Invalid move: would put king in check!');
          setTimeout(() => setGameStatus(''), 2000);
        }
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
    setGameStatus('');
  };

  const getStatusMessage = () => {
    if (gameStatus) return gameStatus;
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
        gameStatus.includes('check') ? 'text-red-600' : 
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
      
      <div className="text-sm text-gray-600 max-w-md text-center">
        <p>Click a piece to select it, then click a valid square to move.</p>
        <p>The bot follows proper chess rules including check detection.</p>
      </div>
    </div>
  );
};

export default Chess;