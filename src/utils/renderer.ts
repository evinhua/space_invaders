import { Player, Enemy, Bullet, Particle, GameState } from '@/types/game'
import { GAME_CONFIG } from '@/config/gameConfig'

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D
  private canvas: HTMLCanvasElement
  private dirtyRects: Array<{ x: number; y: number; width: number; height: number }> = []
  private lastStarOffset = 0
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Could not get 2D context from canvas')
    }
    this.ctx = context
    
    // Set canvas properties for crisp pixel art
    this.ctx.imageSmoothingEnabled = false
    canvas.style.imageRendering = 'pixelated'
  }
  
  clear(): void {
    this.ctx.fillStyle = GAME_CONFIG.canvas.backgroundColor
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    this.dirtyRects = []
  }
  
  addDirtyRect(x: number, y: number, width: number, height: number): void {
    this.dirtyRects.push({ x, y, width, height })
  }
  
  clearDirtyRects(): void {
    this.dirtyRects.forEach(rect => {
      this.ctx.clearRect(rect.x - 2, rect.y - 2, rect.width + 4, rect.height + 4)
    })
  }
  
  drawBackground(): void {
    // Animated starfield
    this.ctx.fillStyle = '#ffffff'
    const starCount = GAME_CONFIG.canvas.starCount
    const currentTime = Date.now()
    
    for (let i = 0; i < starCount; i++) {
      const x = (i * 37) % this.canvas.width
      const y = (i * 73 + currentTime * 0.01) % this.canvas.height
      const size = Math.sin(i) * 2 + 1
      
      this.ctx.fillRect(x, y, size, size)
    }
  }
  
  drawPlayer(player: Player): void {
    if (!player.active) return
    
    const config = GAME_CONFIG.player
    
    // Draw player ship with better graphics
    this.ctx.fillStyle = config.color
    this.ctx.beginPath()
    this.ctx.moveTo(player.x + player.width / 2, player.y)
    this.ctx.lineTo(player.x, player.y + player.height)
    this.ctx.lineTo(player.x + player.width / 2, player.y + player.height * 0.7)
    this.ctx.lineTo(player.x + player.width, player.y + player.height)
    this.ctx.closePath()
    this.ctx.fill()
    
    // Player engine glow
    this.ctx.fillStyle = config.engineColor
    this.ctx.fillRect(
      player.x + player.width * 0.3,
      player.y + player.height,
      player.width * 0.4,
      5
    )
    
    this.addDirtyRect(player.x, player.y, player.width, player.height + 5)
  }
  
  drawBullets(bullets: Bullet[]): void {
    const config = GAME_CONFIG.bullets
    
    bullets.forEach(bullet => {
      if (!bullet.active) return
      
      // Draw bullet with glow effect
      this.ctx.fillStyle = config.glowColor
      this.ctx.fillRect(bullet.x - 1, bullet.y - 1, bullet.width + 2, bullet.height + 2)
      
      this.ctx.fillStyle = config.color
      this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
      
      this.addDirtyRect(bullet.x - 1, bullet.y - 1, bullet.width + 2, bullet.height + 2)
    })
  }
  
  drawEnemies(enemies: Enemy[]): void {
    const config = GAME_CONFIG.enemies
    const animFrame = Math.floor(Date.now() / config.animationSpeed) % 2
    
    enemies.forEach(enemy => {
      if (!enemy.active) return
      
      // Draw enemy with animation
      this.ctx.fillStyle = config.color
      const frameOffset = animFrame * 5
      
      // Main body
      this.ctx.fillRect(enemy.x + 5, enemy.y + 5, enemy.width - 10, enemy.height - 10)
      
      // Animated legs
      this.ctx.fillRect(enemy.x, enemy.y + enemy.height - 5 + frameOffset, 5, 5)
      this.ctx.fillRect(enemy.x + enemy.width - 5, enemy.y + enemy.height - 5 - frameOffset, 5, 5)
      
      // Eyes
      this.ctx.fillStyle = config.eyeColor
      this.ctx.fillRect(enemy.x + 8, enemy.y + 8, 4, 4)
      this.ctx.fillRect(enemy.x + enemy.width - 12, enemy.y + 8, 4, 4)
      
      this.addDirtyRect(enemy.x, enemy.y, enemy.width, enemy.height)
    })
  }
  
  drawParticles(particles: Particle[]): void {
    particles.forEach(particle => {
      if (particle.life <= 0) return
      
      this.ctx.fillStyle = particle.color
      this.ctx.globalAlpha = particle.life / particle.maxLife
      this.ctx.fillRect(particle.x, particle.y, 3, 3)
      this.ctx.globalAlpha = 1
      
      this.addDirtyRect(particle.x, particle.y, 3, 3)
    })
  }
  
  drawUI(gameState: GameState): void {
    const { score, lives, fps } = gameState
    
    // Score and lives
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = '20px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`Score: ${score}`, 10, 30)
    this.ctx.fillText(`Lives: ${lives}`, 10, 60)
    
    // FPS counter (debug)
    if (process.env.NODE_ENV === 'development') {
      this.ctx.fillText(`FPS: ${fps}`, 10, 90)
    }
  }
  
  drawStartScreen(): void {
    this.clear()
    this.drawBackground()
    
    const centerX = this.canvas.width / 2
    const centerY = this.canvas.height / 2
    
    // Title with glow effect
    this.ctx.fillStyle = GAME_CONFIG.ui.titleGlow
    this.ctx.font = `bold ${GAME_CONFIG.ui.titleSize} Arial`
    this.ctx.textAlign = 'center'
    this.ctx.shadowColor = GAME_CONFIG.ui.titleGlow
    this.ctx.shadowBlur = 20
    this.ctx.fillText('SPACE INVADERS', centerX, centerY - 50)
    
    this.ctx.shadowBlur = 0
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = GAME_CONFIG.ui.textSize + ' Arial'
    this.ctx.fillText('Press ENTER to Start', centerX, centerY + 20)
    
    this.ctx.font = GAME_CONFIG.ui.smallTextSize + ' Arial'
    this.ctx.fillText('Use Arrow Keys to Move', centerX, centerY + 60)
    this.ctx.fillText('Press SPACE to Shoot', centerX, centerY + 90)
    this.ctx.fillText('Press P to Pause', centerX, centerY + 120)
    
    // Draw sample invader
    this.drawSampleEnemy(centerX - 20, centerY + 150)
  }
  
  drawGameOverScreen(score: number): void {
    this.clear()
    this.drawBackground()
    
    const centerX = this.canvas.width / 2
    const centerY = this.canvas.height / 2
    
    // Game over text with glow effect
    this.ctx.fillStyle = GAME_CONFIG.ui.titleGlow
    this.ctx.font = `bold ${GAME_CONFIG.ui.titleSize} Arial`
    this.ctx.textAlign = 'center'
    this.ctx.shadowColor = GAME_CONFIG.ui.titleGlow
    this.ctx.shadowBlur = 20
    this.ctx.fillText('GAME OVER', centerX, centerY - 50)
    
    this.ctx.shadowBlur = 0
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = GAME_CONFIG.ui.textSize + ' Arial'
    this.ctx.fillText(`Final Score: ${score}`, centerX, centerY + 20)
    this.ctx.fillText('Press ENTER to Play Again', centerX, centerY + 60)
  }
  
  drawPauseScreen(): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    const centerX = this.canvas.width / 2
    const centerY = this.canvas.height / 2
    
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = `bold ${GAME_CONFIG.ui.titleSize} Arial`
    this.ctx.textAlign = 'center'
    this.ctx.fillText('PAUSED', centerX, centerY)
    
    this.ctx.font = GAME_CONFIG.ui.textSize + ' Arial'
    this.ctx.fillText('Press P to Resume', centerX, centerY + 50)
  }
  
  private drawSampleEnemy(x: number, y: number): void {
    const config = GAME_CONFIG.enemies
    
    this.ctx.fillStyle = config.color
    this.ctx.fillRect(x + 5, y + 5, 30, 20)
    this.ctx.fillRect(x, y, 5, 5)
    this.ctx.fillRect(x + 35, y, 5, 5)
    
    this.ctx.fillStyle = config.eyeColor
    this.ctx.fillRect(x + 8, y + 8, 4, 4)
    this.ctx.fillRect(x + 28, y + 8, 4, 4)
  }
  
  // Performance optimization methods
  setImageSmoothing(enabled: boolean): void {
    this.ctx.imageSmoothingEnabled = enabled
  }
  
  save(): void {
    this.ctx.save()
  }
  
  restore(): void {
    this.ctx.restore()
  }
  
  // Debug methods
  drawDebugInfo(gameState: GameState): void {
    if (process.env.NODE_ENV !== 'development') return
    
    const debugInfo = [
      `Phase: ${gameState.phase}`,
      `Enemies: ${gameState.enemies.filter(e => e.active).length}`,
      `Bullets: ${gameState.bullets.filter(b => b.active).length}`,
      `Particles: ${gameState.particles.filter(p => p.life > 0).length}`,
      `Dirty Rects: ${this.dirtyRects.length}`
    ]
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(this.canvas.width - 200, 10, 190, debugInfo.length * 20 + 10)
    
    this.ctx.fillStyle = '#00ff00'
    this.ctx.font = '12px monospace'
    this.ctx.textAlign = 'left'
    
    debugInfo.forEach((info, index) => {
      this.ctx.fillText(info, this.canvas.width - 190, 30 + index * 20)
    })
  }
  
  drawCollisionBoxes(gameState: GameState): void {
    if (process.env.NODE_ENV !== 'development') return
    
    this.ctx.strokeStyle = '#ff0000'
    this.ctx.lineWidth = 1
    
    // Player collision box
    if (gameState.player.active) {
      this.ctx.strokeRect(
        gameState.player.x,
        gameState.player.y,
        gameState.player.width,
        gameState.player.height
      )
    }
    
    // Enemy collision boxes
    gameState.enemies.forEach(enemy => {
      if (enemy.active) {
        this.ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height)
      }
    })
    
    // Bullet collision boxes
    gameState.bullets.forEach(bullet => {
      if (bullet.active) {
        this.ctx.strokeRect(bullet.x, bullet.y, bullet.width, bullet.height)
      }
    })
  }
}
