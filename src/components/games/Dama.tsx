import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DamaPosition, DamaPiece } from '../../types/games';

interface DamaProps {
  isBotEnabled: boolean;
}

const Dama: React.FC<DamaProps> = ({ isBotEnabled }) => {
  const [board, setBoard] = useState<(DamaPiece | null)[][]>(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState<DamaPosition | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<'red' | 'black'>('red');
  const [gameStatus, setGameStatus] = useState<string>('');
  const [mustCapture, setMustCapture] = useState<DamaPosition[]>([]);
  const botTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const isValidPosition = (pos: DamaPosition): boolean => {
    return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
  };

  const getCaptureMoves = (from: DamaPosition, piece: DamaPiece): Array<{to: DamaPosition, captured: DamaPosition}> => {
    const captures: Array<{to: DamaPosition, captured: DamaPosition}> = [];
    const directions = piece.isKing 
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] // Kings can move in all diagonal directions
      : piece.color === 'red' 
        ? [[-1, -1], [-1, 1]] // Red moves up
        : [[1, -1], [1, 1]]; // Black moves down

    for (const [dr, dc] of directions) {
      const jumpOver = { row: from.row + dr, col: from.col + dc };
      const landOn = { row: from.row + 2 * dr, col: from.col + 2 * dc };

      if (isValidPosition(jumpOver) && isValidPosition(landOn)) {
        const jumpedPiece = board[jumpOver.row][jumpOver.col];
        const landingSquare = board[landOn.row][landOn.col];

        if (jumpedPiece && 
            jumpedPiece.color !== piece.color && 
            !landingSquare &&
            (landOn.row + landOn.col) % 2 === 1) {
          captures.push({ to: landOn, captured: jumpOver });
        }
      }
    }

    return captures;
  };

  const getRegularMoves = (from: DamaPosition, piece: DamaPiece): DamaPosition[] => {
    const moves: DamaPosition[] = [];
    const directions = piece.isKing 
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] // Kings can move in all diagonal directions
      : piece.color === 'red' 
        ? [[-1, -1], [-1, 1]] // Red moves up
        : [[1, -1], [1, 1]]; // Black moves down

    for (const [dr, dc] of directions) {
      const to = { row: from.row + dr, col: from.col + dc };

      if (isValidPosition(to) && 
          !board[to.row][to.col] && 
          (to.row + to.col) % 2 === 1) {
        moves.push(to);
      }
    }

    return moves;
  };

  const getAllCaptureMoves = (color: 'red' | 'black'): Array<{from: DamaPosition, to: DamaPosition, captured: DamaPosition, piece: DamaPiece}> => {
    const allCaptures: Array<{from: DamaPosition, to: DamaPosition, captured: DamaPosition, piece: DamaPiece}> = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === color) {
          const captures = getCaptureMoves({ row, col }, piece);
          captures.forEach(capture => {
            allCaptures.push({
              from: { row, col },
              to: capture.to,
              captured: capture.captured,
              piece
            });
          });
        }
      }
    }

    return allCaptures;
  };

  const getAllRegularMoves = (color: 'red' | 'black'): Array<{from: DamaPosition, to: DamaPosition, piece: DamaPiece}> => {
    const allMoves: Array<{from: DamaPosition, to: DamaPosition, piece: DamaPiece}> = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === color) {
          const moves = getRegularMoves({ row, col }, piece);
          moves.forEach(to => {
            allMoves.push({ from: { row, col }, to, piece });
          });
        }
      }
    }

    return allMoves;
  };

  const evaluateBoard = (): number => {
    let score = 0;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          let value = piece.isKing ? 5 : 1;
          
          // Positional bonuses
          if (!piece.isKing) {
            // Encourage advancement
            if (piece.color === 'black') {
              value += (row / 7) * 0.5; // Closer to bottom = better for black
            } else {
              value += ((7 - row) / 7) * 0.5; // Closer to top = better for red
            }
          }
          
          // Center control bonus
          if (row >= 2 && row <= 5 && col >= 2 && col <= 5) {
            value += 0.3;
          }
          
          // Edge penalty for regular pieces
          if (!piece.isKing && (row === 0 || row === 7 || col === 0 || col === 7)) {
            value -= 0.2;
          }
          
          score += piece.color === 'black' ? value : -value;
        }
      }
    }
    
    return score;
  };

  const getBestMove = (): {from: DamaPosition, to: DamaPosition, captured?: DamaPosition} | null => {
    // First check for captures (mandatory in checkers)
    const captures = getAllCaptureMoves('black');
    
    if (captures.length > 0) {
      let bestCapture = captures[0];
      let bestScore = -Infinity;
      
      for (const capture of captures) {
        // Simulate the capture
        const testBoard = board.map(row => [...row]);
        const movingPiece = { ...capture.piece };
        
        // Check for king promotion
        if (capture.to.row === 7) {
          movingPiece.isKing = true;
        }
        
        testBoard[capture.to.row][capture.to.col] = movingPiece;
        testBoard[capture.from.row][capture.from.col] = null;
        testBoard[capture.captured.row][capture.captured.col] = null;
        
        let score = evaluateBoard();
        
        // Bonus for capturing
        const capturedPiece = board[capture.captured.row][capture.captured.col];
        if (capturedPiece) {
          score += capturedPiece.isKing ? 5 : 1;
        }
        
        // Bonus for king promotion
        if (capture.to.row === 7 && !capture.piece.isKing) {
          score += 3;
        }
        
        // Bonus for multiple captures potential
        const newCaptures = getCaptureMoves(capture.to, movingPiece);
        score += newCaptures.length * 2;
        
        // Add randomness
        score += Math.random() * 0.3;
        
        if (score > bestScore) {
          bestScore = score;
          bestCapture = capture;
        }
      }
      
      return {
        from: bestCapture.from,
        to: bestCapture.to,
        captured: bestCapture.captured
      };
    }
    
    // If no captures, make regular moves
    const regularMoves = getAllRegularMoves('black');
    if (regularMoves.length === 0) return null;
    
    let bestMove = regularMoves[0];
    let bestScore = -Infinity;
    
    for (const move of regularMoves) {
      // Simulate the move
      const testBoard = board.map(row => [...row]);
      const movingPiece = { ...move.piece };
      
      // Check for king promotion
      if (move.to.row === 7) {
        movingPiece.isKing = true;
      }
      
      testBoard[move.to.row][move.to.col] = movingPiece;
      testBoard[move.from.row][move.from.col] = null;
      
      let score = evaluateBoard();
      
      // Bonus for king promotion
      if (move.to.row === 7 && !move.piece.isKing) {
        score += 3;
      }
      
      // Bonus for advancing
      if (!move.piece.isKing) {
        score += (move.to.row - move.from.row) * 0.2;
      }
      
      // Add randomness
      score += Math.random() * 0.3;
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return { from: bestMove.from, to: bestMove.to };
  };

  const makeBotMove = useCallback(() => {
    if (currentPlayer === 'black' && isBotEnabled) {
      const bestMove = getBestMove();
      if (bestMove) {
        const newBoard = board.map(row => [...row]);
        const movingPiece = board[bestMove.from.row][bestMove.from.col];
        
        if (movingPiece) {
          const updatedPiece = { ...movingPiece, position: bestMove.to };
          
          // Check for king promotion
          if (bestMove.to.row === 7 && movingPiece.color === 'black') {
            updatedPiece.isKing = true;
          }
          
          newBoard[bestMove.to.row][bestMove.to.col] = updatedPiece;
          newBoard[bestMove.from.row][bestMove.from.col] = null;
          
          // Remove captured piece if any
          if (bestMove.captured) {
            newBoard[bestMove.captured.row][bestMove.captured.col] = null;
          }
          
          setBoard(newBoard);
          
          // Check for additional captures
          const additionalCaptures = getCaptureMoves(bestMove.to, updatedPiece);
          if (additionalCaptures.length > 0 && bestMove.captured) {
            // Bot can capture again, but for simplicity, we'll end the turn
            setGameStatus('Bot captured a piece!');
            setTimeout(() => setGameStatus(''), 2000);
          }
          
          setCurrentPlayer('red');
        }
      } else {
        setGameStatus('Bot has no valid moves!');
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
      
      if (selectedPiece && selectedPiece.color === currentPlayer) {
        // Check for captures first (mandatory in checkers)
        const captures = getCaptureMoves(selectedSquare, selectedPiece);
        const isCapture = captures.some(c => c.to.row === row && c.to.col === col);
        
        if (isCapture) {
          const capture = captures.find(c => c.to.row === row && c.to.col === col)!;
          
          // Make the capture
          const newBoard = board.map(r => [...r]);
          const updatedPiece = { ...selectedPiece, position: { row, col } };
          
          // Check for king promotion
          if ((selectedPiece.color === 'red' && row === 0) || 
              (selectedPiece.color === 'black' && row === 7)) {
            updatedPiece.isKing = true;
          }
          
          newBoard[row][col] = updatedPiece;
          newBoard[selectedSquare.row][selectedSquare.col] = null;
          newBoard[capture.captured.row][capture.captured.col] = null;
          
          setBoard(newBoard);
          
          // Check for additional captures
          const additionalCaptures = getCaptureMoves({ row, col }, updatedPiece);
          if (additionalCaptures.length > 0) {
            setSelectedSquare({ row, col });
            setMustCapture([{ row, col }]);
            setGameStatus('You must continue capturing!');
          } else {
            setSelectedSquare(null);
            setMustCapture([]);
            setCurrentPlayer(currentPlayer === 'red' ? 'black' : 'red');
            setGameStatus('');
          }
        } else {
          // Check if captures are available (if so, must capture)
          const allCaptures = getAllCaptureMoves(currentPlayer);
          if (allCaptures.length > 0) {
            setGameStatus('You must capture when possible!');
            setTimeout(() => setGameStatus(''), 2000);
          } else {
            // Regular move
            const regularMoves = getRegularMoves(selectedSquare, selectedPiece);
            const isValidRegularMove = regularMoves.some(m => m.row === row && m.col === col);
            
            if (isValidRegularMove) {
              const newBoard = board.map(r => [...r]);
              const updatedPiece = { ...selectedPiece, position: { row, col } };
              
              // Check for king promotion
              if ((selectedPiece.color === 'red' && row === 0) || 
                  (selectedPiece.color === 'black' && row === 7)) {
                updatedPiece.isKing = true;
              }
              
              newBoard[row][col] = updatedPiece;
              newBoard[selectedSquare.row][selectedSquare.col] = null;
              
              setBoard(newBoard);
              setCurrentPlayer(currentPlayer === 'red' ? 'black' : 'red');
            }
          }
        }
      }
      
      if (!mustCapture.length) {
        setSelectedSquare(null);
      }
    } else if (clickedPiece && clickedPiece.color === currentPlayer) {
      // If must capture, only allow selecting pieces that can capture
      if (mustCapture.length > 0) {
        const canCapture = mustCapture.some(pos => pos.row === row && pos.col === col);
        if (canCapture) {
          setSelectedSquare({ row, col });
        }
      } else {
        setSelectedSquare({ row, col });
      }
    }
  }, [board, selectedSquare, currentPlayer, isBotEnabled, mustCapture]);

  const resetGame = () => {
    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current);
    }
    setBoard(initializeBoard());
    setSelectedSquare(null);
    setCurrentPlayer('red');
    setGameStatus('');
    setMustCapture([]);
  };

  const getStatusMessage = () => {
    if (gameStatus) return gameStatus;
    if (isBotEnabled && currentPlayer === 'black') return "Bot is thinking...";
    return `Current player: ${currentPlayer}`;
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
      
      <div className={`text-lg font-semibold ${
        gameStatus.includes('must') ? 'text-orange-600' : 
        gameStatus.includes('captured') ? 'text-green-600' :
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
                w-12 h-12 flex items-center justify-center cursor-pointer transition-colors relative
                ${(rowIndex + colIndex) % 2 === 0 ? 'bg-amber-100' : 'bg-amber-800'}
                ${selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex ? 'ring-4 ring-blue-400' : ''}
                ${mustCapture.some(pos => pos.row === rowIndex && pos.col === colIndex) ? 'ring-2 ring-orange-400' : ''}
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
      
      <div className="text-sm text-gray-600 max-w-md text-center">
        <p>Captures are mandatory! Kings can move in all diagonal directions.</p>
        <p>Reach the opposite end to promote your piece to a king.</p>
      </div>
    </div>
  );
};

export default Dama;