import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Game Error Boundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo)
    }
  }

  handleRestart = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-screen bg-black p-4">
          <Card className="w-full max-w-md bg-red-950 border-red-800">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-red-400" />
              </div>
              <CardTitle className="text-red-100">Game Crashed!</CardTitle>
              <CardDescription className="text-red-300">
                Something went wrong with the Space Invaders game.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-900 p-3 rounded text-xs text-red-100 font-mono overflow-auto max-h-32">
                  <div className="font-bold mb-2">Error Details:</div>
                  <div>{this.state.error.toString()}</div>
                  {this.state.errorInfo && (
                    <div className="mt-2">
                      <div className="font-bold">Stack Trace:</div>
                      <pre className="whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={this.handleRestart}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restart Game
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full border-red-600 text-red-100 hover:bg-red-800"
                >
                  Reload Page
                </Button>
              </div>
              
              <div className="text-center text-sm text-red-400">
                If the problem persists, try refreshing the page or check the browser console for more details.
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function useErrorHandler() {
  const handleError = (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Game error:', error, errorInfo)
    
    // In a real app, you might want to report this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: reportError(error, errorInfo)
    }
  }
  
  return handleError
}

// Simple error fallback component
export function GameErrorFallback({ 
  error, 
  resetErrorBoundary 
}: { 
  error: Error
  resetErrorBoundary: () => void 
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <div className="text-center space-y-4">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
        <h2 className="text-2xl font-bold text-red-400">Game Error</h2>
        <p className="text-gray-300 max-w-md">
          The game encountered an unexpected error and needs to restart.
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left bg-gray-900 p-4 rounded text-sm">
            <summary className="cursor-pointer text-red-400 font-bold mb-2">
              Error Details (Development)
            </summary>
            <pre className="text-red-300 whitespace-pre-wrap overflow-auto">
              {error.toString()}
            </pre>
          </details>
        )}
        
        <Button 
          onClick={resetErrorBoundary}
          className="bg-red-600 hover:bg-red-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Restart Game
        </Button>
      </div>
    </div>
  )
}
