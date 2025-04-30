"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface CityRisk {
  risk: number
  level: string
}

interface CitySearchProps {
  cityRisks: Record<string, number>
}

export function CitySearch({ cityRisks }: CitySearchProps) {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<{ city: string; risk: number; level: string } | null>(null)
  const [notFound, setNotFound] = useState(false)

  const getRiskLevel = (risk: number): string => {
    if (risk <= 3) return "Low"
    if (risk <= 6) return "Moderate"
    if (risk <= 8) return "High"
    return "Very High"
  }

  const handleSearch = () => {
    if (!query.trim()) return

    const normalizedQuery = query.trim().toLowerCase()
    const foundCity = Object.entries(cityRisks).find(([city]) => 
      city.toLowerCase().includes(normalizedQuery)
    )

    if (foundCity) {
      const risk = foundCity[1]
      setResult({
        city: foundCity[0],
        risk,
        level: getRiskLevel(risk),
      })
      setNotFound(false)
    } else {
      setResult(null)
      setNotFound(true)
    }
  }

  // Get color based on risk level
  const getRiskColor = (level: string) => {
    switch (level) {
      case "Low":
        return "text-green-500"
      case "Moderate":
        return "text-yellow-500"
      case "High":
        return "text-orange-500"
      case "Very High":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Enter city name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {notFound && <div className="text-center py-4 text-gray-500">No data found for "{query}". Try another city.</div>}

      {result && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium capitalize mb-2">{result.city}</h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Current Risk Index:</div>
                <div className="text-2xl font-bold">{result.risk.toFixed(1)}/10</div>
              </div>
              <div className={`text-xl font-bold ${getRiskColor(result.level)}`}>{result.level}</div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              {result.level === "Low" && "Practice normal precautions and consider getting your flu shot."}
              {result.level === "Moderate" &&
                "Get vaccinated and practice good hygiene. Consider wearing masks in crowded areas."}
              {result.level === "High" &&
                "Avoid crowded places, wear masks in public settings, and get vaccinated if you haven't."}
              {result.level === "Very High" &&
                "Stay home if possible, wear masks in all public settings, and take all precautions."}
            </div>
          </CardContent>
        </Card>
      )}

      {!result && !notFound && (
        <div className="text-center py-8 text-gray-500">Search for a Canadian city to see current flu risk data</div>
      )}
    </div>
  )
}
