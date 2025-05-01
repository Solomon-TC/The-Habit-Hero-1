import { NextRequest, NextResponse } from "next/server";

// This API endpoint has been deprecated as part of the new friend system implementation
// It previously provided debugging information for the friend system

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      message:
        "This endpoint has been deprecated. Please use the new friend system.",
    },
    { status: 200 },
  );
}
