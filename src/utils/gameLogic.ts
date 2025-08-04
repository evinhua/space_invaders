import { CollisionBox, Enemy, Player, Bullet, Particle } from '@/types/game'
import { GAME_CONFIG } from '@/config/gameConfig'

export function checkCollision(obj1: CollisionBox, obj2: CollisionBox): boolean {
  return (
    obj1.x < obj2.x + obj2.width &&
    obj1.x + obj1.width > obj2.x &&
    obj1.y < obj2.y + obj2.height &&
    obj1.y + obj1.height > obj2.y
  )
}

export function isOutOfBounds(obj: CollisionBox, canvasWidth: number, canvasHeight: number): boolean {
  return (
    obj.x + obj.width < 0 ||
    obj.x > canvasWidth ||
    obj.y + obj.height < 0 ||
    obj.y > canvasHeight
  )
}

export function clampToCanvas(obj: { x: number; width: number }, canvasWidth: number): number {
  return Math.max(0, Math.min(obj.x, canvasWidth - obj.width))
}

export function createEnemyGrid(): Enemy[] {
  const enemies: Enemy[] = []
  const config = GAME_CONFIG.enemies
  
  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.cols; col++) {
      enemies.push({
        x: col * (config.width + config.spacing.horizontal) + config.startPosition.x,
        y: row * (config.height + config.spacing.vertical) + config.startPosition.y,
        width: config.width,
        height: config.height,
        speed: config.speed,
        active: true,
        direction: 1,
        animFrame: 0,
        row,
        col
      })
    }
  }
  
  return enemies
}

export function updateEnemyPositions(enemies: Enemy[]): { shouldMoveDown: boolean; enemies: Enemy[] } {
  let shouldMoveDown = false
  const canvasWidth = GAME_CONFIG.canvas.width
  
  // Check if any enemy hits the boundary
  enemies.forEach(enemy => {
    if (!enemy.active) return
    
    const newX = enemy.x + enemy.speed * enemy.direction
    if (newX <= 0 || newX >= canvasWidth - enemy.width) {
      shouldMoveDown = true
    }
  })
  
  // Update positions
  const updatedEnemies = enemies.map(enemy => {
    if (!enemy.active) return enemy
    
    if (shouldMoveDown) {
      return {
        ...enemy,
        direction: enemy.direction * -1,
        y: enemy.y + GAME_CONFIG.enemies.dropDistance
      }
    } else {
      return {
        ...enemy,
        x: enemy.x + enemy.speed * enemy.direction
      }
    }
  })
  
  return { shouldMoveDown, enemies: updatedEnemies }
}

export function updateBullets(bullets: Bullet[]): Bullet[] {
  return bullets
    .map(bullet => ({
      ...bullet,
      y: bullet.y - bullet.speed
    }))
    .filter(bullet => bullet.y > -bullet.height)
}

export function updateParticles(particles: Particle[]): Particle[] {
  return particles
    .map(particle => ({
      ...particle,
      x: particle.x + particle.vx,
      y: particle.y + particle.vy,
      life: particle.life - 1
    }))
    .filter(particle => particle.life > 0)
}

export function getActiveEnemies(enemies: Enemy[]): Enemy[] {
  return enemies.filter(enemy => enemy.active)
}

export function checkBulletEnemyCollisions(bullets: Bullet[], enemies: Enemy[]): {
  hitBullets: number[]
  hitEnemies: number[]
  score: number
} {
  const hitBullets: number[] = []
  const hitEnemies: number[] = []
  let score = 0
  
  bullets.forEach((bullet, bulletIndex) => {
    if (!bullet.active) return
    
    enemies.forEach((enemy, enemyIndex) => {
      if (!enemy.active) return
      
      if (checkCollision(bullet, enemy)) {
        hitBullets.push(bulletIndex)
        hitEnemies.push(enemyIndex)
        score += GAME_CONFIG.game.pointsPerEnemy
      }
    })
  })
  
  return { hitBullets, hitEnemies, score }
}

export function checkEnemyPlayerCollision(enemies: Enemy[], player: Player): boolean {
  return enemies.some(enemy => 
    enemy.active && enemy.y + enemy.height >= player.y && checkCollision(enemy, player)
  )
}

export function calculateGameStats(enemies: Enemy[], bullets: Bullet[], particles: Particle[]) {
  return {
    activeEnemies: enemies.filter(e => e.active).length,
    activeBullets: bullets.filter(b => b.active).length,
    activeParticles: particles.filter(p => p.life > 0).length,
    totalEntities: enemies.length + bullets.length + particles.length
  }
}

export function isLevelComplete(enemies: Enemy[]): boolean {
  return enemies.every(enemy => !enemy.active)
}

export function validateInput(key: string): boolean {
  const allowedKeys = new Set([
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    ' ', 'Enter', 'Escape', 'p', 'P',
    'Pause', 'Space'
  ])
  return allowedKeys.has(key)
}
