"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"

interface SurveyResponse {
  id: number
  age: number
  postalCode: string
  organization: string
  organizationType: string
  symptoms: string
  province: string
  timestamp: string
  timezone: string
  submissionId: string
  userEmail: string
  createdAt: string
}

export default function SurveyHistoryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [surveys, setSurveys] = useState<SurveyResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/signin")
      return
    }

    const fetchSurveys = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/surveys?user_email=${encodeURIComponent(user.email)}`)
        if (!response.ok) {
          throw new Error("Failed to fetch surveys")
        }
        const data = await response.json()
        setSurveys(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load survey history",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSurveys()
  }, [user, router])

  const getProvinceName = (code: string) => {
    const provinces: Record<string, string> = {
      ab: "Alberta",
      bc: "British Columbia",
      mb: "Manitoba",
      nb: "New Brunswick",
      nl: "Newfoundland and Labrador",
      ns: "Nova Scotia",
      nt: "Northwest Territories",
      nu: "Nunavut",
      on: "Ontario",
      pe: "Prince Edward Island",
      qc: "Quebec",
      sk: "Saskatchewan",
      yt: "Yukon",
    }
    return provinces[code] || code
  }

  const formatDate = (dateString: string, timezone: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        console.error('Invalid date string:', dateString)
        return 'Invalid date'
      }
      return date.toLocaleString('en-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Error formatting date'
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Survey History</h1>
        <Button onClick={() => router.push("/survey")}>Take New Survey</Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading survey history...</div>
      ) : surveys.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg mb-4">No survey submissions found</p>
          <Button onClick={() => router.push("/survey")}>Take Your First Survey</Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {surveys.map((survey) => (
            <Card key={survey.id}>
              <CardHeader>
                <CardTitle>Survey Submission</CardTitle>
                <CardDescription>Submitted on {formatDate(survey.timestamp, survey.timezone)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold">Age</p>
                    <p>{survey.age}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Postal Code</p>
                    <p>{survey.postalCode}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Organization</p>
                    <p>{survey.organization}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Organization Type</p>
                    <p>{survey.organizationType}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Province</p>
                    <p>{getProvinceName(survey.province)}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Symptoms</p>
                    <p>{survey.symptoms}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 