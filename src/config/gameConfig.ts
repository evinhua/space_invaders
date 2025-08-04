export const GAME_CONFIG = {
  canvas: {
    width: 800,
    height: 600,
    backgroundColor: '#000011',
    starCount: 50
  },
  player: {
    width: 50,
    height: 30,
    speed: 5,
    color: '#00ff00',
    engineColor: '#004400',
    startX: 400, // canvas.width / 2
    startY: 550  // canvas.height - height - 20
  },
  enemies: {
    width: 40,
    height: 30,
    speed: 1,
    rows: 5,
    cols: 10,
    color: '#ff0000',
    eyeColor: '#ffff00',
    spacing: {
      horizontal: 20,
      vertical: 15
    },
    startPosition: {
      x: 50,
      y: 50
    },
    dropDistance: 20,
    animationSpeed: 500 // ms per frame
  },
  bullets: {
    width: 4,
    height: 10,
    speed: 7,
    color: '#ffff00',
    glowColor: '#ffff88'
  },
  particles: {
    count: 10,
    maxLife: 30,
    speedRange: 8
  },
  audio: {
    shoot: { 
      frequency: 800, 
      duration: 0.1, 
      type: 'square' as OscillatorType,
      volume: 0.1
    },
    explosion: { 
      frequency: 150, 
      duration: 0.3, 
      type: 'sawtooth' as OscillatorType,
      volume: 0.1
    },
    gameOver: { 
      frequency: 100, 
      duration: 0.5, 
      type: 'triangle' as OscillatorType,
      volume: 0.1
    }
  },
  game: {
    initialLives: 3,
    pointsPerEnemy: 10,
    maxFPS: 60,
    targetFrameTime: 16.67 // 1000ms / 60fps
  },
  ui: {
    titleGlow: '#ff0000',
    titleSize: '48px',
    textSize: '24px',
    smallTextSize: '18px'
  }
} as const

export type GameConfig = typeof GAME_CONFIG
