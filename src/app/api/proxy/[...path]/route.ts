import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL?.replace(/\/admin\/catalog\/?$/, "") ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://65.1.135.224:3001";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;

  const backendPath = path.join("/");
  const search = request.nextUrl.search;
  const targetUrl = `${BACKEND_URL.replace(/\/$/, "")}/${backendPath}${search}`;

  const headers = new Headers();

  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");

  if (authorization) headers.set("authorization", authorization);
  if (contentType) headers.set("content-type", contentType);
  if (accept) headers.set("accept", accept);

  let body: BodyInit | undefined;

  if (request.method !== "GET" && request.method !== "HEAD") {
    const text = await request.text();
    body = text || undefined;
  }

  try {
    const backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });

    const responseText = await backendResponse.text();

    return new NextResponse(responseText, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: {
        "content-type":
          backendResponse.headers.get("content-type") ||
          "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Backend proxy request failed",
        targetUrl,
      },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}