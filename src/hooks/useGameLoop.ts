import { useCallback, useEffect, useRef } from 'react'
import { GAME_CONFIG } from '@/config/gameConfig'

export interface GameLoopCallbacks {
  onUpdate: (deltaTime: number, currentTime: number) => void
  onRender: (interpolation: number) => void
}

export function useGameLoop(callbacks: GameLoopCallbacks, isActive: boolean = true) {
  const requestRef = useRef<number | undefined>(undefined)
  const previousTimeRef = useRef<number | undefined>(undefined)
  const lagRef = useRef<number>(0)
  const fpsCounterRef = useRef({ frames: 0, lastTime: 0, fps: 0 })
  
  const targetFrameTime = GAME_CONFIG.game.targetFrameTime
  
  const gameLoop = useCallback((currentTime: number) => {
    if (!isActive) {
      requestRef.current = requestAnimationFrame(gameLoop)
      return
    }
    
    // Initialize timing on first frame
    if (previousTimeRef.current === undefined) {
      previousTimeRef.current = currentTime
    }
    
    const deltaTime = currentTime - previousTimeRef.current
    previousTimeRef.current = currentTime
    
    // Accumulate lag
    lagRef.current += deltaTime
    
    // Fixed timestep updates
    let updateCount = 0
    const maxUpdates = 5 // Prevent spiral of death
    
    while (lagRef.current >= targetFrameTime && updateCount < maxUpdates) {
      try {
        callbacks.onUpdate(targetFrameTime, currentTime)
        lagRef.current -= targetFrameTime
        updateCount++
      } catch (error) {
        console.error('Error in game update:', error)
        lagRef.current = 0 // Reset to prevent infinite loop
        break
      }
    }
    
    // Calculate interpolation for smooth rendering
    const interpolation = lagRef.current / targetFrameTime
    
    try {
      callbacks.onRender(interpolation)
    } catch (error) {
      console.error('Error in game render:', error)
    }
    
    // FPS calculation
    const fpsCounter = fpsCounterRef.current
    fpsCounter.frames++
    
    if (currentTime - fpsCounter.lastTime >= 1000) {
      fpsCounter.fps = fpsCounter.frames
      fpsCounter.frames = 0
      fpsCounter.lastTime = currentTime
    }
    
    requestRef.current = requestAnimationFrame(gameLoop)
  }, [callbacks, isActive, targetFrameTime])
  
  useEffect(() => {
    if (isActive) {
      requestRef.current = requestAnimationFrame(gameLoop)
    }
    
    return () => {
      if (requestRef.current !== undefined) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [gameLoop, isActive])
  
  const getFPS = useCallback(() => {
    return fpsCounterRef.current.fps
  }, [])
  
  const reset = useCallback(() => {
    previousTimeRef.current = undefined
    lagRef.current = 0
    fpsCounterRef.current = { frames: 0, lastTime: 0, fps: 0 }
  }, [])
  
  return { getFPS, reset }
}
