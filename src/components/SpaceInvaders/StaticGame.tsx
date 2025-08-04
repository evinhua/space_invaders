'use client'

import React, { useRef, useEffect, useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Volume2, VolumeX, Pause, Play, RotateCcw } from 'lucide-react'

// Simplified game for static deployment without complex dependencies
interface Position {
  x: number
  y: number
}

interface Player {
  x: number
  y: number
  width: number
  height: number
  speed: number
}

interface Bullet {
  x: number
  y: number
  width: number
  height: number
  speed: number
  active: boolean
}

interface Enemy {
  x: number
  y: number
  width: number
  height: number
  speed: number
  active: boolean
  direction: number
  animFrame: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600
const PLAYER_WIDTH = 50
const PLAYER_HEIGHT = 30
const PLAYER_SPEED = 5
const BULLET_WIDTH = 4
const BULLET_HEIGHT = 10
const BULLET_SPEED = 7
const ENEMY_WIDTH = 40
const ENEMY_HEIGHT = 30
const ENEMY_SPEED = 1
const ENEMY_ROWS = 5
const ENEMY_COLS = 10

export default function StaticSpaceInvaders() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'gameOver'>('start')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [level, setLevel] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  
  const playerRef = useRef<Player>({
    x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
    y: CANVAS_HEIGHT - PLAYER_HEIGHT - 20,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    speed: PLAYER_SPEED
  })
  
  const bulletsRef = useRef<Bullet[]>([])
  const enemiesRef = useRef<Enemy[]>([])
  const particlesRef = useRef<Particle[]>([])
  const keysRef = useRef<{ [key: string]: boolean }>({})
  const animationRef = useRef<number>(0)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize enemies
  const initEnemies = useCallback(() => {
    const enemies: Enemy[] = []
    for (let row = 0; row < ENEMY_ROWS; row++) {
      for (let col = 0; col < ENEMY_COLS; col++) {
        enemies.push({
          x: col * (ENEMY_WIDTH + 20) + 50,
          y: row * (ENEMY_HEIGHT + 15) + 50,
          width: ENEMY_WIDTH,
          height: ENEMY_HEIGHT,
          speed: ENEMY_SPEED,
          active: true,
          direction: 1,
          animFrame: 0
        })
      }
    }
    enemiesRef.current = enemies
  }, [])

  // Sound effects
  const playSound = useCallback((frequency: number, duration: number, type: OscillatorType = 'square') => {
    if (isMuted) return
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      
      const oscillator = audioContextRef.current.createOscillator()
      const gainNode = audioContextRef.current.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)
      
      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime)
      oscillator.type = type
      
      gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration)
      
      oscillator.start(audioContextRef.current.currentTime)
      oscillator.stop(audioContextRef.current.currentTime + duration)
    } catch (error) {
      console.warn('Audio not supported:', error)
    }
  }, [isMuted])

  const playShootSound = useCallback(() => playSound(800, 0.1, 'square'), [playSound])
  const playExplosionSound = useCallback(() => playSound(150, 0.3, 'sawtooth'), [playSound])
  const playGameOverSound = useCallback(() => playSound(100, 0.5, 'triangle'), [playSound])

  // Create particle explosion
  const createExplosion = useCallback((x: number, y: number, color: string) => {
    for (let i = 0; i < 10; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 30,
        color
      })
    }
  }, [])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true
      
      if (e.key === ' ' && gameState === 'playing') {
        e.preventDefault()
        // Shoot bullet
        const player = playerRef.current
        bulletsRef.current.push({
          x: player.x + player.width / 2 - BULLET_WIDTH / 2,
          y: player.y,
          width: BULLET_WIDTH,
          height: BULLET_HEIGHT,
          speed: BULLET_SPEED,
          active: true
        })
        playShootSound()
      }
      
      if (e.key === 'Enter') {
        e.preventDefault()
        if (gameState === 'start' || gameState === 'gameOver') {
          startGame()
        }
      }
      
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        e.preventDefault()
        if (gameState === 'playing') {
          setGameState('paused')
        } else if (gameState === 'paused') {
          setGameState('playing')
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameState, playShootSound])

  // Start game
  const startGame = useCallback(() => {
    setGameState('playing')
    setScore(0)
    setLives(3)
    setLevel(1)
    bulletsRef.current = []
    particlesRef.current = []
    initEnemies()
    playerRef.current = {
      x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: CANVAS_HEIGHT - PLAYER_HEIGHT - 20,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      speed: PLAYER_SPEED
    }
  }, [initEnemies])

  // Game loop
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas with starfield effect
    ctx.fillStyle = '#000011'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    // Draw stars
    ctx.fillStyle = '#ffffff'
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % CANVAS_WIDTH
      const y = (i * 73 + Date.now() * 0.01) % CANVAS_HEIGHT
      const size = Math.sin(i) * 2 + 1
      ctx.fillRect(x, y, size, size)
    }

    // Update player position
    const player = playerRef.current
    if (keysRef.current['ArrowLeft'] && player.x > 0) {
      player.x -= player.speed
    }
    if (keysRef.current['ArrowRight'] && player.x < CANVAS_WIDTH - player.width) {
      player.x += player.speed
    }

    // Draw player
    ctx.fillStyle = '#00ff00'
    ctx.beginPath()
    ctx.moveTo(player.x + player.width / 2, player.y)
    ctx.lineTo(player.x, player.y + player.height)
    ctx.lineTo(player.x + player.width / 2, player.y + player.height * 0.7)
    ctx.lineTo(player.x + player.width, player.y + player.height)
    ctx.closePath()
    ctx.fill()
    
    // Player engine glow
    ctx.fillStyle = '#004400'
    ctx.fillRect(player.x + player.width * 0.3, player.y + player.height, player.width * 0.4, 5)

    // Update and draw bullets
    bulletsRef.current = bulletsRef.current.filter(bullet => bullet.active)
    bulletsRef.current.forEach(bullet => {
      bullet.y -= bullet.speed
      if (bullet.y < 0) {
        bullet.active = false
      }
      
      // Draw bullet with glow effect
      ctx.fillStyle = '#ffff88'
      ctx.fillRect(bullet.x - 1, bullet.y - 1, bullet.width + 2, bullet.height + 2)
      ctx.fillStyle = '#ffff00'
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
    })

    // Update and draw enemies
    let shouldMoveDown = false
    let animFrame = Math.floor(Date.now() / 500) % 2
    
    enemiesRef.current.forEach(enemy => {
      if (!enemy.active) return
      
      enemy.x += enemy.speed * enemy.direction
      enemy.animFrame = animFrame
      
      if (enemy.x <= 0 || enemy.x >= CANVAS_WIDTH - enemy.width) {
        shouldMoveDown = true
      }
    })

    if (shouldMoveDown) {
      enemiesRef.current.forEach(enemy => {
        enemy.direction *= -1
        enemy.y += 20
      })
    }

    enemiesRef.current.forEach(enemy => {
      if (!enemy.active) return
      
      // Draw enemy with animation
      ctx.fillStyle = '#ff0000'
      const frameOffset = enemy.animFrame * 5
      
      // Main body
      ctx.fillRect(enemy.x + 5, enemy.y + 5, enemy.width - 10, enemy.height - 10)
      
      // Animated legs
      ctx.fillRect(enemy.x, enemy.y + enemy.height - 5 + frameOffset, 5, 5)
      ctx.fillRect(enemy.x + enemy.width - 5, enemy.y + enemy.height - 5 - frameOffset, 5, 5)
      
      // Eyes
      ctx.fillStyle = '#ffff00'
      ctx.fillRect(enemy.x + 8, enemy.y + 8, 4, 4)
      ctx.fillRect(enemy.x + enemy.width - 12, enemy.y + 8, 4, 4)
    })

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter(particle => particle.life > 0)
    particlesRef.current.forEach(particle => {
      particle.x += particle.vx
      particle.y += particle.vy
      particle.life--
      
      ctx.fillStyle = particle.color
      ctx.globalAlpha = particle.life / 30
      ctx.fillRect(particle.x, particle.y, 3, 3)
      ctx.globalAlpha = 1
    })

    // Check collisions
    bulletsRef.current.forEach(bullet => {
      enemiesRef.current.forEach(enemy => {
        if (bullet.active && enemy.active &&
            bullet.x < enemy.x + enemy.width &&
            bullet.x + bullet.width > enemy.x &&
            bullet.y < enemy.y + enemy.height &&
            bullet.y + bullet.height > enemy.y) {
          bullet.active = false
          enemy.active = false
          setScore(prev => prev + 10)
          createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff0000')
          playExplosionSound()
        }
      })
    })

    // Check if all enemies are destroyed
    const activeEnemies = enemiesRef.current.filter(enemy => enemy.active)
    if (activeEnemies.length === 0) {
      setLevel(prev => prev + 1)
      initEnemies()
    }

    // Check if enemies reached the player
    enemiesRef.current.forEach(enemy => {
      if (enemy.active && enemy.y + enemy.height >= player.y) {
        setLives(prev => prev - 1)
        createExplosion(player.x + player.width / 2, player.y + player.height / 2, '#00ff00')
        if (lives <= 1) {
          setGameState('gameOver')
          playGameOverSound()
        } else {
          initEnemies()
        }
      }
    })

    animationRef.current = requestAnimationFrame(gameLoop)
  }, [gameState, lives, initEnemies, createExplosion, playExplosionSound, playGameOverSound])

  // Start game loop when playing
  useEffect(() => {
    if (gameState === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop)
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState, gameLoop])

  // Draw screens
  const drawScreen = useCallback((type: 'start' | 'paused' | 'gameOver') => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Animated background
    ctx.fillStyle = '#000011'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    // Draw stars
    ctx.fillStyle = '#ffffff'
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % CANVAS_WIDTH
      const y = (i * 73 + Date.now() * 0.01) % CANVAS_HEIGHT
      const size = Math.sin(i) * 2 + 1
      ctx.fillRect(x, y, size, size)
    }

    ctx.textAlign = 'center'
    
    if (type === 'start') {
      // Title
      ctx.fillStyle = '#ff0000'
      ctx.font = 'bold 48px Arial'
      ctx.shadowColor = '#ff0000'
      ctx.shadowBlur = 20
      ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50)
      
      ctx.shadowBlur = 0
      ctx.fillStyle = '#ffffff'
      ctx.font = '24px Arial'
      ctx.fillText('Press ENTER to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20)
      ctx.font = '18px Arial'
      ctx.fillText('Arrow Keys: Move | Space: Shoot | P: Pause', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60)
    } else if (type === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 48px Arial'
      ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
      ctx.font = '24px Arial'
      ctx.fillText('Press P to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50)
    } else if (type === 'gameOver') {
      ctx.fillStyle = '#ff0000'
      ctx.font = 'bold 48px Arial'
      ctx.shadowColor = '#ff0000'
      ctx.shadowBlur = 20
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50)

      ctx.shadowBlur = 0
      ctx.fillStyle = '#ffffff'
      ctx.font = '24px Arial'
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20)
      ctx.fillText('Press ENTER to Play Again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60)
    }
  }, [score])

  // Draw appropriate screen
  useEffect(() => {
    let animationId: number
    
    const animate = () => {
      if (gameState === 'start') {
        drawScreen('start')
      } else if (gameState === 'paused') {
        drawScreen('paused')
      } else if (gameState === 'gameOver') {
        drawScreen('gameOver')
      }
      
      if (gameState !== 'playing') {
        animationId = requestAnimationFrame(animate)
      }
    }
    
    if (gameState !== 'playing') {
      animationId = requestAnimationFrame(animate)
    }
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [gameState, drawScreen])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-white mb-2">🚀 Space Invaders</h1>
        <p className="text-gray-300">Enhanced version with modern web technologies</p>
      </div>

      {/* Game Stats */}
      <div className="mb-4 text-white text-center">
        <div className="flex gap-8 justify-center items-center">
          <div>Score: <span className="text-yellow-400 font-bold">{score}</span></div>
          <div>Lives: <span className="text-red-400 font-bold">{lives}</span></div>
          <div>Level: <span className="text-blue-400 font-bold">{level}</span></div>
        </div>
      </div>
      
      {/* Game Controls */}
      <div className="mb-4 flex gap-2">
        <Button
          onClick={startGame}
          disabled={gameState === 'playing'}
          size="sm"
          variant="outline"
          className="border-white text-white hover:bg-white hover:text-black"
        >
          {gameState === 'start' ? 'Start Game' : 'Restart'}
        </Button>
        
        <Button
          onClick={() => {
            if (gameState === 'playing') {
              setGameState('paused')
            } else if (gameState === 'paused') {
              setGameState('playing')
            }
          }}
          disabled={gameState === 'start' || gameState === 'gameOver'}
          size="sm"
          variant="outline"
          className="border-white text-white hover:bg-white hover:text-black"
        >
          {gameState === 'paused' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>
        
        <Button
          onClick={() => setIsMuted(!isMuted)}
          size="sm"
          variant="outline"
          className="border-white text-white hover:bg-white hover:text-black"
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-white focus:border-blue-400 focus:outline-none"
        style={{ imageRendering: 'pixelated' }}
        tabIndex={0}
        onClick={() => canvasRef.current?.focus()}
      />
      
      {/* Instructions */}
      <div className="mt-4 text-white text-center">
        <p className="text-sm">Controls: Arrow keys to move, Space to shoot, P or Esc to pause</p>
        <p className="text-sm">Press Enter to {gameState === 'start' ? 'start' : 'restart'}</p>
        <p className="text-xs text-gray-400 mt-2">Click the game area first, then use keyboard controls</p>
      </div>

      {/* GitHub Link */}
      <div className="mt-6 text-center">
        <a 
          href="https://github.com/evinhua/space_invaders" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline"
        >
          View Source Code on GitHub
        </a>
      </div>
    </div>
  )
}
