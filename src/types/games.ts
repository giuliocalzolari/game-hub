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