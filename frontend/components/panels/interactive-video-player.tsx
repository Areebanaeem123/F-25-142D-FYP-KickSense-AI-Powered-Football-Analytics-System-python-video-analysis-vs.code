"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Play, Pause, Maximize, Loader2 } from "lucide-react"

interface TrackingPoint {
    track_id: number
    x: number
    y: number
    timestamp: number
}

interface InteractiveVideoPlayerProps {
    videoSrc: string
    matchId: number
    onPlayerSelect: (trackId: number) => void
}

export function InteractiveVideoPlayer({
    videoSrc,
    matchId,
    onPlayerSelect,
}: InteractiveVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const [isPlaying, setIsPlaying] = useState(false)
    const [loading, setLoading] = useState(true)
    const [trackingData, setTrackingData] = useState<TrackingPoint[]>([])
    const [currentTime, setCurrentTime] = useState(0)
    const [hoveredPlayer, setHoveredPlayer] = useState<number | null>(null)

    // Fetch tracking data
    useEffect(() => {
        const fetchTrackingData = async () => {
            try {
                const res = await fetch(`/api/tracking-data?match_id=${matchId}`)
                if (res.ok) {
                    const data = await res.json()
                    setTrackingData(data)
                }
            } catch (error) {
                console.error("Failed to load tracking data", error)
            } finally {
                setLoading(false)
            }
        }
        fetchTrackingData()
    }, [matchId])

    // Draw overlay
    const drawOverlay = useCallback(() => {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Sync canvas size
        if (canvas.width !== video.clientWidth || canvas.height !== video.clientHeight) {
            canvas.width = video.clientWidth
            canvas.height = video.clientHeight
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Find detections for current frame (within 0.1s window)
        // Assuming 1920x1080 normalized coordinates if not, adjust scaling
        // The tracking data likely has pixel coordinates from the original video.
        // We need to scale them to the current video display size.
        // Original video is typically 1920x1080 or 1280x720. 
        // Let's assume the DB stores pixel coordinates and we scale based on video.videoWidth/Height

        // NOTE: If x_coord/y_coord are normalized (0-1), multiply by canvas.width/height.
        // If they are absolute pixels, we need the original video dimensions.
        // Since we don't know for sure, let's assume they are absolute pixels corresponding to the video resolution.

        const scaleX = canvas.width / video.videoWidth
        const scaleY = canvas.height / video.videoHeight

        const currentFrameData = trackingData.filter(
            (p) => Math.abs(p.timestamp - video.currentTime) < 0.05
        )

        currentFrameData.forEach((p) => {
            const x = p.x * scaleX
            const y = p.y * scaleY
            const radius = 20 * scaleX // Approximate player size

            // Draw bounding box or circle
            ctx.beginPath()
            if (p.track_id === hoveredPlayer) {
                ctx.strokeStyle = "#14B871"
                ctx.lineWidth = 3
                ctx.fillStyle = "rgba(20, 184, 113, 0.3)"
            } else {
                ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
                ctx.lineWidth = 1
                ctx.fillStyle = "rgba(0, 0, 0, 0)"
            }

            // Draw bottom center marker (standard for player tracking)
            ctx.arc(x, y, radius, 0, 2 * Math.PI)
            ctx.fill()
            ctx.stroke()

            // Draw ID
            if (p.track_id === hoveredPlayer) {
                ctx.fillStyle = "white"
                ctx.font = "bold 12px Inter"
                ctx.fillText(`P${p.track_id}`, x - 10, y - radius - 5)
            }
        })
    }, [trackingData, hoveredPlayer])

    // Animation Loop
    useEffect(() => {
        let animationFrameId: number

        const render = () => {
            if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime)
                drawOverlay()
            }
            animationFrameId = requestAnimationFrame(render)
        }

        render()
        return () => cancelAnimationFrame(animationFrameId)
    }, [drawOverlay])

    // Handle Interactions
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        const video = videoRef.current
        if (!canvas || !video) return

        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        const scaleX = canvas.width / video.videoWidth
        const scaleY = canvas.height / video.videoHeight

        // Find clicked player
        const clicked = trackingData.find((p) => {
            if (Math.abs(p.timestamp - video.currentTime) > 0.05) return false

            const px = p.x * scaleX
            const py = p.y * scaleY
            const radius = 30 * scaleX // Click target size

            const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2)
            return dist < radius
        })

        if (clicked) {
            onPlayerSelect(clicked.track_id)
        } else {
            // Toggle play/pause if no player clicked
            togglePlay()
        }
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        const video = videoRef.current
        if (!canvas || !video) return

        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        const scaleX = canvas.width / video.videoWidth
        const scaleY = canvas.height / video.videoHeight

        const hovered = trackingData.find((p) => {
            if (Math.abs(p.timestamp - video.currentTime) > 0.05) return false
            const px = p.x * scaleX
            const py = p.y * scaleY
            const radius = 30 * scaleX // Hover target size
            const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2)
            return dist < radius
        })

        setHoveredPlayer(hovered ? hovered.track_id : null)
        canvas.style.cursor = hovered ? "pointer" : "default"
    }

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause()
            } else {
                videoRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    return (
        <div ref={containerRef} className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden group">
            {/* Video */}
            <video
                ref={videoRef}
                src={videoSrc}
                className="w-full h-full object-contain"
                onEnded={() => setIsPlaying(false)}
                playsInline
            />

            {/* Overlay Canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full z-10"
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
            />

            {/* Loading State */}
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                    <Loader2 className="w-8 h-8 text-[#14B871] animate-spin" />
                </div>
            )}

            {/* Controls Overlay (visible on hover or pause) */}
            <div
                className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-300 pointer-events-none z-20 ${isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
                    }`}
            >
                {!isPlaying && !loading && (
                    <div className="w-16 h-16 rounded-full bg-[#14B871]/90 flex items-center justify-center shadow-lg backdrop-blur-sm pointer-events-auto cursor-pointer transition-transform hover:scale-110" onClick={togglePlay}>
                        <Play fill="white" className="w-8 h-8 text-white ml-1" />
                    </div>
                )}
            </div>

            {/* Bottom Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center justify-between pointer-events-auto">
                    <button onClick={togglePlay} className="text-white hover:text-[#14B871] transition-colors">
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </button>
                    <div className="text-xs text-[#9cb8a9] font-mono">
                        {videoRef.current ? Math.round(videoRef.current.currentTime) : 0}s
                    </div>
                </div>
            </div>
        </div>
    )
}
