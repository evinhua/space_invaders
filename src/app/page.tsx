'use client'

import React, { useState } from 'react'
import SpaceInvaders from '@/components/SpaceInvaders/Game'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Gamepad2, Trophy, Settings, Info } from 'lucide-react'

export default function Home() {
  const [highScore, setHighScore] = useState(0)
  const [showDebug, setShowDebug] = useState(false)
  const [gameStats, setGameStats] = useState({
    gamesPlayed: 0,
    totalScore: 0,
    bestLevel: 1
  })

  const handleScoreChange = (score: number) => {
    if (score > highScore) {
      setHighScore(score)
    }
  }

  const handleGameOver = (finalScore: number) => {
    setGameStats(prev => ({
      gamesPlayed: prev.gamesPlayed + 1,
      totalScore: prev.totalScore + finalScore,
      bestLevel: Math.max(prev.bestLevel, Math.floor(finalScore / 500) + 1) // Estimate level from score
    }))
  }

  const resetStats = () => {
    setHighScore(0)
    setGameStats({
      gamesPlayed: 0,
      totalScore: 0,
      bestLevel: 1
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gamepad2 className="h-8 w-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">
              Space Invaders
            </h1>
            <Badge variant="secondary" className="bg-blue-600 text-white">
              Enhanced
            </Badge>
          </div>
          <p className="text-gray-300 max-w-2xl mx-auto">
            A modern implementation of the classic arcade game with improved performance, 
            object pooling, and comprehensive error handling.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-3">
            <SpaceInvaders
              onScoreChange={handleScoreChange}
              onGameOver={handleGameOver}
              showDebug={showDebug}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statistics */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">High Score:</span>
                  <span className="text-yellow-400 font-bold">{highScore.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Games Played:</span>
                  <span className="text-blue-400">{gameStats.gamesPlayed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Total Score:</span>
                  <span className="text-green-400">{gameStats.totalScore.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Best Level:</span>
                  <span className="text-purple-400">{gameStats.bestLevel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Avg Score:</span>
                  <span className="text-orange-400">
                    {gameStats.gamesPlayed > 0 
                      ? Math.round(gameStats.totalScore / gameStats.gamesPlayed).toLocaleString()
                      : '0'
                    }
                  </span>
                </div>
                <Button 
                  onClick={resetStats}
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Reset Stats
                </Button>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-400" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="debug-mode" className="text-gray-300">
                    Debug Mode
                  </Label>
                  <Switch
                    id="debug-mode"
                    checked={showDebug}
                    onCheckedChange={setShowDebug}
                  />
                </div>
                {showDebug && (
                  <p className="text-xs text-gray-400">
                    Shows FPS, entity counts, collision boxes, and performance metrics.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Game Info */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-400" />
                  Game Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Object Pooling</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Performance Monitoring</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Error Boundaries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span>Fixed Timestep</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span>Input Validation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <span>Audio Management</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-gray-300">
                <div><kbd className="bg-gray-700 px-2 py-1 rounded">←→</kbd> Move</div>
                <div><kbd className="bg-gray-700 px-2 py-1 rounded">Space</kbd> Shoot</div>
                <div><kbd className="bg-gray-700 px-2 py-1 rounded">Enter</kbd> Start/Restart</div>
                <div><kbd className="bg-gray-700 px-2 py-1 rounded">P</kbd> Pause/Resume</div>
                <div><kbd className="bg-gray-700 px-2 py-1 rounded">Esc</kbd> Menu</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-400 text-sm">
          <p>
            Enhanced Space Invaders with modern web technologies • 
            Built with Next.js, TypeScript, and Canvas API
          </p>
          <p className="mt-2">
            Features: Object Pooling • Performance Monitoring • Error Boundaries • 
            Fixed Timestep • Input Validation • Audio Management
          </p>
        </div>
      </div>
    </div>
  )
}
