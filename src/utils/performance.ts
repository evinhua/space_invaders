import { GameStats } from '@/types/game'

export class PerformanceMonitor {
  private frameCount = 0
  private lastTime = 0
  private fps = 0
  private frameTime = 0
  private frameTimes: number[] = []
  private maxFrameTimeHistory = 60
  
  private entityCount = 0
  private particleCount = 0
  
  update(currentTime: number): void {
    this.frameCount++
    
    // Calculate frame time
    if (this.lastTime > 0) {
      this.frameTime = currentTime - this.lastTime
      this.frameTimes.push(this.frameTime)
      
      if (this.frameTimes.length > this.maxFrameTimeHistory) {
        this.frameTimes.shift()
      }
    }
    
    // Calculate FPS every second
    if (currentTime - this.lastTime >= 1000) {
      this.fps = this.frameCount
      this.frameCount = 0
      
      // Warn about performance issues
      if (this.fps < 30) {
        console.warn(`Low FPS detected: ${this.fps}`)
      }
      
      const avgFrameTime = this.getAverageFrameTime()
      if (avgFrameTime > 33) { // More than 33ms per frame (< 30fps)
        console.warn(`High frame time detected: ${avgFrameTime.toFixed(2)}ms`)
      }
    }
    
    this.lastTime = currentTime
  }
  
  updateEntityCounts(entities: number, particles: number): void {
    this.entityCount = entities
    this.particleCount = particles
  }
  
  getStats(): GameStats {
    return {
      fps: this.fps,
      frameTime: this.frameTime,
      entityCount: this.entityCount,
      particleCount: this.particleCount
    }
  }
  
  getFPS(): number {
    return this.fps
  }
  
  getFrameTime(): number {
    return this.frameTime
  }
  
  getAverageFrameTime(): number {
    if (this.frameTimes.length === 0) return 0
    
    const sum = this.frameTimes.reduce((acc, time) => acc + time, 0)
    return sum / this.frameTimes.length
  }
  
  isPerformanceGood(): boolean {
    return this.fps >= 30 && this.getAverageFrameTime() <= 33
  }
  
  reset(): void {
    this.frameCount = 0
    this.lastTime = 0
    this.fps = 0
    this.frameTime = 0
    this.frameTimes = []
    this.entityCount = 0
    this.particleCount = 0
  }
}
