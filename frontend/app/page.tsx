"use client"

import { useState } from "react"
import { Homepage } from "@/components/homepage"
import { Dashboard } from "@/components/dashboard"
import { VideoUpload } from "@/components/analysis/video-upload"
import { AnalysisLoading } from "@/components/analysis/analysis-loading"

type Stage = "landing" | "upload" | "loading" | "dashboard"

export default function Page() {
  const [stage, setStage] = useState<Stage>("landing")

  const handleGetStarted = () => setStage("upload")
  const handleAnalyze = (file: File) => {
    console.log("Analyzing file:", file.name)
    setStage("loading")
  }
  const handleLoadingComplete = () => setStage("dashboard")
  const handleBack = () => setStage("landing")

  switch (stage) {
    case "landing":
      return <Homepage onGetStarted={handleGetStarted} />
    case "upload":
      return <VideoUpload onAnalyze={handleAnalyze} onBack={handleBack} />
    case "loading":
      return <AnalysisLoading onComplete={handleLoadingComplete} />
    case "dashboard":
      return <Dashboard onBack={handleBack} />
    default:
      return <Homepage onGetStarted={handleGetStarted} />
  }
}

