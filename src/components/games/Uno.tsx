import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Shuffle, RotateCcw } from 'lucide-react';
import { UnoCard, UnoPlayer, UnoGameState } from '../../types/games';

interface UnoProps {
  isBotEnabled: boolean;
}

const Uno: React.FC<UnoProps> = ({ isBotEnabled }) => {
  const [gameState, setGameState] = useState<UnoGameState>(initializeGame());
  const [selectedCard, setSelectedCard] = useState<UnoCard | null>(null);
  const [gameStatus, setGameStatus] = useState<string>('');
  const botTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  function generateCardId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  function createDeck(): UnoCard[] {
    const deck: UnoCard[] = [];
    const colors: ('red' | 'blue' | 'green' | 'yellow')[] = ['red', 'blue', 'green', 'yellow'];
    
    // Number cards (0-9)
    colors.forEach(color => {
      // One 0 card per color
      deck.push({ id: generateCardId(), color, type: 'number', value: 0 });
      
      // Two of each number 1-9 per color
      for (let num = 1; num <= 9; num++) {
        deck.push({ id: generateCardId(), color, type: 'number', value: num });
        deck.push({ id: generateCardId(), color, type: 'number', value: num });
      }
      
      // Action cards (2 of each per color)
      deck.push({ id: generateCardId(), color, type: 'skip' });
      deck.push({ id: generateCardId(), color, type: 'skip' });
      deck.push({ id: generateCardId(), color, type: 'reverse' });
      deck.push({ id: generateCardId(), color, type: 'reverse' });
      deck.push({ id: generateCardId(), color, type: 'draw2' });
      deck.push({ id: generateCardId(), color, type: 'draw2' });
    });
    
    // Wild cards (4 of each)
    for (let i = 0; i < 4; i++) {
      deck.push({ id: generateCardId(), color: 'wild', type: 'wild' });
      deck.push({ id: generateCardId(), color: 'wild', type: 'wild4' });
    }
    
    return shuffleDeck(deck);
  }

  function shuffleDeck(deck: UnoCard[]): UnoCard[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  function initializeGame(): UnoGameState {
    const deck = createDeck();
    const players: UnoPlayer[] = [
      { id: '1', name: 'Player 1', cards: [], isBot: false },
      { id: '2', name: 'Bot Player', cards: [], isBot: true },
    ];

    // Deal 7 cards to each player
    players.forEach(player => {
      for (let i = 0; i < 7; i++) {
        player.cards.push(deck.pop()!);
      }
    });

    // Find a valid starting card (not wild or action card)
    let topCard: UnoCard;
    do {
      topCard = deck.pop()!;
    } while (topCard.color === 'wild' || topCard.type !== 'number');

    return {
      players,
      currentPlayerIndex: 0,
      direction: 1,
      topCard,
      deck,
      currentColor: topCard.color as 'red' | 'blue' | 'green' | 'yellow',
      winner: null,
      gamePhase: 'playing',
      pendingDrawCount: 0,
    };
  }

  const getCardColor = (card: UnoCard): string => {
    const colorMap = {
      red: 'bg-red-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-400',
      wild: 'bg-gray-800',
    };
    return colorMap[card.color];
  };

  const getCardSymbol = (card: UnoCard): string => {
    if (card.type === 'number') return card.value?.toString() || '0';
    if (card.type === 'skip') return '⊘';
    if (card.type === 'reverse') return '↻';
    if (card.type === 'draw2') return '+2';
    if (card.type === 'wild') return '🌈';
    if (card.type === 'wild4') return '+4';
    return '';
  };

  const canPlayCard = (card: UnoCard, topCard: UnoCard, currentColor: string): boolean => {
    // Wild cards can always be played
    if (card.color === 'wild') return true;
    
    // Same color
    if (card.color === currentColor) return true;
    
    // Same type/value
    if (card.type === topCard.type && card.type === 'number' && card.value === topCard.value) return true;
    if (card.type === topCard.type && card.type !== 'number') return true;
    
    return false;
  };

  const drawCards = (playerIndex: number, count: number) => {
    const newGameState = { ...gameState };
    const player = newGameState.players[playerIndex];
    
    for (let i = 0; i < count; i++) {
      if (newGameState.deck.length === 0) {
        // Reshuffle discard pile if deck is empty
        const newDeck = shuffleDeck([newGameState.topCard]);
        newGameState.deck = newDeck;
      }
      
      if (newGameState.deck.length > 0) {
        player.cards.push(newGameState.deck.pop()!);
      }
    }
    
    setGameState(newGameState);
  };

  const playCard = (card: UnoCard, chosenColor?: 'red' | 'blue' | 'green' | 'yellow') => {
    if (!canPlayCard(card, gameState.topCard, gameState.currentColor)) return;
    
    const newGameState = { ...gameState };
    const currentPlayer = newGameState.players[newGameState.currentPlayerIndex];
    
    // Remove card from player's hand
    currentPlayer.cards = currentPlayer.cards.filter(c => c.id !== card.id);
    
    // Update top card and color
    newGameState.topCard = card;
    newGameState.currentColor = chosenColor || (card.color as 'red' | 'blue' | 'green' | 'yellow');
    
    // Check for win
    if (currentPlayer.cards.length === 0) {
      newGameState.winner = currentPlayer.name;
      newGameState.gamePhase = 'finished';
      setGameState(newGameState);
      return;
    }
    
    // Handle special cards
    let skipNext = false;
    
    switch (card.type) {
      case 'skip':
        skipNext = true;
        break;
      case 'reverse':
        newGameState.direction *= -1;
        if (newGameState.players.length === 2) {
          skipNext = true; // In 2-player game, reverse acts like skip
        }
        break;
      case 'draw2':
        const nextPlayerIndex = (newGameState.currentPlayerIndex + newGameState.direction + newGameState.players.length) % newGameState.players.length;
        drawCards(nextPlayerIndex, 2);
        skipNext = true;
        break;
      case 'wild4':
        const nextPlayerIndex4 = (newGameState.currentPlayerIndex + newGameState.direction + newGameState.players.length) % newGameState.players.length;
        drawCards(nextPlayerIndex4, 4);
        skipNext = true;
        break;
    }
    
    // Move to next player
    let nextIndex = newGameState.currentPlayerIndex + newGameState.direction;
    if (skipNext) {
      nextIndex += newGameState.direction;
    }
    nextIndex = (nextIndex + newGameState.players.length) % newGameState.players.length;
    newGameState.currentPlayerIndex = nextIndex;
    
    setGameState(newGameState);
    setSelectedCard(null);
  };

  const getBestMove = (): { card: UnoCard; color?: 'red' | 'blue' | 'green' | 'yellow' } | null => {
    const botPlayer = gameState.players[gameState.currentPlayerIndex];
    const playableCards = botPlayer.cards.filter(card => 
      canPlayCard(card, gameState.topCard, gameState.currentColor)
    );
    
    if (playableCards.length === 0) return null;
    
    // Prioritize action cards
    const actionCards = playableCards.filter(card => 
      ['skip', 'reverse', 'draw2'].includes(card.type)
    );
    
    if (actionCards.length > 0) {
      return { card: actionCards[0] };
    }
    
    // Prioritize matching color over matching number
    const colorMatches = playableCards.filter(card => 
      card.color === gameState.currentColor && card.color !== 'wild'
    );
    
    if (colorMatches.length > 0) {
      return { card: colorMatches[0] };
    }
    
    // Play wild cards last, choose most common color in hand
    const wildCards = playableCards.filter(card => card.color === 'wild');
    if (wildCards.length > 0) {
      const colorCounts = { red: 0, blue: 0, green: 0, yellow: 0 };
      botPlayer.cards.forEach(card => {
        if (card.color !== 'wild') {
          colorCounts[card.color as keyof typeof colorCounts]++;
        }
      });
      
      const bestColor = Object.entries(colorCounts).reduce((a, b) => 
        colorCounts[a[0] as keyof typeof colorCounts] > colorCounts[b[0] as keyof typeof colorCounts] ? a : b
      )[0] as 'red' | 'blue' | 'green' | 'yellow';
      
      return { card: wildCards[0], color: bestColor };
    }
    
    // Play any remaining card
    return { card: playableCards[0] };
  };

  const makeBotMove = useCallback(() => {
    if (gameState.currentPlayerIndex === 1 && isBotEnabled && gameState.gamePhase === 'playing') {
      const bestMove = getBestMove();
      
      if (bestMove) {
        playCard(bestMove.card, bestMove.color);
      } else {
        // Draw a card
        drawCards(1, 1);
        
        // Move to next player after drawing
        const nextIndex = (gameState.currentPlayerIndex + gameState.direction + gameState.players.length) % gameState.players.length;
        setGameState(prev => ({ ...prev, currentPlayerIndex: nextIndex }));
      }
    }
  }, [gameState, isBotEnabled]);

  useEffect(() => {
    if (gameState.currentPlayerIndex === 1 && isBotEnabled && gameState.gamePhase === 'playing') {
      botTimeoutRef.current = setTimeout(() => {
        makeBotMove();
      }, 1500);
    }
    
    return () => {
      if (botTimeoutRef.current) {
        clearTimeout(botTimeoutRef.current);
      }
    };
  }, [gameState.currentPlayerIndex, gameState.gamePhase, isBotEnabled, makeBotMove]);

  const handleCardClick = (card: UnoCard) => {
    if (isBotEnabled && gameState.currentPlayerIndex === 1) return;
    if (gameState.gamePhase !== 'playing') return;
    if (gameState.currentPlayerIndex !== 0) return;
    
    if (canPlayCard(card, gameState.topCard, gameState.currentColor)) {
      if (card.color === 'wild') {
        setSelectedCard(card);
        setGameState(prev => ({ ...prev, gamePhase: 'color-selection' }));
      } else {
        playCard(card);
      }
    } else {
      setGameStatus('Invalid card! Must match color, number, or symbol.');
      setTimeout(() => setGameStatus(''), 2000);
    }
  };

  const handleColorSelection = (color: 'red' | 'blue' | 'green' | 'yellow') => {
    if (selectedCard) {
      playCard(selectedCard, color);
      setGameState(prev => ({ ...prev, gamePhase: 'playing' }));
    }
  };

  const handleDrawCard = () => {
    if (isBotEnabled && gameState.currentPlayerIndex === 1) return;
    if (gameState.gamePhase !== 'playing') return;
    if (gameState.currentPlayerIndex !== 0) return;
    
    drawCards(0, 1);
    
    // Move to next player
    const nextIndex = (gameState.currentPlayerIndex + gameState.direction + gameState.players.length) % gameState.players.length;
    setGameState(prev => ({ ...prev, currentPlayerIndex: nextIndex }));
  };

  const resetGame = () => {
    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current);
    }
    setGameState(initializeGame());
    setSelectedCard(null);
    setGameStatus('');
  };

  const getStatusMessage = () => {
    if (gameState.winner) return `🎉 ${gameState.winner} wins! 🎉`;
    if (gameStatus) return gameStatus;
    if (gameState.gamePhase === 'color-selection') return 'Choose a color for your wild card';
    if (isBotEnabled && gameState.currentPlayerIndex === 1) return "Bot is thinking...";
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    return `${currentPlayer.name}'s turn`;
  };

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const humanPlayer = gameState.players[0];
  const botPlayer = gameState.players[1];

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="flex items-center justify-between w-full max-w-4xl">
        <h3 className="text-2xl font-bold text-gray-800">UNO</h3>
        <button
          onClick={resetGame}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Reset Game
        </button>
      </div>
      
      <div className={`text-lg font-semibold ${
        gameState.winner ? 'text-green-600' : 
        gameState.gamePhase === 'color-selection' ? 'text-purple-600' :
        isBotEnabled && gameState.currentPlayerIndex === 1 ? 'text-blue-600' : 'text-gray-700'
      }`}>
        {getStatusMessage()}
      </div>

      {/* Color Selection Modal */}
      {gameState.gamePhase === 'color-selection' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h4 className="text-lg font-bold mb-4 text-center">Choose a Color</h4>
            <div className="grid grid-cols-2 gap-4">
              {(['red', 'blue', 'green', 'yellow'] as const).map(color => (
                <button
                  key={color}
                  onClick={() => handleColorSelection(color)}
                  className={`w-16 h-16 rounded-lg border-2 border-gray-300 hover:border-gray-500 transition-colors ${
                    color === 'red' ? 'bg-red-500' :
                    color === 'blue' ? 'bg-blue-500' :
                    color === 'green' ? 'bg-green-500' :
                    'bg-yellow-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game Board */}
      <div className="flex flex-col items-center space-y-6">
        {/* Bot Player Cards */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-600">
            {isBotEnabled ? 'Bot Player' : 'Player 2'}: {botPlayer.cards.length} cards
          </span>
          <div className="flex space-x-1">
            {Array.from({ length: Math.min(botPlayer.cards.length, 10) }).map((_, i) => (
              <div
                key={i}
                className="w-8 h-12 bg-blue-800 rounded border border-gray-300 flex items-center justify-center"
              >
                <span className="text-white text-xs">UNO</span>
              </div>
            ))}
            {botPlayer.cards.length > 10 && (
              <span className="text-sm text-gray-500">+{botPlayer.cards.length - 10}</span>
            )}
          </div>
        </div>

        {/* Center Area */}
        <div className="flex items-center space-x-8">
          {/* Deck */}
          <div className="flex flex-col items-center space-y-2">
            <button
              onClick={handleDrawCard}
              disabled={gameState.gamePhase !== 'playing' || gameState.currentPlayerIndex !== 0 || (isBotEnabled && gameState.currentPlayerIndex === 1)}
              className={`w-16 h-24 rounded-lg border-2 flex items-center justify-center font-bold text-white transition-all ${
                gameState.gamePhase === 'playing' && gameState.currentPlayerIndex === 0 && !(isBotEnabled && gameState.currentPlayerIndex === 1)
                  ? 'bg-gray-700 border-gray-500 hover:bg-gray-600 cursor-pointer'
                  : 'bg-gray-400 border-gray-300 cursor-not-allowed'
              }`}
            >
              <Shuffle className="w-6 h-6" />
            </button>
            <span className="text-xs text-gray-600">Draw ({gameState.deck.length})</span>
          </div>

          {/* Top Card */}
          <div className="flex flex-col items-center space-y-2">
            <div className={`w-16 h-24 rounded-lg border-2 border-gray-300 flex items-center justify-center font-bold text-white text-lg ${
              getCardColor(gameState.topCard)
            }`}>
              {getCardSymbol(gameState.topCard)}
            </div>
            <div className={`w-4 h-4 rounded-full border border-gray-300 ${
              gameState.currentColor === 'red' ? 'bg-red-500' :
              gameState.currentColor === 'blue' ? 'bg-blue-500' :
              gameState.currentColor === 'green' ? 'bg-green-500' :
              'bg-yellow-400'
            }`} />
          </div>
        </div>

        {/* Human Player Cards */}
        <div className="flex flex-col items-center space-y-2">
          <span className="text-sm font-medium text-gray-600">
            Your cards ({humanPlayer.cards.length})
          </span>
          <div className="flex flex-wrap gap-2 max-w-4xl justify-center">
            {humanPlayer.cards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card)}
                disabled={gameState.gamePhase !== 'playing' || gameState.currentPlayerIndex !== 0}
                className={`w-12 h-18 rounded-lg border-2 flex items-center justify-center font-bold text-white text-sm transition-all hover:scale-105 ${
                  getCardColor(card)
                } ${
                  canPlayCard(card, gameState.topCard, gameState.currentColor) && gameState.currentPlayerIndex === 0 && gameState.gamePhase === 'playing'
                    ? 'border-yellow-400 shadow-lg cursor-pointer'
                    : 'border-gray-300 cursor-not-allowed opacity-75'
                }`}
              >
                {getCardSymbol(card)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-600 max-w-2xl text-center">
        <p>Match the color, number, or symbol. Wild cards can be played anytime.</p>
        <p>Special cards: Skip (⊘), Reverse (↻), Draw Two (+2), Wild (🌈), Wild Draw Four (+4)</p>
      </div>
    </div>
  );
};

export default Uno;