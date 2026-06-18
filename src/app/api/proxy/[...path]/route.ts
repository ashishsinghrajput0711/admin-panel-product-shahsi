import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_API_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_ADMIN_API_URL?.replace(/\/$/, "") ||
  "http://65.1.135.224:3001";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

function buildTargetUrl(path: string[], search: string) {
  const backendPath = path.join("/");

  return `${BACKEND_URL}/${backendPath}${search}`;
}

function shouldSkipHeader(headerName: string) {
  const name = headerName.toLowerCase();

  return (
    name === "host" ||
    name === "connection" ||
    name === "content-length" ||
    name === "accept-encoding" ||
    name === "x-forwarded-host" ||
    name === "x-forwarded-proto" ||
    name === "x-forwarded-for"
  );
}

function buildForwardHeaders(request: NextRequest, hasBody: boolean) {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    if (shouldSkipHeader(key)) return;

    headers.set(key, value);
  });

  if (!hasBody) {
    headers.delete("content-type");
  }

  return headers;
}

async function getForwardBody(request: NextRequest): Promise<BodyInit | undefined> {
  if (request.method === "GET" || request.method === "HEAD") {
    return undefined;
  }

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    return request.formData();
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return request.text();
  }

  if (contentType.includes("application/json")) {
    return request.text();
  }

  const arrayBuffer = await request.arrayBuffer();

  if (!arrayBuffer.byteLength) return undefined;

  return arrayBuffer;
}

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;

  const targetUrl = buildTargetUrl(path, request.nextUrl.search);

  if (targetUrl.includes("/api/proxy")) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Proxy configuration error: BACKEND_API_URL must point to backend server, not /api/proxy.",
        targetUrl,
      },
      { status: 500 }
    );
  }

  try {
    const body = await getForwardBody(request);
    const headers = buildForwardHeaders(request, Boolean(body));

    if (body instanceof FormData) {
      headers.delete("content-type");
    }

    const backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });

    const responseHeaders = new Headers();

    const contentType = backendResponse.headers.get("content-type");
    if (contentType) {
      responseHeaders.set("content-type", contentType);
    }

    const setCookie = backendResponse.headers.get("set-cookie");
    if (setCookie) {
      responseHeaders.set("set-cookie", setCookie);
    }

    const responseBody = await backendResponse.arrayBuffer();

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
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