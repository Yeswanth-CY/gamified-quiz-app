"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Key, RefreshCw } from "lucide-react"

export default function AdminPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-purple-50 to-purple-100">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-purple-800">Admin Dashboard</h1>
            <p className="text-purple-600">Manage your quiz app settings</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              Back to Quiz
            </Button>
          </Link>
        </div>

        <div className="grid gap-6">
          <Card className="shadow-lg border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-purple-600" />
                API Key Validator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 mb-4">Check if your Gemini API key is valid and working correctly.</p>
                <div id="api-status" className="p-4 bg-gray-100 rounded-lg min-h-16 flex items-center justify-center">
                  <p className="text-gray-500">Click the button below to check API key status</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                id="validate-btn"
                className="bg-purple-700 hover:bg-purple-800 w-full"
                onClick={() => {
                  const statusEl = document.getElementById("api-status")
                  const btnEl = document.getElementById("validate-btn")

                  if (statusEl && btnEl) {
                    statusEl.innerHTML = `
                      <div class="flex items-center gap-2">
                        <div class="animate-spin h-5 w-5 text-purple-600"></div>
                        <p>Validating API key...</p>
                      </div>
                    `

                    btnEl.setAttribute("disabled", "true")

                    fetch("/api/validate-key")
                      .then((res) => res.json())
                      .then((data) => {
                        if (data.valid) {
                          statusEl.innerHTML = `
                            <div class="flex items-center gap-2 text-green-600">
                              <CheckCircle class="h-5 w-5" />
                              <div>
                                <p class="font-medium">API key is valid</p>
                                <p class="text-sm text-green-500">Response: ${data.response || "OK"}</p>
                              </div>
                            </div>
                          `
                        } else {
                          statusEl.innerHTML = `
                            <div class="flex items-center gap-2 text-red-600">
                              <AlertTriangle class="h-5 w-5" />
                              <div>
                                <p class="font-medium">${data.message || "API key is invalid"}</p>
                                <p class="text-sm text-red-500">${data.details || ""}</p>
                              </div>
                            </div>
                          `
                        }
                      })
                      .catch((err) => {
                        statusEl.innerHTML = `
                          <div class="flex items-center gap-2 text-red-600">
                            <AlertTriangle class="h-5 w-5" />
                            <p>Error checking API key: ${err.message}</p>
                          </div>
                        `
                      })
                      .finally(() => {
                        btnEl.removeAttribute("disabled")
                      })
                  }
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Validate API Key
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  )
}
