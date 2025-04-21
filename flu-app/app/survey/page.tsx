"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

export default function SurveyPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    age: "",
    postalCode: "",
    organization: "",
    organizationType: "school",
    symptoms: "none",
    province: "on",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!formData.age || !formData.postalCode || !formData.organization || !formData.province) {
      toast({
        title: "Error",
        description: "Please fill out all required fields",
        variant: "destructive",
      })
      return
    }

    // Validate Canadian postal code format (A1A 1A1)
    const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/
    if (!postalCodeRegex.test(formData.postalCode)) {
      toast({
        title: "Error",
        description: "Please enter a valid Canadian postal code (e.g., A1A 1A1)",
        variant: "destructive",
      })
      return
    }

    // In a real app, we would submit this data to a backend
    console.log("Form submitted:", formData)

    toast({
      title: "Survey Submitted",
      description: "Thank you for contributing to our flu tracking efforts!",
    })

    // Redirect back to home page
    setTimeout(() => router.push("/"), 1500)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Flu Survey</h1>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Help Us Track Flu Activity</CardTitle>
          <CardDescription>
            Your responses help us monitor flu trends across Canada and provide better community guidance
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                name="age"
                type="number"
                placeholder="Enter your age"
                value={formData.age}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="province">Province/Territory</Label>
              <Select value={formData.province} onValueChange={(value) => handleSelectChange("province", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ab">Alberta</SelectItem>
                  <SelectItem value="bc">British Columbia</SelectItem>
                  <SelectItem value="mb">Manitoba</SelectItem>
                  <SelectItem value="nb">New Brunswick</SelectItem>
                  <SelectItem value="nl">Newfoundland and Labrador</SelectItem>
                  <SelectItem value="ns">Nova Scotia</SelectItem>
                  <SelectItem value="nt">Northwest Territories</SelectItem>
                  <SelectItem value="nu">Nunavut</SelectItem>
                  <SelectItem value="on">Ontario</SelectItem>
                  <SelectItem value="pe">Prince Edward Island</SelectItem>
                  <SelectItem value="qc">Quebec</SelectItem>
                  <SelectItem value="sk">Saskatchewan</SelectItem>
                  <SelectItem value="yt">Yukon</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                name="postalCode"
                placeholder="Enter your postal code (e.g., A1A 1A1)"
                value={formData.postalCode}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationType">I attend/work at a:</Label>
              <Select
                value={formData.organizationType}
                onValueChange={(value) => handleSelectChange("organizationType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select organization type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">School</SelectItem>
                  <SelectItem value="university">University/College</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="healthcare">Healthcare Facility</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization">
                {formData.organizationType === "school" || formData.organizationType === "university"
                  ? "School/University Name"
                  : "Company/Organization Name"}
              </Label>
              <Input
                id="organization"
                name="organization"
                placeholder="Enter organization name"
                value={formData.organization}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Are you experiencing any flu-like symptoms?</Label>
              <RadioGroup value={formData.symptoms} onValueChange={(value) => handleSelectChange("symptoms", value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="none" />
                  <Label htmlFor="none">No symptoms</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mild" id="mild" />
                  <Label htmlFor="mild">Mild symptoms (slight cough, low fever)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="moderate" id="moderate" />
                  <Label htmlFor="moderate">Moderate symptoms (fever, cough, fatigue)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="severe" id="severe" />
                  <Label htmlFor="severe">Severe symptoms (high fever, severe cough, difficulty breathing)</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Submit Survey
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
