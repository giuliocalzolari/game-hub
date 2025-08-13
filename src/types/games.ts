export interface Game {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface ChessPosition {
  row: number;
  col: number;
}

export interface ChessPiece {
  type: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
  color: 'white' | 'black';
  position: ChessPosition;
  hasMoved?: boolean;
}

export interface DamaPosition {
  row: number;
  col: number;
}

export interface DamaPiece {
  color: 'red' | 'black';
  position: DamaPosition;
  isKing: boolean;
}

export interface TrisBoard {
  squares: Array<'X' | 'O' | null>;
  currentPlayer: 'X' | 'O';
  winner: 'X' | 'O' | 'tie' | null;
}

export interface SnakesAndLaddersPlayer {
  id: string;
  name: string;
  position: number;
  color: string;
}

export interface BackgammonPiece {
  color: 'white' | 'black';
  count: number;
}

export interface BackgammonMove {
  from: number;
  to: number;
  distance: number;
}

export interface BackgammonGameState {
  board: (BackgammonPiece | null)[];
  currentPlayer: 'white' | 'black';
  dice: [number, number];
  availableMoves: number[];
  selectedPoint: number | null;
  whiteBar: number;
  blackBar: number;
  whiteBorne: number;
  blackBorne: number;
  winner: 'white' | 'black' | null;
}

export interface UnoCard {
  id: string;
  color: 'red' | 'blue' | 'green' | 'yellow' | 'wild';
  type: 'number' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';
  value?: number; // 0-9 for number cards
}

export interface UnoPlayer {
  id: string;
  name: string;
  cards: UnoCard[];
  isBot: boolean;
}

export interface UnoGameState {
  players: UnoPlayer[];
  currentPlayerIndex: number;
  direction: 1 | -1; // 1 for clockwise, -1 for counter-clockwise
  topCard: UnoCard;
  deck: UnoCard[];
  currentColor: 'red' | 'blue' | 'green' | 'yellow';
  winner: string | null;
  gamePhase: 'playing' | 'color-selection' | 'finished';
  pendingDrawCount: number; // For stacking draw cards
}