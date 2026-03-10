"use client"

import { useState } from "react"
import { Homepage } from "@/components/homepage"
import { Dashboard } from "@/components/dashboard"

export default function Page() {
  const [started, setStarted] = useState(false)

  if (started) {
    return <Dashboard />
  }

  return <Homepage onGetStarted={() => setStarted(true)} />
}
