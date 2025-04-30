"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react"

interface RiskPredictionProps {
  futureRisks: Record<string, Record<string, number>>
}

export function RiskPrediction({ futureRisks }: RiskPredictionProps) {
  const [selectedCity, setSelectedCity] = useState(Object.keys(futureRisks)[0] || "")
  const cityPredictions = futureRisks[selectedCity] || {}

  // Get risk level text
  const getRiskLevelText = (value: number) => {
    if (value <= 3) return "Low"
    if (value <= 6) return "Moderate"
    if (value <= 8) return "High"
    return "Very High"
  }

  // Get color based on risk level
  const getRiskColor = (value: number) => {
    if (value <= 3) return "text-green-700"
    if (value <= 6) return "text-yellow-700"
    if (value <= 8) return "text-orange-700"
    return "text-red-700"
  }

  // Get background color based on risk level
  const getRiskBgColor = (value: number) => {
    if (value <= 3) return "bg-green-100"
    if (value <= 6) return "bg-yellow-100"
    if (value <= 8) return "bg-orange-100"
    return "bg-red-100"
  }

  // Format date to be more readable
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)) //sets day to correct day
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  // Get average risk for the selected city
  const averageRisk = Object.values(cityPredictions).reduce((sum, risk) => sum + risk, 0) / Object.keys(cityPredictions).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Next Week Flu Risk Prediction</CardTitle>
        <CardDescription>See the predicted flu risk for your city next week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <label htmlFor="city-select" className="block text-sm font-medium text-gray-700 mb-1">
            Select your city:
          </label>
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a city" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(futureRisks).map((city) => (
                <SelectItem key={city} value={city}>
                  {city.charAt(0).toUpperCase() + city.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-medium mb-4">Daily Predictions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            {Object.entries(cityPredictions).map(([date, risk]) => (
              <div 
                key={date} 
                className={`p-4 rounded-lg ${getRiskBgColor(risk)}`}
              >
                <div className="font-medium text-gray-900">{formatDate(date)}</div>
                <div className={`text-2xl font-bold mt-2 ${getRiskColor(risk)}`}>
                  {risk.toFixed(1)}/10
                </div>
                <div className={`text-sm mt-1 font-semibold ${getRiskColor(risk)}`}>
                  {getRiskLevelText(risk)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h4 className="font-semibold text-lg text-gray-900 mb-2">What this means:</h4>
          <p className="text-sm text-gray-700">
            The predicted flu risk for {selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)} is{" "}
            <span className={`font-semibold ${getRiskColor(averageRisk)}`}>
              {getRiskLevelText(averageRisk).toLowerCase()}
            </span>. {averageRisk >= 5 ? (
              <>
                Consider taking extra precautions such as avoiding crowded places, wearing masks in public settings, and
                getting vaccinated if you haven't already.
              </>
            ) : (
              <>
                Continue practicing good hygiene and preventive measures to help maintain this positive trend.
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
