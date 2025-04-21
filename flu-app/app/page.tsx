import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RiskMeter } from "@/components/risk-meter"
import { CitySearch } from "@/components/city-search"
import { FluMap } from "@/components/flu-map"

export default function HomePage() {
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
            <RiskMeter value={6} />
            <div className="mt-16 text-center">
              <h2 className="text-2xl font-bold text-yellow-500">Moderate Risk</h2>
              <p className="mt-2 text-gray-600 max-w-2xl">
                Flu activity is currently moderate across Canada. Consider getting your flu shot, practicing good hand
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
            <CitySearch />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Flu Activity Map</CardTitle>
            <CardDescription>Current flu activity levels across Canada</CardDescription>
          </CardHeader>
          <CardContent>
            <FluMap />
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recommended Precautions</CardTitle>
            <CardDescription>Based on the current risk level (Moderate)</CardDescription>
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
