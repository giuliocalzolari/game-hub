import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';
import { BackgammonGameState, BackgammonPiece, BackgammonMove } from '../../types/games';

interface BackgammonProps {
  isBotEnabled: boolean;
}

const Backgammon: React.FC<BackgammonProps> = ({ isBotEnabled }) => {
  const [gameState, setGameState] = useState<BackgammonGameState>(initializeGame());
  const [gameStatus, setGameStatus] = useState<string>('');
  const [isRolling, setIsRolling] = useState(false);
  const botTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  function initializeGame(): BackgammonGameState {
    const board: (BackgammonPiece | null)[] = Array(24).fill(null);
    
    // Initialize starting positions (standard backgammon setup)
    board[0] = { color: 'white', count: 2 };  // Point 1
    board[11] = { color: 'white', count: 5 }; // Point 12
    board[16] = { color: 'white', count: 3 }; // Point 17
    board[18] = { color: 'white', count: 5 }; // Point 19
    
    board[23] = { color: 'black', count: 2 }; // Point 24
    board[12] = { color: 'black', count: 5 }; // Point 13
    board[7] = { color: 'black', count: 3 };  // Point 8
    board[5] = { color: 'black', count: 5 };  // Point 6
    
    return {
      board,
      currentPlayer: 'white',
      dice: [0, 0],
      availableMoves: [],
      selectedPoint: null,
      whiteBar: 0,
      blackBar: 0,
      whiteBorne: 0,
      blackBorne: 0,
      winner: null,
    };
  }

  const getDiceIcon = (value: number) => {
    const icons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
    const Icon = icons[value - 1] || Dice1;
    return <Icon className="w-8 h-8" />;
  };

  const rollDice = useCallback(async () => {
    if (isRolling || gameState.winner) return;
    
    setIsRolling(true);
    
    // Animate dice roll
    for (let i = 0; i < 10; i++) {
      const tempDice: [number, number] = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ];
      setGameState(prev => ({ ...prev, dice: tempDice }));
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const finalDice: [number, number] = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1
    ];
    
    // Calculate available moves
    const moves = finalDice[0] === finalDice[1] 
      ? [finalDice[0], finalDice[0], finalDice[0], finalDice[0]] // Doubles
      : [finalDice[0], finalDice[1]];
    
    setGameState(prev => ({
      ...prev,
      dice: finalDice,
      availableMoves: moves,
      selectedPoint: null
    }));
    
    setIsRolling(false);
  }, [isRolling, gameState.winner]);

  const isValidMove = (from: number, to: number, player: 'white' | 'black'): boolean => {
    // Check if move is in the right direction
    if (player === 'white' && to <= from) return false;
    if (player === 'black' && to >= from) return false;
    
    // Check if destination is blocked (more than 1 opponent piece)
    const destPiece = gameState.board[to];
    if (destPiece && destPiece.color !== player && destPiece.count > 1) {
      return false;
    }
    
    return true;
  };

  const canBearOff = (player: 'white' | 'black'): boolean => {
    const homeBoard = player === 'white' ? [18, 19, 20, 21, 22, 23] : [0, 1, 2, 3, 4, 5];
    const bar = player === 'white' ? gameState.whiteBar : gameState.blackBar;
    
    if (bar > 0) return false;
    
    // Check if all pieces are in home board
    for (let i = 0; i < 24; i++) {
      const piece = gameState.board[i];
      if (piece && piece.color === player && !homeBoard.includes(i)) {
        return false;
      }
    }
    
    return true;
  };

  const getPossibleMoves = (player: 'white' | 'black'): BackgammonMove[] => {
    const moves: BackgammonMove[] = [];
    const bar = player === 'white' ? gameState.whiteBar : gameState.blackBar;
    
    // If pieces on bar, must enter first
    if (bar > 0) {
      for (const distance of gameState.availableMoves) {
        const to = player === 'white' ? distance - 1 : 24 - distance;
        if (to >= 0 && to < 24 && isValidMove(-1, to, player)) {
          moves.push({ from: -1, to, distance });
        }
      }
      return moves;
    }
    
    const canBear = canBearOff(player);
    
    for (let from = 0; from < 24; from++) {
      const piece = gameState.board[from];
      if (!piece || piece.color !== player) continue;
      
      for (const distance of gameState.availableMoves) {
        let to: number;
        
        if (player === 'white') {
          to = from + distance;
          
          // Bear off
          if (canBear && to >= 24) {
            moves.push({ from, to: 24, distance });
            continue;
          }
        } else {
          to = from - distance;
          
          // Bear off
          if (canBear && to < 0) {
            moves.push({ from, to: -1, distance });
            continue;
          }
        }
        
        if (to >= 0 && to < 24 && isValidMove(from, to, player)) {
          moves.push({ from, to, distance });
        }
      }
    }
    
    return moves;
  };

  const makeMove = (move: BackgammonMove) => {
    const newGameState = { ...gameState };
    const newBoard = [...gameState.board];
    
    // Remove piece from source
    if (move.from === -1) {
      // From bar
      if (gameState.currentPlayer === 'white') {
        newGameState.whiteBar--;
      } else {
        newGameState.blackBar--;
      }
    } else if (move.to === 24 || move.to === -1) {
      // Bear off
      const piece = newBoard[move.from];
      if (piece) {
        piece.count--;
        if (piece.count === 0) {
          newBoard[move.from] = null;
        }
        
        if (gameState.currentPlayer === 'white') {
          newGameState.whiteBorne++;
        } else {
          newGameState.blackBorne++;
        }
      }
    } else {
      // Regular move
      const fromPiece = newBoard[move.from];
      if (fromPiece) {
        fromPiece.count--;
        if (fromPiece.count === 0) {
          newBoard[move.from] = null;
        }
        
        // Handle destination
        const toPiece = newBoard[move.to];
        if (toPiece && toPiece.color !== gameState.currentPlayer) {
          // Hit opponent piece
          if (gameState.currentPlayer === 'white') {
            newGameState.blackBar++;
          } else {
            newGameState.whiteBar++;
          }
          newBoard[move.to] = { color: gameState.currentPlayer, count: 1 };
        } else if (toPiece && toPiece.color === gameState.currentPlayer) {
          // Add to existing stack
          toPiece.count++;
        } else {
          // Empty point
          newBoard[move.to] = { color: gameState.currentPlayer, count: 1 };
        }
      }
    }
    
    // Remove used die
    const moveIndex = newGameState.availableMoves.indexOf(move.distance);
    if (moveIndex > -1) {
      newGameState.availableMoves.splice(moveIndex, 1);
    }
    
    newGameState.board = newBoard;
    newGameState.selectedPoint = null;
    
    // Check for win
    if (newGameState.whiteBorne === 15) {
      newGameState.winner = 'white';
    } else if (newGameState.blackBorne === 15) {
      newGameState.winner = 'black';
    }
    
    // End turn if no more moves
    if (newGameState.availableMoves.length === 0 || getPossibleMoves(gameState.currentPlayer).length === 0) {
      newGameState.currentPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';
      newGameState.dice = [0, 0];
    }
    
    setGameState(newGameState);
  };

  const getBestMove = (): BackgammonMove | null => {
    const possibleMoves = getPossibleMoves('black');
    if (possibleMoves.length === 0) return null;
    
    let bestMove = possibleMoves[0];
    let bestScore = -Infinity;
    
    for (const move of possibleMoves) {
      let score = 0;
      
      // Prioritize bearing off
      if (move.to === -1) {
        score += 100;
      }
      
      // Prioritize hitting opponent pieces
      if (move.to >= 0 && move.to < 24) {
        const targetPiece = gameState.board[move.to];
        if (targetPiece && targetPiece.color === 'white' && targetPiece.count === 1) {
          score += 50;
        }
      }
      
      // Prioritize entering from bar
      if (move.from === -1) {
        score += 30;
      }
      
      // Prioritize making points (stacking pieces)
      if (move.to >= 0 && move.to < 24) {
        const targetPiece = gameState.board[move.to];
        if (targetPiece && targetPiece.color === 'black') {
          score += targetPiece.count * 5;
        }
      }
      
      // Prioritize advancing pieces
      if (move.from >= 0 && move.to >= 0) {
        score += (move.from - move.to) * 2;
      }
      
      // Add randomness
      score += Math.random() * 10;
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove;
  };

  const makeBotMove = useCallback(() => {
    if (gameState.currentPlayer === 'black' && isBotEnabled && gameState.availableMoves.length > 0) {
      const bestMove = getBestMove();
      if (bestMove) {
        makeMove(bestMove);
      } else {
        // No valid moves, end turn
        setGameState(prev => ({
          ...prev,
          currentPlayer: 'white',
          dice: [0, 0],
          availableMoves: []
        }));
      }
    }
  }, [gameState, isBotEnabled]);

  useEffect(() => {
    if (gameState.currentPlayer === 'black' && isBotEnabled && gameState.availableMoves.length > 0) {
      botTimeoutRef.current = setTimeout(() => {
        makeBotMove();
      }, 1000);
    }
    
    return () => {
      if (botTimeoutRef.current) {
        clearTimeout(botTimeoutRef.current);
      }
    };
  }, [gameState.currentPlayer, gameState.availableMoves, isBotEnabled, makeBotMove]);

  const handlePointClick = (pointIndex: number) => {
    if (isBotEnabled && gameState.currentPlayer === 'black') return;
    if (gameState.availableMoves.length === 0) return;
    
    const piece = gameState.board[pointIndex];
    
    if (gameState.selectedPoint === null) {
      // Select a point
      if (piece && piece.color === gameState.currentPlayer) {
        setGameState(prev => ({ ...prev, selectedPoint: pointIndex }));
      }
    } else {
      // Try to make a move
      const possibleMoves = getPossibleMoves(gameState.currentPlayer);
      const validMove = possibleMoves.find(m => m.from === gameState.selectedPoint && m.to === pointIndex);
      
      if (validMove) {
        makeMove(validMove);
      } else {
        // Select new piece or deselect
        if (piece && piece.color === gameState.currentPlayer) {
          setGameState(prev => ({ ...prev, selectedPoint: pointIndex }));
        } else {
          setGameState(prev => ({ ...prev, selectedPoint: null }));
        }
      }
    }
  };

  const handleBarClick = () => {
    if (isBotEnabled && gameState.currentPlayer === 'black') return;
    
    const bar = gameState.currentPlayer === 'white' ? gameState.whiteBar : gameState.blackBar;
    if (bar > 0) {
      setGameState(prev => ({ ...prev, selectedPoint: -1 }));
    }
  };

  const resetGame = () => {
    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current);
    }
    setGameState(initializeGame());
    setGameStatus('');
  };

  const getStatusMessage = () => {
    if (gameState.winner) return `${gameState.winner} wins!`;
    if (gameStatus) return gameStatus;
    if (isBotEnabled && gameState.currentPlayer === 'black') return "Bot is thinking...";
    if (gameState.dice[0] === 0) return `${gameState.currentPlayer}'s turn - Roll dice`;
    return `${gameState.currentPlayer}'s turn - ${gameState.availableMoves.length} moves left`;
  };

  const renderPoint = (pointIndex: number, isTop: boolean) => {
    const piece = gameState.board[pointIndex];
    const isSelected = gameState.selectedPoint === pointIndex;
    
    return (
      <div
        key={pointIndex}
        onClick={() => handlePointClick(pointIndex)}
        className={`
          w-12 h-32 cursor-pointer border-2 transition-colors relative
          ${isTop ? 'border-b-0' : 'border-t-0'}
          ${pointIndex % 2 === 0 ? 'bg-red-100 border-red-300' : 'bg-blue-100 border-blue-300'}
          ${isSelected ? 'ring-4 ring-yellow-400' : ''}
          hover:brightness-110
        `}
      >
        <div className={`text-xs text-center font-bold ${isTop ? 'mt-1' : 'mb-1 absolute bottom-0 w-full'}`}>
          {pointIndex + 1}
        </div>
        
        {piece && (
          <div className={`absolute ${isTop ? 'top-6' : 'bottom-6'} left-1/2 transform -translate-x-1/2`}>
            {Array.from({ length: Math.min(piece.count, 5) }).map((_, i) => (
              <div
                key={i}
                className={`
                  w-8 h-4 rounded-full border border-gray-600 mb-0.5
                  ${piece.color === 'white' ? 'bg-white' : 'bg-gray-800'}
                `}
                style={{
                  marginTop: isTop ? `${i * 4}px` : `-${i * 4}px`,
                  zIndex: 5 - i
                }}
              />
            ))}
            {piece.count > 5 && (
              <div className={`
                absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                text-xs font-bold z-10
                ${piece.color === 'white' ? 'text-black' : 'text-white'}
              `}>
                {piece.count}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="flex items-center justify-between w-full max-w-4xl">
        <h3 className="text-2xl font-bold text-gray-800">Backgammon</h3>
        <button
          onClick={resetGame}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          Reset Game
        </button>
      </div>
      
      <div className={`text-lg font-semibold ${
        gameState.winner ? 'text-green-600' : 
        isBotEnabled && gameState.currentPlayer === 'black' ? 'text-purple-600' : 'text-gray-700'
      }`}>
        {getStatusMessage()}
      </div>
      
      <div className="flex items-center space-x-4">
        <button
          onClick={rollDice}
          disabled={isRolling || gameState.winner !== null || gameState.availableMoves.length > 0 || (isBotEnabled && gameState.currentPlayer === 'black')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-white font-semibold transition-all ${
            isRolling || gameState.winner || gameState.availableMoves.length > 0 || (isBotEnabled && gameState.currentPlayer === 'black')
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 active:scale-95'
          }`}
        >
          <span>Roll Dice</span>
        </button>
        
        <div className="flex space-x-2">
          {gameState.dice[0] > 0 && getDiceIcon(gameState.dice[0])}
          {gameState.dice[1] > 0 && getDiceIcon(gameState.dice[1])}
        </div>
        
        {gameState.availableMoves.length > 0 && (
          <div className="text-sm text-gray-600">
            Moves: {gameState.availableMoves.join(', ')}
          </div>
        )}
      </div>
      
      {/* Game Board */}
      <div className="bg-amber-100 border-4 border-amber-800 rounded-lg p-4">
        {/* Top half */}
        <div className="flex space-x-1 mb-4">
          {Array.from({ length: 12 }).map((_, i) => renderPoint(12 + i, true))}
        </div>
        
        {/* Middle bar */}
        <div className="flex justify-between items-center h-16 bg-amber-800 px-4 mb-4">
          <div 
            onClick={handleBarClick}
            className={`flex flex-col items-center cursor-pointer ${
              gameState.selectedPoint === -1 ? 'ring-4 ring-yellow-400 rounded' : ''
            }`}
          >
            <div className="text-white text-sm font-bold">Bar</div>
            <div className="flex space-x-1">
              {gameState.whiteBar > 0 && (
                <div className="flex flex-col">
                  {Array.from({ length: Math.min(gameState.whiteBar, 3) }).map((_, i) => (
                    <div key={i} className="w-6 h-3 bg-white rounded-full border border-gray-600 mb-0.5" />
                  ))}
                  {gameState.whiteBar > 3 && (
                    <div className="text-xs text-white font-bold">{gameState.whiteBar}</div>
                  )}
                </div>
              )}
              {gameState.blackBar > 0 && (
                <div className="flex flex-col">
                  {Array.from({ length: Math.min(gameState.blackBar, 3) }).map((_, i) => (
                    <div key={i} className="w-6 h-3 bg-gray-800 rounded-full border border-gray-600 mb-0.5" />
                  ))}
                  {gameState.blackBar > 3 && (
                    <div className="text-xs text-white font-bold">{gameState.blackBar}</div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-8">
            <div className="text-center">
              <div className="text-white text-sm font-bold">White Home</div>
              <div className="text-white text-lg font-bold">{gameState.whiteBorne}/15</div>
            </div>
            <div className="text-center">
              <div className="text-white text-sm font-bold">Black Home</div>
              <div className="text-white text-lg font-bold">{gameState.blackBorne}/15</div>
            </div>
          </div>
        </div>
        
        {/* Bottom half */}
        <div className="flex space-x-1">
          {Array.from({ length: 12 }).map((_, i) => renderPoint(11 - i, false))}
        </div>
      </div>
      
      <div className="text-sm text-gray-600 max-w-2xl text-center">
        <p>Move your pieces around the board and bear them off to win. Hit opponent pieces to send them to the bar.</p>
        <p>You must use all dice rolls if possible. Doubles let you move 4 times!</p>
      </div>
    </div>
  );
};

export default Backgammon;