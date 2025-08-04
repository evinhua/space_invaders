import { Bullet, Particle, Enemy } from '@/types/game'
import { GAME_CONFIG } from '@/config/gameConfig'

export interface Poolable {
  reset(): void
  isActive(): boolean
}

export class ObjectPool<T extends Poolable> {
  private pool: T[] = []
  private active: T[] = []
  private createFn: () => T
  private maxSize: number
  
  constructor(createFn: () => T, initialSize: number = 10, maxSize: number = 100) {
    this.createFn = createFn
    this.maxSize = maxSize
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn())
    }
  }
  
  get(): T | null {
    let obj = this.pool.pop()
    
    if (!obj && this.active.length + this.pool.length < this.maxSize) {
      obj = this.createFn()
    }
    
    if (obj) {
      this.active.push(obj)
      return obj
    }
    
    return null
  }
  
  release(obj: T): void {
    const index = this.active.indexOf(obj)
    if (index > -1) {
      this.active.splice(index, 1)
      obj.reset()
      this.pool.push(obj)
    }
  }
  
  releaseAll(): void {
    this.active.forEach(obj => {
      obj.reset()
      this.pool.push(obj)
    })
    this.active = []
  }
  
  getActive(): T[] {
    return this.active.filter(obj => obj.isActive())
  }
  
  update(): void {
    // Remove inactive objects and return them to pool
    for (let i = this.active.length - 1; i >= 0; i--) {
      const obj = this.active[i]
      if (!obj.isActive()) {
        this.active.splice(i, 1)
        obj.reset()
        this.pool.push(obj)
      }
    }
  }
  
  getStats() {
    return {
      poolSize: this.pool.length,
      activeSize: this.active.length,
      totalSize: this.pool.length + this.active.length
    }
  }
}

// Poolable implementations
export class PooledBullet implements Bullet, Poolable {
  x = 0
  y = 0
  width = GAME_CONFIG.bullets.width
  height = GAME_CONFIG.bullets.height
  speed = GAME_CONFIG.bullets.speed
  active = false
  
  init(x: number, y: number): void {
    this.x = x
    this.y = y
    this.active = true
  }
  
  reset(): void {
    this.x = 0
    this.y = 0
    this.active = false
  }
  
  isActive(): boolean {
    return this.active && this.y > -this.height
  }
  
  update(): void {
    if (this.active) {
      this.y -= this.speed
      if (this.y < -this.height) {
        this.active = false
      }
    }
  }
}

export class PooledParticle implements Particle, Poolable {
  x = 0
  y = 0
  vx = 0
  vy = 0
  life = 0
  maxLife = GAME_CONFIG.particles.maxLife
  color = '#ffffff'
  
  init(x: number, y: number, color: string): void {
    this.x = x
    this.y = y
    this.vx = (Math.random() - 0.5) * GAME_CONFIG.particles.speedRange
    this.vy = (Math.random() - 0.5) * GAME_CONFIG.particles.speedRange
    this.life = this.maxLife
    this.color = color
  }
  
  reset(): void {
    this.x = 0
    this.y = 0
    this.vx = 0
    this.vy = 0
    this.life = 0
    this.color = '#ffffff'
  }
  
  isActive(): boolean {
    return this.life > 0
  }
  
  update(): void {
    if (this.life > 0) {
      this.x += this.vx
      this.y += this.vy
      this.life--
    }
  }
}

// Pool instances
export const bulletPool = new ObjectPool<PooledBullet>(
  () => new PooledBullet(),
  20,
  50
)

export const particlePool = new ObjectPool<PooledParticle>(
  () => new PooledParticle(),
  50,
  200
)
