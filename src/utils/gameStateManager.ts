import { GameState, GamePhase, Player, GameEvent, GameEventHandler } from '@/types/game'
import { GAME_CONFIG } from '@/config/gameConfig'
import { createEnemyGrid } from './gameLogic'

export class GameStateManager {
  private state: GameState
  private listeners: ((state: GameState) => void)[] = []
  private eventHandlers: Map<string, GameEventHandler[]> = new Map()
  
  constructor() {
    this.state = this.createInitialState()
  }
  
  private createInitialState(): GameState {
    return {
      phase: 'start',
      score: 0,
      lives: GAME_CONFIG.game.initialLives,
      level: 1,
      enemies: [],
      bullets: [],
      particles: [],
      player: this.createPlayer(),
      lastUpdateTime: 0,
      fps: 0
    }
  }
  
  private createPlayer(): Player {
    return {
      x: GAME_CONFIG.player.startX - GAME_CONFIG.player.width / 2,
      y: GAME_CONFIG.player.startY,
      width: GAME_CONFIG.player.width,
      height: GAME_CONFIG.player.height,
      speed: GAME_CONFIG.player.speed,
      active: true,
      lives: GAME_CONFIG.game.initialLives
    }
  }
  
  getState(): GameState {
    return { ...this.state }
  }
  
  updateState(updates: Partial<GameState>): void {
    const previousPhase = this.state.phase
    this.state = { ...this.state, ...updates }
    
    // Emit phase change events
    if (previousPhase !== this.state.phase) {
      this.emitEvent({
        type: this.state.phase as any,
        data: { previousPhase, currentPhase: this.state.phase }
      })
    }
    
    this.notifyListeners()
  }
  
  startGame(): void {
    this.state = {
      ...this.createInitialState(),
      phase: 'playing',
      enemies: createEnemyGrid()
    }
    this.notifyListeners()
  }
  
  pauseGame(): void {
    if (this.state.phase === 'playing') {
      this.updateState({ phase: 'paused' })
    }
  }
  
  resumeGame(): void {
    if (this.state.phase === 'paused') {
      this.updateState({ phase: 'playing' })
    }
  }
  
  gameOver(): void {
    this.updateState({ phase: 'gameOver' })
    this.emitEvent({ type: 'gameOver', data: { finalScore: this.state.score } })
  }
  
  nextLevel(): void {
    const newLevel = this.state.level + 1
    this.updateState({
      level: newLevel,
      enemies: createEnemyGrid(),
      bullets: [],
      particles: [],
      player: {
        ...this.state.player,
        x: GAME_CONFIG.player.startX - GAME_CONFIG.player.width / 2,
        y: GAME_CONFIG.player.startY
      }
    })
    this.emitEvent({ type: 'levelComplete', data: { level: newLevel } })
  }
  
  loseLife(): void {
    const newLives = Math.max(0, this.state.lives - 1)
    this.updateState({ lives: newLives })
    
    if (newLives <= 0) {
      this.gameOver()
    } else {
      // Reset player position
      this.updateState({
        player: {
          ...this.state.player,
          x: GAME_CONFIG.player.startX - GAME_CONFIG.player.width / 2,
          y: GAME_CONFIG.player.startY
        },
        enemies: createEnemyGrid(),
        bullets: [],
        particles: []
      })
    }
    
    this.emitEvent({ type: 'playerHit', data: { livesRemaining: newLives } })
  }
  
  addScore(points: number): void {
    this.updateState({ score: this.state.score + points })
  }
  
  updateFPS(fps: number): void {
    this.updateState({ fps })
  }
  
  updateLastUpdateTime(time: number): void {
    this.updateState({ lastUpdateTime: time })
  }
  
  // Event system
  addEventListener(eventType: string, handler: GameEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, [])
    }
    
    const handlers = this.eventHandlers.get(eventType)!
    handlers.push(handler)
    
    // Return unsubscribe function
    return () => {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }
  
  private emitEvent(event: GameEvent): void {
    const handlers = this.eventHandlers.get(event.type)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event)
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error)
        }
      })
    }
  }
  
  // State subscription
  subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state)
      } catch (error) {
        console.error('Error in state listener:', error)
      }
    })
  }
  
  // Utility methods
  isPlaying(): boolean {
    return this.state.phase === 'playing'
  }
  
  isPaused(): boolean {
    return this.state.phase === 'paused'
  }
  
  isGameOver(): boolean {
    return this.state.phase === 'gameOver'
  }
  
  canShoot(): boolean {
    return this.isPlaying() && this.state.bullets.length < 5 // Limit bullets
  }
  
  reset(): void {
    this.state = this.createInitialState()
    this.notifyListeners()
  }
  
  // Debug methods
  getDebugInfo() {
    return {
      phase: this.state.phase,
      score: this.state.score,
      lives: this.state.lives,
      level: this.state.level,
      enemyCount: this.state.enemies.filter(e => e.active).length,
      bulletCount: this.state.bullets.filter(b => b.active).length,
      particleCount: this.state.particles.filter(p => p.life > 0).length,
      fps: this.state.fps,
      listenerCount: this.listeners.length,
      eventHandlerCount: Array.from(this.eventHandlers.values()).reduce((sum, handlers) => sum + handlers.length, 0)
    }
  }
}
