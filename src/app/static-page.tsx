'use client'

import React from 'react'
import StaticSpaceInvaders from '@/components/SpaceInvaders/StaticGame'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Gamepad2, Github, Star, Code, Zap } from 'lucide-react'

export default function StaticPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gamepad2 className="h-8 w-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">
              Enhanced Space Invaders
            </h1>
            <Badge variant="secondary" className="bg-blue-600 text-white">
              GitHub Pages
            </Badge>
          </div>
          <p className="text-gray-300 max-w-2xl mx-auto">
            A modern implementation of the classic arcade game built with Next.js, TypeScript, 
            and advanced web technologies. Play directly in your browser!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-3">
            <StaticSpaceInvaders />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Info */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Github className="h-5 w-5 text-gray-400" />
                  Project Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-300">
                  <p className="mb-3">
                    This is a production-ready implementation showcasing modern web development practices.
                  </p>
                  
                  <div className="space-y-2">
                    <a 
                      href="https://github.com/evinhua/space_invaders" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Github className="h-4 w-4" />
                      View Source Code
                    </a>
                    
                    <a 
                      href="https://github.com/evinhua/space_invaders/stargazers" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors"
                    >
                      <Star className="h-4 w-4" />
                      Star on GitHub
                    </a>
                    
                    <a 
                      href="https://github.com/evinhua/space_invaders/issues" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
                    >
                      <Code className="h-4 w-4" />
                      Report Issues
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>60fps Smooth Gameplay</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Web Audio API Sounds</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Particle Effects</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span>Responsive Design</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span>Keyboard Controls</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <span>Level Progression</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tech Stack */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Tech Stack</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-gray-300">
                <div><Badge variant="outline" className="text-xs">Next.js 15</Badge></div>
                <div><Badge variant="outline" className="text-xs">TypeScript 5</Badge></div>
                <div><Badge variant="outline" className="text-xs">React 19</Badge></div>
                <div><Badge variant="outline" className="text-xs">Canvas API</Badge></div>
                <div><Badge variant="outline" className="text-xs">Web Audio API</Badge></div>
                <div><Badge variant="outline" className="text-xs">Tailwind CSS</Badge></div>
              </CardContent>
            </Card>

            {/* Controls */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Game Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-gray-300">
                <div><kbd className="bg-gray-700 px-2 py-1 rounded">←→</kbd> Move Ship</div>
                <div><kbd className="bg-gray-700 px-2 py-1 rounded">Space</kbd> Shoot</div>
                <div><kbd className="bg-gray-700 px-2 py-1 rounded">Enter</kbd> Start/Restart</div>
                <div><kbd className="bg-gray-700 px-2 py-1 rounded">P/Esc</kbd> Pause</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-400 text-sm">
          <p>
            🚀 Enhanced Space Invaders • Built with modern web technologies
          </p>
          <p className="mt-2">
            <a 
              href="https://github.com/evinhua/space_invaders" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Open Source on GitHub
            </a>
            {' • '}
            <a 
              href="https://github.com/evinhua" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Made by Evin Hua
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
