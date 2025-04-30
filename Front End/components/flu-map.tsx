"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface FluMapProps {
  provincialRisks: Record<string, number>
}

export function FluMap({ provincialRisks }: FluMapProps) {
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null)

  // Add console logging
  console.log('Provincial Risks:', provincialRisks)

  const getRiskColor = (risk: number) => {
    if (risk === 0) return "fill-gray-200" // No data
    if (risk <= 3) return "fill-green-500"
    if (risk <= 6) return "fill-yellow-500"
    if (risk <= 8) return "fill-orange-500"
    return "fill-red-500"
  }

  const getRiskLevel = (risk: number) => {
    if (risk === 0) return "No Data"
    if (risk <= 3) return "Low"
    if (risk <= 6) return "Moderate"
    if (risk <= 8) return "High"
    return "Very High"
  }

  return (
    <Card>
      <CardContent>
        <div className="relative w-full aspect-[4/3]">
          <TooltipProvider>
            <svg
              viewBox="0 0 1000 800"
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Background */}
              <rect width="100%" height="100%" fill="#f8fafc" />

              {/* Provinces */}
              <g className="provinces" transform="translate(100, 100)">
                {/* Northern Territories */}
                <g transform="translate(0, 0)">
                  {/* Yukon */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <g>
                        <rect
                          x="0" y="0" width="80" height="90"
                          className={`${getRiskColor(provincialRisks["YT"] || 0)} stroke-white stroke-2 cursor-pointer hover:opacity-80 transition-all duration-200`}
                          onMouseEnter={() => setHoveredProvince("YT")}
                          onMouseLeave={() => setHoveredProvince(null)}
                        />
                        <text
                          x="40"
                          y="45"
                          className="text-xl font-bold fill-gray-800 text-center"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          YT
                        </text>
                        <text
                          x="40"
                          y="65"
                          className="text-lg font-medium fill-gray-600 text-center"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {(provincialRisks["YT"] || 0).toFixed(1)}
                        </text>
                      </g>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">Yukon</p>
                      <p>Risk Level: {getRiskLevel(provincialRisks["YT"] || 0)}</p>
                      <p>Score: {(provincialRisks["YT"] || 0).toFixed(1)}/10</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Northwest Territories */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <g>
                        <rect
                          x="80" y="0" width="80" height="90"
                          className={`${getRiskColor(provincialRisks["NT"] || 0)} stroke-white stroke-2 cursor-pointer hover:opacity-80 transition-all duration-200`}
                          onMouseEnter={() => setHoveredProvince("NT")}
                          onMouseLeave={() => setHoveredProvince(null)}
                        />
                        <text
                          x="120"
                          y="45"
                          className="text-xl font-bold fill-gray-800 text-center"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          NT
                        </text>
                        <text
                          x="120"
                          y="65"
                          className="text-lg font-medium fill-gray-600 text-center"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {(provincialRisks["NT"] || 0).toFixed(1)}
                        </text>
                      </g>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">Northwest Territories</p>
                      <p>Risk Level: {getRiskLevel(provincialRisks["NT"] || 0)}</p>
                      <p>Score: {(provincialRisks["NT"] || 0).toFixed(1)}/10</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Nunavut */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <g>
                        <rect
                          x="160" y="0" width="80" height="90"
                          className={`${getRiskColor(provincialRisks["NU"] || 0)} stroke-white stroke-2 cursor-pointer hover:opacity-80 transition-all duration-200`}
                          onMouseEnter={() => setHoveredProvince("NU")}
                          onMouseLeave={() => setHoveredProvince(null)}
                        />
                        <text
                          x="200"
                          y="45"
                          className="text-xl font-bold fill-gray-800 text-center"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          NU
                        </text>
                        <text
                          x="200"
                          y="65"
                          className="text-lg font-medium fill-gray-600 text-center"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {(provincialRisks["NU"] || 0).toFixed(1)}
                        </text>
                      </g>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">Nunavut</p>
                      <p>Risk Level: {getRiskLevel(provincialRisks["NU"] || 0)}</p>
                      <p>Score: {(provincialRisks["NU"] || 0).toFixed(1)}/10</p>
                    </TooltipContent>
                  </Tooltip>
                </g>

                {/* Main Provinces */}
                <g transform="translate(0, 90)">
                  {/* British Columbia */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <g>
                        <rect
                          x="0" y="0" width="120" height="180"
                          className={`${getRiskColor(provincialRisks["BC"] || 0)} stroke-white stroke-2 cursor-pointer hover:opacity-80 transition-all duration-200`}
                          onMouseEnter={() => setHoveredProvince("BC")}
                          onMouseLeave={() => setHoveredProvince(null)}
                        />
                        <text
                          x="60"
                          y="90"
                          className="text-xl font-bold fill-gray-800 text-center"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          BC
                        </text>
                        <text
                          x="60"
                          y="110"
                          className="text-lg font-medium fill-gray-600 text-center"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {(provincialRisks["BC"] || 0).toFixed(1)}
                        </text>
                      </g>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">British Columbia</p>
                      <p>Risk Level: {getRiskLevel(provincialRisks["BC"] || 0)}</p>
                      <p>Score: {(provincialRisks["BC"] || 0).toFixed(1)}/10</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Alberta */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <g>
                        <rect
                          x="120" y="0" width="120" height="180"
                          className={`${getRiskColor(provincialRisks["AB"] || 0)} stroke-white stroke-2 cursor-pointer hover:opacity-80 transition-all duration-200`}
                          onMouseEnter={() => setHoveredProvince("AB")}
                          onMouseLeave={() => setHoveredProvince(null)}
                        />
                        <text
                          x="180"
                          y="90"
                          className="text-xl font-bold fill-gray-800 text-center"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          AB
                        </text>
                        <text
                          x="180"
                          y="110"
                          className="text-lg font-medium fill-gray-600 text-center"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {(provincialRisks["AB"] || 0).toFixed(1)}
                        </text>
                      </g>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">Alberta</p>
                      <p>Risk Level: {getRiskLevel(provincialRisks["AB"] || 0)}</p>
                      <p>Score: {(provincialRisks["AB"] || 0).toFixed(1)}/10</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Saskatchewan */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <g>
                        <rect
                          x="240" y="0" width="120" height="180"
                          className={`${getRiskColor(provincialRisks["SK"] || 0)} stroke-white stroke-2 cursor-pointer hover:opacity-80 transition-all duration-200`}
                          onMouseEnter={() => setHoveredProvince("SK")}
                          onMouseLeave={() => setHoveredProvince(null)}
                        />
                        <text
                          x="300"
                          y="90"
                          className="text-xl font-bold fill-gray-800 text-center"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          SK
                        </text>
                        <text
                          x="300"
                          y="110"
                          className="text-lg font-medium fill-gray-600 text-center"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {(provincialRisks["SK"] || 0).toFixed(1)}
                        </text>
                      </g>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">Saskatchewan</p>
                      <p>Risk Level: {getRiskLevel(provincialRisks["SK"] || 0)}</p>
                      <p>Score: {(provincialRisks["SK"] || 0).toFixed(1)}/10</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Manitoba */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <g>
                        <rect
                          x="360" y="0" width="120" height="180"
                          className={`${getRiskColor(provincialRisks["MB"] || 0)} stroke-white stroke-2 cursor-pointer hover:opacity-80 transition-all duration-200`}
                          onMouseEnter={() => setHoveredProvince("MB")}
                          onMouseLeave={() => setHoveredProvince(null)}
                        />
                        <text
                          x="420"
                          y="90"
                          className="text-xl font-bold fill-gray-800 text-center"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          MB
                        </text>
                        <text
                          x="420"
                          y="110"
                          className="text-lg font-medium fill-gray-600 text-center"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {(provincialRisks["MB"] || 0).toFixed(1)}
                        </text>
                      </g>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">Manitoba</p>
                      <p>Risk Level: {getRiskLevel(provincialRisks["MB"] || 0)}</p>
                      <p>Score: {(provincialRisks["MB"] || 0).toFixed(1)}/10</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Ontario */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <g>
                        <rect
                          x="480" y="0" width="160" height="180"
                          className={`${getRiskColor(provincialRisks["ON"] || 0)} stroke-white stroke-2 cursor-pointer hover:opacity-80 transition-all duration-200`}
                          onMouseEnter={() => setHoveredProvince("ON")}
                          onMouseLeave={() => setHoveredProvince(null)}
                        />
                        <text
                          x="560"
                          y="90"
                          className="text-xl font-bold fill-gray-800 text-center"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          ON
                        </text>
                        <text
                          x="560"
                          y="110"
                          className="text-lg font-medium fill-gray-600 text-center"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {(provincialRisks["ON"] || 0).toFixed(1)}
                        </text>
                      </g>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">Ontario</p>
                      <p>Risk Level: {getRiskLevel(provincialRisks["ON"] || 0)}</p>
                      <p>Score: {(provincialRisks["ON"] || 0).toFixed(1)}/10</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Quebec */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <g>
                        <rect
                          x="640" y="0" width="120" height="180"
                          className={`${getRiskColor(provincialRisks["QC"] || 0)} stroke-white stroke-2 cursor-pointer hover:opacity-80 transition-all duration-200`}
                          onMouseEnter={() => setHoveredProvince("QC")}
                          onMouseLeave={() => setHoveredProvince(null)}
                        />
                        <text
                          x="700"
                          y="90"
                          className="text-xl font-bold fill-gray-800 text-center"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          QC
                        </text>
                        <text
                          x="700"
                          y="110"
                          className="text-lg font-medium fill-gray-600 text-center"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {(provincialRisks["QC"] || 0).toFixed(1)}
                        </text>
                      </g>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">Quebec</p>
                      <p>Risk Level: {getRiskLevel(provincialRisks["QC"] || 0)}</p>
                      <p>Score: {(provincialRisks["QC"] || 0).toFixed(1)}/10</p>
                    </TooltipContent>
                  </Tooltip>
                </g>

                {/* Atlantic Provinces */}
                <g transform="translate(640, 270)">
                  {/* New Brunswick */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <g>
                        <rect
                          x="0" y="0" width="60" height="90"
                          className={`${getRiskColor(provincialRisks["NB"] || 0)} stroke-white stroke-2 cursor-pointer hover:opacity-80 transition-all duration-200`}
                          onMouseEnter={() => setHoveredProvince("NB")}
                          onMouseLeave={() => setHoveredProvince(null)}
                        />
                        <text
                          x="30"
                          y="45"
                          className="text-xl font-bold fill-gray-800 text-center"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          NB
                        </text>
                        <text
                          x="30"
                          y="65"
                          className="text-lg font-medium fill-gray-600 text-center"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {(provincialRisks["NB"] || 0).toFixed(1)}
                        </text>
                      </g>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">New Brunswick</p>
                      <p>Risk Level: {getRiskLevel(provincialRisks["NB"] || 0)}</p>
                      <p>Score: {(provincialRisks["NB"] || 0).toFixed(1)}/10</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Prince Edward Island */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <g>
                        <rect
                          x="60" y="0" width="60" height="90"
                          className={`${getRiskColor(provincialRisks["PE"] || 0)} stroke-white stroke-2 cursor-pointer hover:opacity-80 transition-all duration-200`}
                          onMouseEnter={() => setHoveredProvince("PE")}
                          onMouseLeave={() => setHoveredProvince(null)}
                        />
                        <text
                          x="90"
                          y="45"
                          className="text-xl font-bold fill-gray-800 text-center"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          PE
                        </text>
                        <text
                          x="90"
                          y="65"
                          className="text-lg font-medium fill-gray-600 text-center"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {(provincialRisks["PE"] || 0).toFixed(1)}
                        </text>
                      </g>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">Prince Edward Island</p>
                      <p>Risk Level: {getRiskLevel(provincialRisks["PE"] || 0)}</p>
                      <p>Score: {(provincialRisks["PE"] || 0).toFixed(1)}/10</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Nova Scotia */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <g>
                        <rect
                          x="0" y="90" width="60" height="90"
                          className={`${getRiskColor(provincialRisks["NS"] || 0)} stroke-white stroke-2 cursor-pointer hover:opacity-80 transition-all duration-200`}
                          onMouseEnter={() => setHoveredProvince("NS")}
                          onMouseLeave={() => setHoveredProvince(null)}
                        />
                        <text
                          x="30"
                          y="135"
                          className="text-xl font-bold fill-gray-800 text-center"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          NS
                        </text>
                        <text
                          x="30"
                          y="155"
                          className="text-lg font-medium fill-gray-600 text-center"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {(provincialRisks["NS"] || 0).toFixed(1)}
                        </text>
                      </g>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">Nova Scotia</p>
                      <p>Risk Level: {getRiskLevel(provincialRisks["NS"] || 0)}</p>
                      <p>Score: {(provincialRisks["NS"] || 0).toFixed(1)}/10</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Newfoundland and Labrador */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <g>
                        <rect
                          x="60" y="90" width="60" height="90"
                          className={`${getRiskColor(provincialRisks["NL"] || 0)} stroke-white stroke-2 cursor-pointer hover:opacity-80 transition-all duration-200`}
                          onMouseEnter={() => setHoveredProvince("NL")}
                          onMouseLeave={() => setHoveredProvince(null)}
                        />
                        <text
                          x="90"
                          y="135"
                          className="text-xl font-bold fill-gray-800 text-center"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          NL
                        </text>
                        <text
                          x="90"
                          y="155"
                          className="text-lg font-medium fill-gray-600 text-center"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {(provincialRisks["NL"] || 0).toFixed(1)}
                        </text>
                      </g>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">Newfoundland and Labrador</p>
                      <p>Risk Level: {getRiskLevel(provincialRisks["NL"] || 0)}</p>
                      <p>Score: {(provincialRisks["NL"] || 0).toFixed(1)}/10</p>
                    </TooltipContent>
                  </Tooltip>
                </g>
              </g>

              {/* Legend */}
              <g transform="translate(100, 600)">
                <rect width="800" height="20" fill="url(#gradient)" rx="4" className="shadow-sm" />
                <text x="0" y="40" className="text-xs font-bold fill-gray-700">Low Risk</text>
                <text x="400" y="40" className="text-xs font-bold fill-gray-700">Moderate Risk</text>
                <text x="800" y="40" className="text-xs font-bold fill-gray-700">High Risk</text>
              </g>
            </svg>

            {/* Gradient definition */}
            <svg width="0" height="0">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="33%" stopColor="#eab308" />
                  <stop offset="66%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
            </svg>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  )
}
