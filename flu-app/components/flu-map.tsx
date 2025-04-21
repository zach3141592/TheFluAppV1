"use client"

import { useEffect, useRef } from "react"

// Mock data for Canadian provinces and territories and their risk levels (1-10)
const PROVINCE_DATA = {
  AB: 6, // Alberta
  BC: 4, // British Columbia
  MB: 7, // Manitoba
  NB: 5, // New Brunswick
  NL: 4, // Newfoundland and Labrador
  NS: 5, // Nova Scotia
  NT: 3, // Northwest Territories
  NU: 2, // Nunavut
  ON: 7, // Ontario
  PE: 4, // Prince Edward Island
  QC: 6, // Quebec
  SK: 7, // Saskatchewan
  YT: 3, // Yukon
}

export function FluMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Significantly increased canvas dimensions
    canvas.width = 500
    canvas.height = 400

    // Draw a simple heatmap representation of Canada
    drawMap(ctx)
  }, [])

  const drawMap = (ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // Draw background
    ctx.fillStyle = "#f1f5f9" // slate-100
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // Draw title
    ctx.fillStyle = "#000000"
    ctx.font = "bold 16px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Canada Flu Activity", ctx.canvas.width / 2, 25)

    // Completely redesigned layout with more space between provinces
    drawProvinces(ctx)

    // Draw legend with improved spacing
    drawLegend(ctx)
  }

  const drawProvinces = (ctx: CanvasRenderingContext2D) => {
    // Northern territories (top row)
    drawProvince(ctx, "YT", 60, 60, 50, 40)
    drawProvince(ctx, "NT", 120, 60, 60, 40)
    drawProvince(ctx, "NU", 190, 60, 70, 40)

    // Western provinces (left side)
    drawProvince(ctx, "BC", 50, 120, 50, 60)
    drawProvince(ctx, "AB", 110, 120, 50, 60)
    drawProvince(ctx, "SK", 170, 120, 50, 60)
    drawProvince(ctx, "MB", 230, 120, 50, 60)

    // Central provinces
    drawProvince(ctx, "ON", 290, 140, 70, 70)
    drawProvince(ctx, "QC", 370, 120, 70, 70)

    // Atlantic provinces - with extra spacing and clear labels
    drawProvince(ctx, "NL", 400, 70, 50, 40)

    // Create a dedicated "Atlantic Provinces" section with clear labels
    ctx.fillStyle = "#000000"
    ctx.font = "bold 12px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Atlantic Provinces:", 350, 230)

    // Draw Atlantic provinces in a row with clear spacing
    const atlanticY = 250
    drawProvince(ctx, "NB", 280, atlanticY, 40, 30)
    drawProvince(ctx, "PE", 340, atlanticY, 40, 30) // Made PEI larger and clearly visible
    drawProvince(ctx, "NS", 400, atlanticY, 40, 30)
  }

  const drawProvince = (
    ctx: CanvasRenderingContext2D,
    code: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => {
    const risk = PROVINCE_DATA[code as keyof typeof PROVINCE_DATA] || 1

    // Draw province rectangle
    ctx.fillStyle = getRiskColor(risk)
    ctx.fillRect(x, y, width, height)

    // Draw border
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, width, height)

    // Draw province code
    ctx.fillStyle = "#000000"
    ctx.font = "bold 14px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(code, x + width / 2, y + height / 2)
  }

  const drawLegend = (ctx: CanvasRenderingContext2D) => {
    const legendY = ctx.canvas.height - 60
    const legendWidth = 300
    const legendHeight = 20
    const legendX = (ctx.canvas.width - legendWidth) / 2 // Center the legend

    // Create gradient for legend
    const gradient = ctx.createLinearGradient(legendX, 0, legendX + legendWidth, 0)
    gradient.addColorStop(0, "#22c55e") // green-500
    gradient.addColorStop(0.33, "#eab308") // yellow-500
    gradient.addColorStop(0.66, "#f97316") // orange-500
    gradient.addColorStop(1, "#ef4444") // red-500

    // Draw legend bar
    ctx.fillStyle = gradient
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight)

    // Draw border around legend
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 1
    ctx.strokeRect(legendX, legendY, legendWidth, legendHeight)

    // Draw legend labels with better spacing
    ctx.fillStyle = "#000000"
    ctx.font = "12px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "top"

    // Position labels with more space between them
    const labelY = legendY + legendHeight + 5
    ctx.fillText("Low", legendX, labelY)
    ctx.fillText("Moderate", legendX + legendWidth / 3, labelY)
    ctx.fillText("High", legendX + (2 * legendWidth) / 3, labelY)
    ctx.fillText("Very High", legendX + legendWidth, labelY)
  }

  const getRiskColor = (risk: number) => {
    if (risk <= 3) return "#22c55e" // green-500
    if (risk <= 6) return "#eab308" // yellow-500
    if (risk <= 8) return "#f97316" // orange-500
    return "#ef4444" // red-500
  }

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="w-full h-auto border rounded-md" />
    </div>
  )
}
