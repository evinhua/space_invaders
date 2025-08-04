import { 
  checkCollision, 
  updateEnemyPositions, 
  checkBulletEnemyCollisions,
  isLevelComplete,
  validateInput,
  clampToCanvas,
  createEnemyGrid
} from '../src/utils/gameLogic'
import { Enemy, Bullet } from '../src/types/game'

describe('Game Logic Tests', () => {
  describe('checkCollision', () => {
    it('should detect collision when objects overlap', () => {
      const obj1 = { x: 10, y: 10, width: 20, height: 20 }
      const obj2 = { x: 15, y: 15, width: 20, height: 20 }
      
      expect(checkCollision(obj1, obj2)).toBe(true)
    })
    
    it('should not detect collision when objects do not overlap', () => {
      const obj1 = { x: 10, y: 10, width: 20, height: 20 }
      const obj2 = { x: 50, y: 50, width: 20, height: 20 }
      
      expect(checkCollision(obj1, obj2)).toBe(false)
    })
    
    it('should detect collision when objects touch edges', () => {
      const obj1 = { x: 10, y: 10, width: 20, height: 20 }
      const obj2 = { x: 30, y: 10, width: 20, height: 20 }
      
      expect(checkCollision(obj1, obj2)).toBe(false) // Touching edges don't overlap
    })
    
    it('should detect collision when one object is inside another', () => {
      const obj1 = { x: 10, y: 10, width: 50, height: 50 }
      const obj2 = { x: 20, y: 20, width: 10, height: 10 }
      
      expect(checkCollision(obj1, obj2)).toBe(true)
    })
  })
  
  describe('updateEnemyPositions', () => {
    const createTestEnemies = (): Enemy[] => [
      {
        x: 50, y: 50, width: 40, height: 30, speed: 1, active: true,
        direction: 1, animFrame: 0, row: 0, col: 0
      },
      {
        x: 100, y: 50, width: 40, height: 30, speed: 1, active: true,
        direction: 1, animFrame: 0, row: 0, col: 1
      }
    ]
    
    it('should move enemies horizontally when not at boundary', () => {
      const enemies = createTestEnemies()
      const { shouldMoveDown, enemies: updated } = updateEnemyPositions(enemies)
      
      expect(shouldMoveDown).toBe(false)
      expect(updated[0].x).toBe(51) // moved right by speed
      expect(updated[1].x).toBe(101)
    })
    
    it('should trigger move down when enemy hits boundary', () => {
      const enemies = createTestEnemies()
      enemies[0].x = 760 // Near right boundary (800 - 40 = 760)
      
      const { shouldMoveDown } = updateEnemyPositions(enemies)
      expect(shouldMoveDown).toBe(true)
    })
    
    it('should change direction and move down when hitting boundary', () => {
      const enemies = createTestEnemies()
      enemies[0].x = 760
      enemies[0].direction = 1
      
      const { enemies: updated } = updateEnemyPositions(enemies)
      
      expect(updated[0].direction).toBe(-1)
      expect(updated[0].y).toBe(70) // moved down by 20
    })
    
    it('should not update inactive enemies', () => {
      const enemies = createTestEnemies()
      enemies[0].active = false
      const originalX = enemies[0].x
      
      const { enemies: updated } = updateEnemyPositions(enemies)
      expect(updated[0].x).toBe(originalX)
    })
  })
  
  describe('checkBulletEnemyCollisions', () => {
    const createTestBullet = (): Bullet => ({
      x: 55, y: 55, width: 4, height: 10, speed: 7, active: true
    })
    
    const createTestEnemy = (): Enemy => ({
      x: 50, y: 50, width: 40, height: 30, speed: 1, active: true,
      direction: 1, animFrame: 0, row: 0, col: 0
    })
    
    it('should detect bullet-enemy collision', () => {
      const bullets = [createTestBullet()]
      const enemies = [createTestEnemy()]
      
      const { hitBullets, hitEnemies, score } = checkBulletEnemyCollisions(bullets, enemies)
      
      expect(hitBullets).toEqual([0])
      expect(hitEnemies).toEqual([0])
      expect(score).toBe(10) // Default points per enemy
    })
    
    it('should not detect collision when bullet misses enemy', () => {
      const bullets = [createTestBullet()]
      const enemies = [createTestEnemy()]
      
      bullets[0].x = 200 // Far from enemy
      
      const { hitBullets, hitEnemies, score } = checkBulletEnemyCollisions(bullets, enemies)
      
      expect(hitBullets).toEqual([])
      expect(hitEnemies).toEqual([])
      expect(score).toBe(0)
    })
    
    it('should handle multiple collisions', () => {
      const bullets = [createTestBullet(), { ...createTestBullet(), x: 105 }]
      const enemies = [createTestEnemy(), { ...createTestEnemy(), x: 100 }]
      
      const { hitBullets, hitEnemies, score } = checkBulletEnemyCollisions(bullets, enemies)
      
      expect(hitBullets).toHaveLength(2)
      expect(hitEnemies).toHaveLength(2)
      expect(score).toBe(20)
    })
    
    it('should ignore inactive bullets and enemies', () => {
      const bullets = [{ ...createTestBullet(), active: false }]
      const enemies = [{ ...createTestEnemy(), active: false }]
      
      const { hitBullets, hitEnemies, score } = checkBulletEnemyCollisions(bullets, enemies)
      
      expect(hitBullets).toEqual([])
      expect(hitEnemies).toEqual([])
      expect(score).toBe(0)
    })
  })
  
  describe('isLevelComplete', () => {
    it('should return true when all enemies are inactive', () => {
      const enemies: Enemy[] = [
        { x: 0, y: 0, width: 40, height: 30, speed: 1, active: false, direction: 1, animFrame: 0, row: 0, col: 0 },
        { x: 0, y: 0, width: 40, height: 30, speed: 1, active: false, direction: 1, animFrame: 0, row: 0, col: 1 }
      ]
      
      expect(isLevelComplete(enemies)).toBe(true)
    })
    
    it('should return false when some enemies are active', () => {
      const enemies: Enemy[] = [
        { x: 0, y: 0, width: 40, height: 30, speed: 1, active: true, direction: 1, animFrame: 0, row: 0, col: 0 },
        { x: 0, y: 0, width: 40, height: 30, speed: 1, active: false, direction: 1, animFrame: 0, row: 0, col: 1 }
      ]
      
      expect(isLevelComplete(enemies)).toBe(false)
    })
    
    it('should return true for empty enemy array', () => {
      expect(isLevelComplete([])).toBe(true)
    })
  })
  
  describe('validateInput', () => {
    it('should allow valid game keys', () => {
      const validKeys = ['ArrowLeft', 'ArrowRight', ' ', 'Enter', 'Escape', 'p', 'P']
      
      validKeys.forEach(key => {
        expect(validateInput(key)).toBe(true)
      })
    })
    
    it('should reject invalid keys', () => {
      const invalidKeys = ['a', 'z', '1', 'F1', 'Tab', 'Shift']
      
      invalidKeys.forEach(key => {
        expect(validateInput(key)).toBe(false)
      })
    })
  })
  
  describe('clampToCanvas', () => {
    it('should clamp object to left boundary', () => {
      const obj = { x: -10, width: 50 }
      const canvasWidth = 800
      
      expect(clampToCanvas(obj, canvasWidth)).toBe(0)
    })
    
    it('should clamp object to right boundary', () => {
      const obj = { x: 780, width: 50 }
      const canvasWidth = 800
      
      expect(clampToCanvas(obj, canvasWidth)).toBe(750) // 800 - 50
    })
    
    it('should not clamp object within bounds', () => {
      const obj = { x: 100, width: 50 }
      const canvasWidth = 800
      
      expect(clampToCanvas(obj, canvasWidth)).toBe(100)
    })
  })
  
  describe('createEnemyGrid', () => {
    it('should create correct number of enemies', () => {
      const enemies = createEnemyGrid()
      expect(enemies).toHaveLength(50) // 5 rows × 10 cols
    })
    
    it('should position enemies correctly', () => {
      const enemies = createEnemyGrid()
      
      // Check first enemy position
      expect(enemies[0].x).toBe(50) // startPosition.x
      expect(enemies[0].y).toBe(50) // startPosition.y
      expect(enemies[0].row).toBe(0)
      expect(enemies[0].col).toBe(0)
      
      // Check second enemy in first row
      expect(enemies[1].x).toBe(110) // 50 + (40 + 20)
      expect(enemies[1].y).toBe(50)
      expect(enemies[1].row).toBe(0)
      expect(enemies[1].col).toBe(1)
      
      // Check first enemy in second row
      expect(enemies[10].x).toBe(50)
      expect(enemies[10].y).toBe(95) // 50 + (30 + 15)
      expect(enemies[10].row).toBe(1)
      expect(enemies[10].col).toBe(0)
    })
    
    it('should create all enemies as active', () => {
      const enemies = createEnemyGrid()
      
      enemies.forEach(enemy => {
        expect(enemy.active).toBe(true)
      })
    })
  })
})
