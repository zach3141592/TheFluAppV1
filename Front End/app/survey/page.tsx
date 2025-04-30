"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const submissionLock = useRef(false)
  const { user } = useAuth()

  // Prevent form submission if already submitting
  useEffect(() => {
    const form = formRef.current
    if (!form) return

    const handleSubmit = (e: SubmitEvent) => {
      if (isSubmitting || submissionLock.current) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        return false
      }
    }

    form.addEventListener('submit', handleSubmit, true)
    return () => form.removeEventListener('submit', handleSubmit, true)
  }, [isSubmitting])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    // For age input, prevent negative values and values over 120
    if (name === "age") {
      const ageValue = parseInt(value)
      if (isNaN(ageValue) || ageValue < 0 || ageValue > 120) {
        return
      }
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Error",
        description: "You must be signed in to submit a survey",
        variant: "destructive",
      })
      router.push("/signin")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("http://localhost:8000/api/survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          age: parseInt(formData.age),
          userEmail: user.email,
          submissionId: crypto.randomUUID(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to submit survey")
      }

      toast({
        title: "Success",
        description: "Survey submitted successfully",
      })
      setHasSubmitted(true)
      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit survey",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
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
        <form ref={formRef} onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                name="age"
                type="number"
                min="0"
                max="120"
                placeholder="Enter your age (0-120)"
                value={formData.age}
                onChange={handleChange}
                required
              />
              <p className="text-sm text-gray-500">Please enter an age between 0 and 120</p>
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
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                if (isSubmitting || submissionLock.current) {
                  e.preventDefault()
                  e.stopPropagation()
                }
              }}
            >
              {isSubmitting ? "Submitting..." : "Submit Survey"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
