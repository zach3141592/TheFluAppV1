"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

// Mock data for Canadian cities and their risk levels
const MOCK_CITIES = {
  toronto: { risk: 7, level: "High" },
  montreal: { risk: 6, level: "Moderate" },
  vancouver: { risk: 4, level: "Moderate" },
  calgary: { risk: 5, level: "Moderate" },
  edmonton: { risk: 6, level: "Moderate" },
  ottawa: { risk: 7, level: "High" },
  winnipeg: { risk: 8, level: "High" },
  "quebec city": { risk: 5, level: "Moderate" },
  hamilton: { risk: 6, level: "Moderate" },
  kitchener: { risk: 7, level: "High" },
  london: { risk: 6, level: "Moderate" },
  victoria: { risk: 3, level: "Low" },
  halifax: { risk: 5, level: "Moderate" },
  saskatoon: { risk: 7, level: "High" },
  regina: { risk: 6, level: "Moderate" },
  "st. john's": { risk: 4, level: "Moderate" },
  kelowna: { risk: 3, level: "Low" },
}

export function CitySearch() {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<{ city: string; risk: number; level: string } | null>(null)
  const [notFound, setNotFound] = useState(false)

  const handleSearch = () => {
    if (!query.trim()) return

    const normalizedQuery = query.trim().toLowerCase()
    const foundCity = Object.entries(MOCK_CITIES).find(([city]) => city.includes(normalizedQuery))

    if (foundCity) {
      setResult({
        city: foundCity[0],
        risk: foundCity[1].risk,
        level: foundCity[1].level,
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
                <div className="text-2xl font-bold">{result.risk}/10</div>
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
