'use client'

import React, { useRef, useEffect, useCallback, useState } from 'react'
import { useGameLoop } from '@/hooks/useGameLoop'
import { useKeyboard } from '@/hooks/useKeyboard'
import { GameStateManager } from '@/utils/gameStateManager'
import { AudioManager } from '@/utils/audioManager'
import { PerformanceMonitor } from '@/utils/performance'
import { CanvasRenderer } from '@/utils/renderer'
import { bulletPool, particlePool, PooledBullet, PooledParticle } from '@/utils/objectPool'
import { 
  updateEnemyPositions, 
  checkBulletEnemyCollisions, 
  checkEnemyPlayerCollision,
  clampToCanvas,
  isLevelComplete
} from '@/utils/gameLogic'
import { GAME_CONFIG } from '@/config/gameConfig'
import { GameState, GameStats } from '@/types/game'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Volume2, VolumeX, Pause, Play, RotateCcw } from 'lucide-react'

interface GameProps {
  onScoreChange?: (score: number) => void
  onGameOver?: (finalScore: number) => void
  showDebug?: boolean
}

function SpaceInvadersGame({ onScoreChange, onGameOver, showDebug = false }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameStateManagerRef = useRef<GameStateManager>(new GameStateManager())
  const audioManagerRef = useRef<AudioManager>(new AudioManager())
  const performanceMonitorRef = useRef<PerformanceMonitor>(new PerformanceMonitor())
  const rendererRef = useRef<CanvasRenderer | null>(null)
  
  const [gameState, setGameState] = useState<GameState>(gameStateManagerRef.current.getState())
  const [gameStats, setGameStats] = useState<GameStats>({ fps: 0, frameTime: 0, entityCount: 0, particleCount: 0 })
  const [isMuted, setIsMuted] = useState(false)
  
  const keyboard = useKeyboard()
  
  // Initialize renderer and focus management
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      try {
        rendererRef.current = new CanvasRenderer(canvasRef.current)
        
        // Ensure canvas can receive focus and keyboard events
        canvasRef.current.focus()
        
        // Add click handler to focus canvas when clicked
        const handleCanvasClick = () => {
          canvasRef.current?.focus()
        }
        
        canvasRef.current.addEventListener('click', handleCanvasClick)
        
        return () => {
          canvasRef.current?.removeEventListener('click', handleCanvasClick)
        }
      } catch (error) {
        console.error('Failed to initialize renderer:', error)
        throw error
      }
    }
  }, [])
  
  // Fallback keyboard handling for critical keys
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const gameStateManager = gameStateManagerRef.current
      const currentState = gameStateManager.getState()
      
      // Handle Enter key for start/restart
      if (e.key === 'Enter') {
        e.preventDefault()
        if (currentState.phase === 'start' || currentState.phase === 'gameOver') {
          gameStateManager.startGame()
          bulletPool.releaseAll()
          particlePool.releaseAll()
        }
      }
      
      // Handle P and Escape for pause/resume
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        e.preventDefault()
        if (currentState.phase === 'playing') {
          gameStateManager.pauseGame()
        } else if (currentState.phase === 'paused') {
          gameStateManager.resumeGame()
        }
      }
      
      if (showDebug) {
        console.log('Global key pressed:', e.key, 'Game phase:', currentState.phase)
      }
    }
    
    // Add global event listener
    document.addEventListener('keydown', handleGlobalKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [showDebug])
  
  // Subscribe to game state changes
  useEffect(() => {
    const unsubscribe = gameStateManagerRef.current.subscribe((newState) => {
      setGameState(newState)
      onScoreChange?.(newState.score)
      
      if (newState.phase === 'gameOver') {
        onGameOver?.(newState.score)
      }
    })
    
    return unsubscribe
  }, [onScoreChange, onGameOver])
  
  // Game update logic
  const updateGame = useCallback((deltaTime: number, currentTime: number) => {
    const gameStateManager = gameStateManagerRef.current
    const audioManager = audioManagerRef.current
    const performanceMonitor = performanceMonitorRef.current
    
    if (!gameStateManager.isPlaying()) {
      return
    }
    
    const currentState = gameStateManager.getState()
    
    // Update performance monitor
    performanceMonitor.update(currentTime)
    gameStateManager.updateFPS(performanceMonitor.getFPS())
    
    // Handle input
    handleInput(gameStateManager, audioManager)
    
    // Update game objects
    updateGameObjects(gameStateManager)
    
    // Check collisions
    handleCollisions(gameStateManager, audioManager)
    
    // Update object pools
    bulletPool.update()
    particlePool.update()
    
    // Update performance stats
    const stats = performanceMonitor.getStats()
    const activeEnemies = currentState.enemies.filter(e => e.active).length
    const activeBullets = bulletPool.getActive().length
    const activeParticles = particlePool.getActive().length
    
    performanceMonitor.updateEntityCounts(
      activeEnemies + activeBullets + 1, // +1 for player
      activeParticles
    )
    
    setGameStats({
      ...stats,
      entityCount: activeEnemies + activeBullets + 1,
      particleCount: activeParticles
    })
    
  }, [])
  
  // Game render logic
  const renderGame = useCallback((interpolation: number) => {
    const renderer = rendererRef.current
    const gameStateManager = gameStateManagerRef.current
    
    if (!renderer) return
    
    const currentState = gameStateManager.getState()
    
    try {
      // Clear and draw background
      renderer.clear()
      renderer.drawBackground()
      
      if (currentState.phase === 'playing') {
        // Draw game objects
        renderer.drawPlayer(currentState.player)
        renderer.drawEnemies(currentState.enemies)
        renderer.drawBullets(bulletPool.getActive())
        renderer.drawParticles(particlePool.getActive())
        renderer.drawUI(currentState)
        
        if (showDebug) {
          renderer.drawDebugInfo(currentState)
          renderer.drawCollisionBoxes(currentState)
        }
      } else if (currentState.phase === 'start') {
        renderer.drawStartScreen()
      } else if (currentState.phase === 'gameOver') {
        renderer.drawGameOverScreen(currentState.score)
      } else if (currentState.phase === 'paused') {
        // Draw game state first, then pause overlay
        renderer.drawPlayer(currentState.player)
        renderer.drawEnemies(currentState.enemies)
        renderer.drawBullets(bulletPool.getActive())
        renderer.drawParticles(particlePool.getActive())
        renderer.drawUI(currentState)
        renderer.drawPauseScreen()
      }
    } catch (error) {
      console.error('Render error:', error)
      throw error
    }
  }, [showDebug])
  
  // Input handling
  const handleInput = useCallback((gameStateManager: GameStateManager, audioManager: AudioManager) => {
    const currentState = gameStateManager.getState()
    
    // Start/restart game
    if (keyboard.wasJustPressed('Enter')) {
      if (currentState.phase === 'start' || currentState.phase === 'gameOver') {
        gameStateManager.startGame()
        bulletPool.releaseAll()
        particlePool.releaseAll()
      }
    }
    
    // Pause/resume - handle both 'p', 'P', and 'Escape'
    if (keyboard.wasJustPressed('p') || keyboard.wasJustPressed('P') || keyboard.wasJustPressed('Escape')) {
      if (currentState.phase === 'playing') {
        gameStateManager.pauseGame()
      } else if (currentState.phase === 'paused') {
        gameStateManager.resumeGame()
      }
    }
    
    if (!gameStateManager.isPlaying()) return
    
    // Player movement
    let newPlayerX = currentState.player.x
    
    if (keyboard.isPressed('ArrowLeft')) {
      newPlayerX -= currentState.player.speed
    }
    if (keyboard.isPressed('ArrowRight')) {
      newPlayerX += currentState.player.speed
    }
    
    // Clamp player to canvas bounds
    newPlayerX = clampToCanvas(
      { x: newPlayerX, width: currentState.player.width },
      GAME_CONFIG.canvas.width
    )
    
    if (newPlayerX !== currentState.player.x) {
      gameStateManager.updateState({
        player: { ...currentState.player, x: newPlayerX }
      })
    }
    
    // Shooting - handle both ' ' and 'Space'
    if ((keyboard.wasJustPressed(' ') || keyboard.wasJustPressed('Space')) && gameStateManager.canShoot()) {
      const bullet = bulletPool.get() as PooledBullet
      if (bullet) {
        bullet.init(
          currentState.player.x + currentState.player.width / 2 - GAME_CONFIG.bullets.width / 2,
          currentState.player.y
        )
        audioManager.playShoot()
      }
    }
  }, [keyboard])
  
  // Update game objects
  const updateGameObjects = useCallback((gameStateManager: GameStateManager) => {
    const currentState = gameStateManager.getState()
    
    // Update bullets
    bulletPool.getActive().forEach(bullet => {
      (bullet as PooledBullet).update()
    })
    
    // Update particles
    particlePool.getActive().forEach(particle => {
      (particle as PooledParticle).update()
    })
    
    // Update enemies
    const { enemies: updatedEnemies } = updateEnemyPositions(currentState.enemies)
    
    // Update enemy animation frame
    const animFrame = Math.floor(Date.now() / GAME_CONFIG.enemies.animationSpeed) % 2
    const enemiesWithAnim = updatedEnemies.map(enemy => ({
      ...enemy,
      animFrame
    }))
    
    gameStateManager.updateState({
      enemies: enemiesWithAnim
    })
  }, [])
  
  // Handle collisions
  const handleCollisions = useCallback((gameStateManager: GameStateManager, audioManager: AudioManager) => {
    const currentState = gameStateManager.getState()
    const activeBullets = bulletPool.getActive()
    
    // Bullet-enemy collisions
    const { hitBullets, hitEnemies, score } = checkBulletEnemyCollisions(
      activeBullets,
      currentState.enemies
    )
    
    // Handle hits
    if (hitBullets.length > 0) {
      // Remove hit bullets
      hitBullets.forEach(bulletIndex => {
        const bullet = activeBullets[bulletIndex] as PooledBullet
        bullet.active = false
      })
      
      // Remove hit enemies and create explosions
      const updatedEnemies = currentState.enemies.map((enemy, index) => {
        if (hitEnemies.includes(index)) {
          // Create explosion particles
          for (let i = 0; i < GAME_CONFIG.particles.count; i++) {
            const particle = particlePool.get() as PooledParticle
            if (particle) {
              particle.init(
                enemy.x + enemy.width / 2,
                enemy.y + enemy.height / 2,
                GAME_CONFIG.enemies.color
              )
            }
          }
          
          audioManager.playExplosion()
          return { ...enemy, active: false }
        }
        return enemy
      })
      
      gameStateManager.updateState({ enemies: updatedEnemies })
      gameStateManager.addScore(score)
    }
    
    // Check if level is complete
    if (isLevelComplete(currentState.enemies)) {
      gameStateManager.nextLevel()
    }
    
    // Enemy-player collision
    if (checkEnemyPlayerCollision(currentState.enemies, currentState.player)) {
      // Create player explosion
      for (let i = 0; i < GAME_CONFIG.particles.count; i++) {
        const particle = particlePool.get() as PooledParticle
        if (particle) {
          particle.init(
            currentState.player.x + currentState.player.width / 2,
            currentState.player.y + currentState.player.height / 2,
            GAME_CONFIG.player.color
          )
        }
      }
      
      audioManager.playGameOver()
      gameStateManager.loseLife()
    }
  }, [])
  
  // Game loop
  const { getFPS } = useGameLoop(
    {
      onUpdate: updateGame,
      onRender: renderGame
    },
    true
  )
  
  // Audio controls
  const toggleMute = useCallback(() => {
    const newMuted = audioManagerRef.current.toggleMute()
    setIsMuted(newMuted)
  }, [])
  
  // Game controls
  const startGame = useCallback(() => {
    gameStateManagerRef.current.startGame()
    bulletPool.releaseAll()
    particlePool.releaseAll()
  }, [])
  
  const pauseGame = useCallback(() => {
    if (gameState.phase === 'playing') {
      gameStateManagerRef.current.pauseGame()
    } else if (gameState.phase === 'paused') {
      gameStateManagerRef.current.resumeGame()
    }
  }, [gameState.phase])
  
  const resetGame = useCallback(() => {
    gameStateManagerRef.current.reset()
    bulletPool.releaseAll()
    particlePool.releaseAll()
    performanceMonitorRef.current.reset()
    keyboard.reset()
  }, [keyboard])
  
  // Cleanup
  useEffect(() => {
    return () => {
      audioManagerRef.current.cleanup()
    }
  }, [])
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      {/* Game Header */}
      <div className="mb-4 text-white text-center">
        <h1 className="text-3xl font-bold mb-2">Space Invaders</h1>
        <div className="flex gap-8 justify-center items-center">
          <div>Score: {gameState.score}</div>
          <div>Lives: {gameState.lives}</div>
          <div>Level: {gameState.level}</div>
          {showDebug && <div>FPS: {gameStats.fps}</div>}
        </div>
      </div>
      
      {/* Game Controls */}
      <div className="mb-4 flex gap-2">
        <Button
          onClick={startGame}
          disabled={gameState.phase === 'playing'}
          size="sm"
          variant="outline"
        >
          Start Game
        </Button>
        
        <Button
          onClick={pauseGame}
          disabled={gameState.phase === 'start' || gameState.phase === 'gameOver'}
          size="sm"
          variant="outline"
        >
          {gameState.phase === 'paused' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>
        
        <Button
          onClick={resetGame}
          size="sm"
          variant="outline"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        
        <Button
          onClick={toggleMute}
          size="sm"
          variant="outline"
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={GAME_CONFIG.canvas.width}
        height={GAME_CONFIG.canvas.height}
        className="border-2 border-white focus:border-blue-400 focus:outline-none"
        style={{ imageRendering: 'pixelated' }}
        role="img"
        aria-label="Space Invaders Game Canvas"
        tabIndex={0}
        onClick={() => canvasRef.current?.focus()}
        onKeyDown={(e) => {
          // Debug keyboard events
          if (showDebug) {
            console.log('Canvas key down:', e.key)
          }
        }}
      />
      
      {/* Game Instructions */}
      <div className="mt-4 text-white text-center">
        <p className="text-sm">Controls: Arrow keys to move, Space to shoot, P or Esc to pause</p>
        <p className="text-sm">Press Enter to {gameState.phase === 'start' ? 'start' : 'restart'}</p>
        {gameState.phase === 'start' && (
          <p className="text-xs text-gray-400 mt-2">Click the game area first, then use keyboard controls</p>
        )}
      </div>
      
      {/* Debug Info */}
      {showDebug && (
        <Card className="mt-4 bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="text-white text-sm space-y-1">
              <div>Phase: {gameState.phase}</div>
              <div>FPS: {gameStats.fps}</div>
              <div>Frame Time: {gameStats.frameTime.toFixed(2)}ms</div>
              <div>Entities: {gameStats.entityCount}</div>
              <div>Particles: {gameStats.particleCount}</div>
              <div>Bullet Pool: {bulletPool.getStats().activeSize}/{bulletPool.getStats().totalSize}</div>
              <div>Particle Pool: {particlePool.getStats().activeSize}/{particlePool.getStats().totalSize}</div>
              <div>Pressed Keys: {keyboard.getPressed().join(', ')}</div>
              <div className="text-xs text-gray-400 mt-2">
                Click the game canvas and try pressing Enter, P, or Escape
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Main exported component with error boundary
export default function SpaceInvaders(props: GameProps) {
  return (
    <ErrorBoundary>
      <SpaceInvadersGame {...props} />
    </ErrorBoundary>
  )
}
