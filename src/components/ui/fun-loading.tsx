"use client"

import React from "react"
import { LoadingSpinner } from "./loading-spinner"
import { motion, AnimatePresence } from "framer-motion"

const AI_JOKES = [
  "Why did the AI go to therapy? It was having an identity crisis!",
  "What's an AI's favorite type of music? Algorithm and blues!",
  "Why don't AIs tell dad jokes? They're afraid of bad bit rates!",
  "How does an AI take a break? It runs on idle!",
  "What's an AI's favorite drink? Binary code on the rocks!",
  "Why did the neural network cross the road? To optimize the other side!",
  "What do you call an AI that loves to garden? A deep learning root system!",
  "Why was the machine learning model so fit? It did lots of training!",
  "What's an AI's favorite game? Hide and seek - it's always searching!",
  "How do AIs make friends? Through neural networking events!"
]

const LOADING_MESSAGES = [
  "Consulting with the digital oracles...",
  "Teaching machines to think deeply...",
  "Warming up the neural networks...",
  "Gathering wisdom from the silicon sages...",
  "Calibrating the AI ensemble...",
  "Synchronizing digital synapses...",
  "Pondering the deep questions...",
  "Processing in parallel universes...",
  "Consulting multiple AI perspectives...",
  "Brewing some artificial intelligence..."
]

export function FunLoading() {
  const [currentJoke, setCurrentJoke] = React.useState(0)
  const [currentMessage, setCurrentMessage] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentJoke(prev => (prev + 1) % AI_JOKES.length)
      setCurrentMessage(prev => (prev + 1) % LOADING_MESSAGES.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-8">
      <div className="text-center space-y-4">
        <h3 className="text-lg font-semibold text-primary">
          Gathering responses from all models...
        </h3>
        <p className="text-sm text-muted-foreground">
          This might take a minute or two. The AIs are thinking deeply!
        </p>
      </div>

      <LoadingSpinner size="lg" className="text-primary" />

      <div className="max-w-md text-center space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMessage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="h-8"
          >
            <p className="text-sm italic text-muted-foreground">
              {LOADING_MESSAGES[currentMessage]}
            </p>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentJoke}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            className="h-16 flex items-center justify-center"
          >
            <div className="bg-muted/50 rounded-lg p-4 shadow-sm">
              <p className="text-sm">{AI_JOKES[currentJoke]}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
} 