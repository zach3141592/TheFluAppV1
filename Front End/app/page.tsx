import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RiskMeter } from "@/components/risk-meter"
import { CitySearch } from "@/components/city-search"
import { FluMap } from "@/components/flu-map"
import { RiskPrediction } from "@/components/risk-prediction"

// Fallback data in case backend is not available
const FALLBACK_DATA = {
  national_risk: 0,
  provincial_risks: {
    AB: 0, BC: 0, MB: 0, NB: 0, NL: 0, NS: 0,
    NT: 0, NU: 0, ON: 0, PE: 0, QC: 0, SK: 0, YT: 0
  },
  current_city_risks: {
    toronto: 0,
    montreal: 0,
    vancouver: 0,
    calgary: 0,
    edmonton: 0,
    ottawa: 0,
    winnipeg: 0,
    halifax: 0
  },
  future_risks: {
    toronto: {} as Record<string, number>,
    montreal: {} as Record<string, number>,
    vancouver: {} as Record<string, number>,
    calgary: {} as Record<string, number>,
    edmonton: {} as Record<string, number>,
    ottawa: {} as Record<string, number>,
    winnipeg: {} as Record<string, number>,
    halifax: {} as Record<string, number>
  }
}

// Generate dates for the next 7 days
const today = new Date()
for (let i = 0; i < 7; i++) {
  const date = new Date(today)
  date.setDate(today.getDate() + i)
  const dateStr = date.toISOString().split('T')[0]
  
  // Add predictions for each city
  FALLBACK_DATA.future_risks.toronto[dateStr] = 0
  FALLBACK_DATA.future_risks.montreal[dateStr] = 0
  FALLBACK_DATA.future_risks.vancouver[dateStr] = 0
  FALLBACK_DATA.future_risks.calgary[dateStr] = 0
  FALLBACK_DATA.future_risks.edmonton[dateStr] = 0
  FALLBACK_DATA.future_risks.ottawa[dateStr] = 0
  FALLBACK_DATA.future_risks.winnipeg[dateStr] = 0
  FALLBACK_DATA.future_risks.halifax[dateStr] = 0
}

interface FutureRisks {
  [date: string]: number;
}

interface LocationData {
  [location: string]: number;
}

async function getFluRiskData() {
  try {
    // First get all available locations
    const locationsRes = await fetch('http://127.0.0.1:8000/api/locations', { 
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    })
    
    if (!locationsRes.ok) {
      console.warn('Failed to fetch locations:', locationsRes.status)
      return FALLBACK_DATA
    }
    
    const locations = await locationsRes.json()
    
    // Fetch data for each location
    const locationData = await Promise.all(
      locations.map(async (location: string) => {
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/flu-risk/${location}`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(5000)
          })
          if (!res.ok) {
            console.warn(`Failed to fetch data for ${location}:`, res.status)
            return null
          }
          return res.json()
        } catch (error) {
          console.warn(`Error fetching data for ${location}:`, error)
          return null
        }
      })
    )
    
    // Combine the data into the expected format
    const combinedData = {
      // Calculate national risk as average of all city risks
      national_risk: locationData
        .filter(data => data !== null)
        .reduce((sum, data) => sum + (data?.current_risk || 0), 0) / 
        locationData.filter(data => data !== null).length || 0,
      
      // Calculate provincial risks by averaging risks for cities within each province
      provincial_risks: locations.reduce((acc: Record<string, { sum: number; count: number }>, location: string, index: number) => {
        const data = locationData[index];
        if (!data) return acc;
        
        const cityToProvince: Record<string, string> = {
          'toronto': 'ON',
          'montreal': 'QC',
          'vancouver': 'BC',
          'calgary': 'AB',
          'edmonton': 'AB',
          'ottawa': 'ON',
          'winnipeg': 'MB',
          'halifax': 'NS',
          'quebec city': 'QC',
          'hamilton': 'ON',
          'london': 'ON',
          'saskatoon': 'SK',
          'regina': 'SK',
          'st. john\'s': 'NL',
          'kelowna': 'BC'
        };
        
        const province = cityToProvince[location.toLowerCase()];
        if (province) {
          if (!acc[province]) {
            acc[province] = { sum: 0, count: 0 };
          }
          acc[province].sum += data.current_risk || 0;
          acc[province].count += 1;
        }
        return acc;
      }, {} as Record<string, { sum: number; count: number }>),
      
      current_city_risks: Object.fromEntries(
        locations.map((location: string, index: number) => {
          const data = locationData[index]
          if (!data) return [location.toLowerCase(), 0]
          return [location.toLowerCase(), data.current_risk]
        })
      ),
      future_risks: Object.fromEntries(
        locations.map((location: string, index: number) => {
          const data = locationData[index]
          if (!data) return [location.toLowerCase(), {}]
          return [location.toLowerCase(), data.future_risks]
        })
      )
    }

    // Initialize all provinces with 0 risk
    const allProvinces = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];
    const finalProvincialRisks = allProvinces.reduce((acc, province) => {
      acc[province] = 0;
      return acc;
    }, {} as Record<string, number>);

    // Calculate averages for provinces with data
    (Object.entries(combinedData.provincial_risks) as [string, { sum: number; count: number }][]).forEach(([province, data]) => {
      if (data.count > 0) {
        finalProvincialRisks[province] = data.sum / data.count;
      }
    });

    return {
      ...combinedData,
      provincial_risks: finalProvincialRisks
    };
  } catch (error) {
    console.warn('Failed to fetch flu risk data from backend:', error)
    return FALLBACK_DATA
  }
}

export default async function HomePage() {
  const fluRiskData = await getFluRiskData()
  console.log('Flu Risk Data:', fluRiskData)
  const nationalRisk = fluRiskData.national_risk
  const riskLevel = nationalRisk <= 3 ? 'Low' : nationalRisk <= 6 ? 'Moderate' : nationalRisk <= 8 ? 'High' : 'Very High'

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">The Flu App</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Current Flu Risk Index</CardTitle>
            <CardDescription>
              National flu activity level based on Public Health Agency of Canada surveillance data
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <RiskMeter value={nationalRisk} />
            <div className="mt-16 text-center">
              <h2 className={`text-2xl font-bold ${
                nationalRisk <= 3 ? 'text-green-500' :
                nationalRisk <= 6 ? 'text-yellow-500' :
                nationalRisk <= 8 ? 'text-orange-500' : 'text-red-500'
              }`}>{riskLevel} Risk</h2>
              <p className="mt-2 text-gray-600 max-w-2xl">
                Flu activity is currently {riskLevel.toLowerCase()} across Canada. Consider getting your flu shot, practicing good hand
                hygiene, and staying home if you feel unwell to prevent spreading illness.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/survey">
              <Button>Take Our Flu Survey</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Check Your Local Risk</CardTitle>
            <CardDescription>Search for your city to see the current flu risk in your area</CardDescription>
          </CardHeader>
          <CardContent>
            <CitySearch cityRisks={fluRiskData.current_city_risks} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Provincial Risk Levels</CardTitle>
            <CardDescription>Current flu activity levels across Canada</CardDescription>
          </CardHeader>
          <CardContent>
            <FluMap provincialRisks={fluRiskData.provincial_risks} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <RiskPrediction futureRisks={fluRiskData.future_risks} />
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recommended Precautions</CardTitle>
            <CardDescription>Based on the current risk level ({riskLevel})</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>Get your annual flu shot if you haven't already</li>
              <li>Wash hands frequently with soap and water for at least 20 seconds</li>
              <li>Use alcohol-based hand sanitizers when soap and water are not available</li>
              <li>Cover your mouth and nose with a tissue when coughing or sneezing</li>
              <li>Stay home when you're feeling unwell to avoid spreading illness to others</li>
              <li>Clean and disinfect frequently touched surfaces</li>
              <li>Consider wearing a mask in crowded indoor settings during peak flu season</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
