import { DocumentNode, execute, ExecutionResult } from "graphql";
import { schema } from "./schema";

/**
 * Execute a GraphQL query directly against the schema.
 * This works at BUILD TIME - no HTTP server needed.
 *
 * Use this in React Server Components for static generation.
 */
export async function executeGraphQL<TData = unknown>(
  query: DocumentNode,
  variables?: Record<string, unknown>
): Promise<TData> {
  const result = (await execute({
    schema,
    document: query,
    variableValues: variables,
  })) as ExecutionResult<TData>;

  if (result.errors) {
    console.error("GraphQL errors:", result.errors);
    throw new Error(result.errors.map((e) => e.message).join(", "));
  }

  return result.data as TData;
}
