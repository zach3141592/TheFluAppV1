"use client"

import { useEffect, useState } from "react"

interface RiskMeterProps {
  value: number
}

export function RiskMeter({ value }: RiskMeterProps) {
  const [animatedValue, setAnimatedValue] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value)
    }, 300)

    return () => clearTimeout(timer)
  }, [value])

  // Ensure value is between 1-10
  const normalizedValue = Math.max(1, Math.min(10, value))
  const normalizedAnimatedValue = Math.max(1, Math.min(10, animatedValue))

  // Calculate rotation angle (from -90 to 90 degrees)
  const angle = -90 + (normalizedAnimatedValue - 1) * (180 / 9)

  // Determine color based on risk level
  const getColor = (val: number) => {
    if (val <= 3) return "#22c55e" // green-500
    if (val <= 6) return "#eab308" // yellow-500
    if (val <= 8) return "#f97316" // orange-500
    return "#ef4444" // red-500
  }

  const getRiskText = (val: number) => {
    if (val <= 3) return "Low"
    if (val <= 6) return "Moderate"
    if (val <= 8) return "High"
    return "Very High"
  }

  return (
    <div className="relative w-64 h-32 mt-4">
      {/* Semicircle background */}
      <div className="absolute w-full h-full bg-gray-200 rounded-t-full overflow-hidden">
        <div className="absolute bottom-0 w-full h-1/2 bg-white"></div>
      </div>

      {/* Color segments */}
      <div className="absolute bottom-0 left-0 w-full h-1/2 flex">
        <div className="w-1/4 h-full bg-green-500 rounded-bl-full"></div>
        <div className="w-1/4 h-full bg-yellow-500"></div>
        <div className="w-1/4 h-full bg-orange-500"></div>
        <div className="w-1/4 h-full bg-red-500 rounded-br-full"></div>
      </div>

      {/* Needle */}
      <div
        className="absolute bottom-0 left-1/2 w-1 h-28 bg-gray-800 origin-bottom transition-transform duration-1000"
        style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
      ></div>

      {/* Center point */}
      <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-gray-800 rounded-full transform -translate-x-1/2 translate-y-1/2"></div>

      {/* Value display */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-12 text-center">
        <div className="text-3xl font-bold" style={{ color: getColor(normalizedValue) }}>
          {normalizedValue}
        </div>
      </div>
    </div>
  )
}
