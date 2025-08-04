import { useEffect, useRef, useCallback } from 'react'
import { validateInput } from '@/utils/gameLogic'

export interface KeyboardState {
  isPressed: (key: string) => boolean
  wasJustPressed: (key: string) => boolean
  wasJustReleased: (key: string) => boolean
  getPressed: () => string[]
  reset: () => void
}

export function useKeyboard(): KeyboardState {
  const keysRef = useRef<Set<string>>(new Set())
  const justPressedRef = useRef<Set<string>>(new Set())
  const justReleasedRef = useRef<Set<string>>(new Set())
  const previousKeysRef = useRef<Set<string>>(new Set())
  const frameRef = useRef<number | undefined>(undefined)
  
  const updateKeyStates = useCallback(() => {
    // Clear just pressed/released sets
    justPressedRef.current.clear()
    justReleasedRef.current.clear()
    
    // Find newly pressed keys
    keysRef.current.forEach(key => {
      if (!previousKeysRef.current.has(key)) {
        justPressedRef.current.add(key)
      }
    })
    
    // Find newly released keys
    previousKeysRef.current.forEach(key => {
      if (!keysRef.current.has(key)) {
        justReleasedRef.current.add(key)
      }
    })
    
    // Update previous keys
    previousKeysRef.current = new Set(keysRef.current)
    
    // Schedule next update
    frameRef.current = requestAnimationFrame(updateKeyStates)
  }, [])
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Normalize space key
      const key = e.key === ' ' ? 'Space' : e.key
      
      // Validate input for security
      if (!validateInput(key) && !validateInput(e.key)) {
        return
      }
      
      // Prevent default browser behavior for game keys
      if (['ArrowLeft', 'ArrowRight', 'Space', ' ', 'Enter', 'Escape', 'p', 'P'].includes(key) || 
          ['ArrowLeft', 'ArrowRight', 'Space', ' ', 'Enter', 'Escape', 'p', 'P'].includes(e.key)) {
        e.preventDefault()
      }
      
      keysRef.current.add(key)
      if (key !== e.key) {
        keysRef.current.add(e.key) // Add both normalized and original
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key === ' ' ? 'Space' : e.key
      
      if (!validateInput(key) && !validateInput(e.key)) {
        return
      }
      
      keysRef.current.delete(key)
      keysRef.current.delete(e.key) // Remove both versions
    }
    
    const handleBlur = () => {
      // Clear all keys when window loses focus
      keysRef.current.clear()
      justPressedRef.current.clear()
      justReleasedRef.current.clear()
      previousKeysRef.current.clear()
    }
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleBlur()
      }
    }
    
    // Add event listeners
    document.addEventListener('keydown', handleKeyDown, true) // Use capture phase
    document.addEventListener('keyup', handleKeyUp, true)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Start the update loop
    frameRef.current = requestAnimationFrame(updateKeyStates)
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('keyup', handleKeyUp, true)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      
      if (frameRef.current !== undefined) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [updateKeyStates])
  
  const isPressed = useCallback((key: string): boolean => {
    return keysRef.current.has(key) || keysRef.current.has(key === 'Space' ? ' ' : key)
  }, [])
  
  const wasJustPressed = useCallback((key: string): boolean => {
    return justPressedRef.current.has(key) || justPressedRef.current.has(key === 'Space' ? ' ' : key)
  }, [])
  
  const wasJustReleased = useCallback((key: string): boolean => {
    return justReleasedRef.current.has(key) || justReleasedRef.current.has(key === 'Space' ? ' ' : key)
  }, [])
  
  const getPressed = useCallback((): string[] => {
    return Array.from(keysRef.current)
  }, [])
  
  const reset = useCallback(() => {
    keysRef.current.clear()
    justPressedRef.current.clear()
    justReleasedRef.current.clear()
    previousKeysRef.current.clear()
  }, [])
  
  return {
    isPressed,
    wasJustPressed,
    wasJustReleased,
    getPressed,
    reset
  }
}
