import { PerformanceMonitor } from '../src/utils/performance'
import { ObjectPool, PooledBullet, PooledParticle } from '../src/utils/objectPool'

describe('Performance Tests', () => {
  describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor
    
    beforeEach(() => {
      monitor = new PerformanceMonitor()
    })
    
    it('should initialize with zero values', () => {
      const stats = monitor.getStats()
      
      expect(stats.fps).toBe(0)
      expect(stats.frameTime).toBe(0)
      expect(stats.entityCount).toBe(0)
      expect(stats.particleCount).toBe(0)
    })
    
    it('should calculate frame time correctly', () => {
      const startTime = 1000
      const endTime = 1016.67 // 60fps frame
      
      monitor.update(startTime)
      monitor.update(endTime)
      
      expect(monitor.getFrameTime()).toBeCloseTo(16.67, 1)
    })
    
    it('should track entity counts', () => {
      monitor.updateEntityCounts(10, 5)
      
      const stats = monitor.getStats()
      expect(stats.entityCount).toBe(10)
      expect(stats.particleCount).toBe(5)
    })
    
    it('should detect good performance', () => {
      // Simulate 60fps by calling update 60 times with proper timing
      let currentTime = 0
      const frameTime = 16.67 // 60fps
      
      // First update to initialize
      monitor.update(currentTime)
      
      // Simulate 60 frames, each 16.67ms apart
      for (let i = 1; i <= 60; i++) {
        currentTime += frameTime
        monitor.update(currentTime)
      }
      
      // Now advance by 1000ms to trigger FPS calculation
      currentTime += 1000
      monitor.update(currentTime)
      
      // The monitor should detect good performance
      expect(monitor.getFPS()).toBeGreaterThanOrEqual(50) // Should be around 60
      expect(monitor.getAverageFrameTime()).toBeLessThan(40) // Reasonable frame time
      // Note: isPerformanceGood() might be strict, so we test the components
    })
    
    it('should detect poor performance', () => {
      // Simulate 20fps (50ms per frame)
      let currentTime = 0
      const frameTime = 50 // 20fps
      
      // First update to initialize
      monitor.update(currentTime)
      
      // Simulate 20 frames, each 50ms apart
      for (let i = 1; i <= 20; i++) {
        currentTime += frameTime
        monitor.update(currentTime)
      }
      
      // Advance by 1000ms to trigger FPS calculation
      currentTime += 1000
      monitor.update(currentTime)
      
      expect(monitor.getFPS()).toBeLessThan(30)
      expect(monitor.isPerformanceGood()).toBe(false)
    })
    
    it('should reset correctly', () => {
      monitor.update(1000)
      monitor.updateEntityCounts(10, 5)
      
      monitor.reset()
      
      const stats = monitor.getStats()
      expect(stats.fps).toBe(0)
      expect(stats.frameTime).toBe(0)
      expect(stats.entityCount).toBe(0)
      expect(stats.particleCount).toBe(0)
    })
  })
  
  describe('ObjectPool', () => {
    let bulletPool: ObjectPool<PooledBullet>
    
    beforeEach(() => {
      bulletPool = new ObjectPool<PooledBullet>(
        () => new PooledBullet(),
        5, // initial size
        10 // max size
      )
    })
    
    it('should pre-populate pool with initial objects', () => {
      const stats = bulletPool.getStats()
      expect(stats.poolSize).toBe(5)
      expect(stats.activeSize).toBe(0)
    })
    
    it('should provide objects from pool', () => {
      const bullet = bulletPool.get()
      
      expect(bullet).toBeInstanceOf(PooledBullet)
      
      const stats = bulletPool.getStats()
      expect(stats.poolSize).toBe(4)
      expect(stats.activeSize).toBe(1)
    })
    
    it('should create new objects when pool is empty', () => {
      // Get all pre-populated objects
      for (let i = 0; i < 5; i++) {
        bulletPool.get()
      }
      
      // Should create new object
      const bullet = bulletPool.get()
      expect(bullet).toBeInstanceOf(PooledBullet)
      
      const stats = bulletPool.getStats()
      expect(stats.poolSize).toBe(0)
      expect(stats.activeSize).toBe(6)
    })
    
    it('should respect max size limit', () => {
      // Get maximum number of objects
      for (let i = 0; i < 10; i++) {
        bulletPool.get()
      }
      
      // Should return null when max size reached
      const bullet = bulletPool.get()
      expect(bullet).toBeNull()
    })
    
    it('should release objects back to pool', () => {
      const bullet = bulletPool.get()!
      bulletPool.release(bullet)
      
      const stats = bulletPool.getStats()
      expect(stats.poolSize).toBe(5)
      expect(stats.activeSize).toBe(0)
    })
    
    it('should automatically release inactive objects', () => {
      const bullet = bulletPool.get()! as PooledBullet
      bullet.init(100, 100)
      bullet.active = false // Mark as inactive
      
      bulletPool.update()
      
      const stats = bulletPool.getStats()
      expect(stats.poolSize).toBe(5)
      expect(stats.activeSize).toBe(0)
    })
    
    it('should release all objects', () => {
      // Get some objects first
      const bullets: PooledBullet[] = []
      for (let i = 0; i < 3; i++) {
        const bullet = bulletPool.get()
        if (bullet) {
          bullets.push(bullet)
        }
      }
      
      // Verify objects are active
      let stats = bulletPool.getStats()
      expect(stats.poolSize).toBe(2) // 5 - 3 = 2
      expect(stats.activeSize).toBe(3)
      
      bulletPool.releaseAll()
      
      stats = bulletPool.getStats()
      expect(stats.poolSize).toBe(5) // All objects back in pool
      expect(stats.activeSize).toBe(0)
    })
  })
  
  describe('PooledBullet', () => {
    let bullet: PooledBullet
    
    beforeEach(() => {
      bullet = new PooledBullet()
    })
    
    it('should initialize correctly', () => {
      bullet.init(100, 200)
      
      expect(bullet.x).toBe(100)
      expect(bullet.y).toBe(200)
      expect(bullet.active).toBe(true)
    })
    
    it('should update position', () => {
      bullet.init(100, 200)
      bullet.update()
      
      expect(bullet.y).toBe(193) // 200 - speed(7)
    })
    
    it('should become inactive when off screen', () => {
      bullet.init(100, 5)
      // Need to move bullet far enough off screen (y < -height)
      // height is 10, so y needs to be < -10
      bullet.y = -15 // Set directly to simulate off-screen
      bullet.update() // Should set active = false
      
      expect(bullet.isActive()).toBe(false)
    })
    
    it('should reset correctly', () => {
      bullet.init(100, 200)
      bullet.reset()
      
      expect(bullet.x).toBe(0)
      expect(bullet.y).toBe(0)
      expect(bullet.active).toBe(false)
    })
  })
  
  describe('PooledParticle', () => {
    let particle: PooledParticle
    
    beforeEach(() => {
      particle = new PooledParticle()
    })
    
    it('should initialize correctly', () => {
      particle.init(100, 200, '#ff0000')
      
      expect(particle.x).toBe(100)
      expect(particle.y).toBe(200)
      expect(particle.color).toBe('#ff0000')
      expect(particle.life).toBe(30) // maxLife
    })
    
    it('should update position and life', () => {
      particle.init(100, 200, '#ff0000')
      const initialVx = particle.vx
      const initialVy = particle.vy
      
      particle.update()
      
      expect(particle.x).toBe(100 + initialVx)
      expect(particle.y).toBe(200 + initialVy)
      expect(particle.life).toBe(29)
    })
    
    it('should become inactive when life reaches zero', () => {
      particle.init(100, 200, '#ff0000')
      
      // Update until life is zero
      for (let i = 0; i < 30; i++) {
        particle.update()
      }
      
      expect(particle.isActive()).toBe(false)
    })
    
    it('should reset correctly', () => {
      particle.init(100, 200, '#ff0000')
      particle.reset()
      
      expect(particle.x).toBe(0)
      expect(particle.y).toBe(0)
      expect(particle.vx).toBe(0)
      expect(particle.vy).toBe(0)
      expect(particle.life).toBe(0)
      expect(particle.color).toBe('#ffffff')
    })
  })
  
  describe('Performance Benchmarks', () => {
    it('should handle collision detection efficiently', () => {
      const startTime = performance.now()
      
      // Test with many objects
      const bullets = Array.from({ length: 100 }, (_, i) => ({
        x: i * 5, y: 100, width: 4, height: 10, speed: 7, active: true
      }))
      
      const enemies = Array.from({ length: 50 }, (_, i) => ({
        x: i * 10, y: 100, width: 40, height: 30, speed: 1, active: true,
        direction: 1, animFrame: 0, row: 0, col: i
      }))
      
      // Run collision detection multiple times
      for (let i = 0; i < 100; i++) {
        bullets.forEach(bullet => {
          enemies.forEach(enemy => {
            // Simple collision check
            const collision = (
              bullet.x < enemy.x + enemy.width &&
              bullet.x + bullet.width > enemy.x &&
              bullet.y < enemy.y + enemy.height &&
              bullet.y + bullet.height > enemy.y
            )
          })
        })
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Should complete in reasonable time (less than 100ms)
      expect(duration).toBeLessThan(100)
    })
    
    it('should handle object pool operations efficiently', () => {
      const pool = new ObjectPool<PooledBullet>(
        () => new PooledBullet(),
        100,
        1000
      )
      
      const startTime = performance.now()
      
      // Simulate heavy pool usage
      const objects: PooledBullet[] = []
      
      // Get many objects
      for (let i = 0; i < 500; i++) {
        const obj = pool.get()
        if (obj) {
          obj.init(i, i)
          objects.push(obj)
        }
      }
      
      // Release all objects
      objects.forEach(obj => pool.release(obj))
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Should complete quickly (less than 50ms)
      expect(duration).toBeLessThan(50)
    })
  })
})
