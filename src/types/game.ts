export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Velocity {
  vx: number
  vy: number
}

export interface GameObject extends Position, Size {
  active: boolean
}

export interface Player extends GameObject {
  speed: number
  lives: number
}

export interface Bullet extends GameObject {
  speed: number
}

export interface Enemy extends GameObject {
  speed: number
  direction: number
  animFrame: number
  row: number
  col: number
}

export interface Particle extends Position, Velocity {
  life: number
  maxLife: number
  color: string
}

export type GamePhase = 'start' | 'playing' | 'paused' | 'gameOver' | 'levelComplete'

export interface GameState {
  phase: GamePhase
  score: number
  lives: number
  level: number
  enemies: Enemy[]
  bullets: Bullet[]
  particles: Particle[]
  player: Player
  lastUpdateTime: number
  fps: number
}

export interface GameStats {
  fps: number
  frameTime: number
  entityCount: number
  particleCount: number
}

export interface AudioConfig {
  frequency: number
  duration: number
  type: OscillatorType
  volume: number
}

export interface CollisionBox {
  x: number
  y: number
  width: number
  height: number
}

export interface GameEvent {
  type: 'shoot' | 'enemyDestroyed' | 'playerHit' | 'levelComplete' | 'gameOver'
  data?: any
}

export type GameEventHandler = (event: GameEvent) => void
