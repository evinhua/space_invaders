import { AudioConfig } from '@/types/game'
import { GAME_CONFIG } from '@/config/gameConfig'

export class AudioManager {
  private audioContext: AudioContext | null = null
  private masterVolume = 1.0
  private muted = false
  
  constructor() {
    this.initAudioContext()
  }
  
  private initAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (error) {
      console.warn('Web Audio API not supported:', error)
    }
  }
  
  private ensureAudioContext(): boolean {
    if (!this.audioContext) {
      this.initAudioContext()
    }
    
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume()
    }
    
    return this.audioContext !== null
  }
  
  playSound(config: AudioConfig): void {
    if (this.muted || !this.ensureAudioContext() || !this.audioContext) {
      return
    }
    
    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)
      
      oscillator.frequency.setValueAtTime(config.frequency, this.audioContext.currentTime)
      oscillator.type = config.type
      
      const volume = config.volume * this.masterVolume
      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + config.duration)
      
      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + config.duration)
    } catch (error) {
      console.warn('Error playing sound:', error)
    }
  }
  
  playShoot(): void {
    this.playSound(GAME_CONFIG.audio.shoot)
  }
  
  playExplosion(): void {
    this.playSound(GAME_CONFIG.audio.explosion)
  }
  
  playGameOver(): void {
    this.playSound(GAME_CONFIG.audio.gameOver)
  }
  
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume))
  }
  
  getMasterVolume(): number {
    return this.masterVolume
  }
  
  setMuted(muted: boolean): void {
    this.muted = muted
  }
  
  isMuted(): boolean {
    return this.muted
  }
  
  toggleMute(): boolean {
    this.muted = !this.muted
    return this.muted
  }
  
  cleanup(): void {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
  
  // Test audio functionality
  test(): void {
    console.log('Testing audio...')
    this.playShoot()
    setTimeout(() => this.playExplosion(), 200)
    setTimeout(() => this.playGameOver(), 400)
  }
}
