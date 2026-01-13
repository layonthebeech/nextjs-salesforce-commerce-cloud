import { execute } from "graphql";
import { NextRequest } from "next/server";
import { schema } from "lib/graphql/schema";
import { parse } from "graphql";

// Helper to simulate network latency for demo purposes
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function handleGraphQLRequest(request: NextRequest) {
  const body = await request.json();

  // Check for simulateDelay in variables (for client-side demo)
  if (body.variables?.simulateDelay) {
    await delay(2000);
  }

  const result = await execute({
    schema,
    document: parse(body.query),
    variableValues: body.variables,
    operationName: body.operationName,
  });

  return Response.json(result);
}

export async function GET(request: NextRequest) {
  return handleGraphQLRequest(request);
}

export async function POST(request: NextRequest) {
  return handleGraphQLRequest(request);
}
