import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

// Increase the response size limit for video streaming
export const maxDuration = 60;

const VIDEO_PATH = path.join(
    process.cwd(),
    "..",
    "video_results",
    "advanced_player_tracking_output.mp4"
);

export async function GET(request: NextRequest) {
    if (!fs.existsSync(VIDEO_PATH)) {
        console.error("Video file not found at:", VIDEO_PATH);
        return new NextResponse("Video not found", { status: 404 });
    }

    const stats = fs.statSync(VIDEO_PATH);
    const fileSize = stats.size;
    const range = request.headers.get("range");

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1]
            ? parseInt(parts[1], 10)
            : Math.min(start + 5 * 1024 * 1024 - 1, fileSize - 1); // 5MB max chunk

        if (start >= fileSize) {
            return new NextResponse("Requested range not satisfiable", {
                status: 416,
                headers: { "Content-Range": `bytes */${fileSize}` },
            });
        }

        const chunkSize = end - start + 1;

        const stream = new ReadableStream({
            start(controller) {
                const fileStream = fs.createReadStream(VIDEO_PATH, {
                    start,
                    end,
                });
                fileStream.on("data", (chunk: Buffer) => {
                    controller.enqueue(new Uint8Array(chunk));
                });
                fileStream.on("end", () => {
                    controller.close();
                });
                fileStream.on("error", (err) => {
                    controller.error(err);
                });
            },
        });

        return new NextResponse(stream, {
            status: 206,
            headers: {
                "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": chunkSize.toString(),
                "Content-Type": "video/mp4",
                "Cache-Control": "no-cache",
            },
        });
    } else {
        // For non-range requests, respond with a 200 but tell the browser to use range requests
        // by sending the first chunk and advertising range support
        const stream = new ReadableStream({
            start(controller) {
                const fileStream = fs.createReadStream(VIDEO_PATH);
                fileStream.on("data", (chunk: Buffer) => {
                    controller.enqueue(new Uint8Array(chunk));
                });
                fileStream.on("end", () => {
                    controller.close();
                });
                fileStream.on("error", (err) => {
                    controller.error(err);
                });
            },
        });

        return new NextResponse(stream, {
            status: 200,
            headers: {
                "Content-Length": fileSize.toString(),
                "Content-Type": "video/mp4",
                "Accept-Ranges": "bytes",
                "Cache-Control": "no-cache",
            },
        });
    }
}
