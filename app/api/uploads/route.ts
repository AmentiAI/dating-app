import { getDownloadUrl, put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are allowed." }, { status: 400 });
    }

    const allowed = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
    if (!allowed.has(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: "Please upload JPG, PNG, or WEBP images from your camera roll." },
        { status: 400 }
      );
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `profiles/${Date.now()}-${safeName}`;

    const blob = await put(key, file, {
      access: "private",
      addRandomSuffix: true
    });

    const viewUrl = `/api/uploads?url=${encodeURIComponent(blob.url)}&v=${Date.now()}`;
    return NextResponse.json({ url: blob.url, viewUrl, pathname: blob.pathname });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const blobUrl = searchParams.get("url");
  if (!blobUrl || !/^https?:\/\//i.test(blobUrl)) {
    return NextResponse.json({ error: "Invalid blob URL." }, { status: 400 });
  }

  try {
    const downloadUrl = getDownloadUrl(blobUrl);
    const upstream = await fetch(downloadUrl, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Unable to fetch image from storage." }, { status: 502 });
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load image.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
