import { print } from "graphql";
import { gql } from "graphql-tag";
import Link from "next/link";

// The same GraphQL query structure the customer is familiar with
const GET_PRODUCTS = gql`
  query GetProducts($collection: String) {
    products(collection: $collection) {
      id
      title
      handle
      description
      availableForSale
      featuredImage {
        url
        altText
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
    }
  }
`;

// Server-side GraphQL fetch - no Apollo Client needed!
async function fetchGraphQL<T>(
  query: ReturnType<typeof gql>,
  variables?: Record<string, unknown>
): Promise<T> {
  // In production, use absolute URL or environment variable
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  const response = await fetch(`${baseUrl}/api/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: print(query),
      variables,
    }),
  });

  const json = await response.json();

  if (json.errors) {
    console.error("GraphQL errors:", json.errors);
    throw new Error(json.errors[0]?.message || "GraphQL error");
  }

  return json.data;
}

type Product = {
  id: string;
  title: string;
  handle: string;
  description: string;
  availableForSale: boolean;
  featuredImage: {
    url: string;
    altText: string;
  };
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
};

export default async function GraphQLDemoPage() {
  // Server-side data fetching - this runs on the server, not in the browser!
  const data = await fetchGraphQL<{ products: Product[] }>(GET_PRODUCTS, {
    collection: "mens", // Using "mens" collection from SFCC
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h1 className="mb-2 text-3xl font-bold text-blue-900">
          GraphQL Demo - Server-Side Fetching
        </h1>
        <p className="text-blue-700">
          This page demonstrates GraphQL queries executed <strong>on the server</strong>. 
          No Apollo Client bundle is sent to the browser. The data below was fetched 
          server-side using the same GraphQL query syntax you&apos;re already using.
        </p>
        <div className="mt-4 rounded bg-blue-100 p-3 font-mono text-sm text-blue-800">
          <strong>How it works:</strong> React Server Component → GraphQL API Route → SFCC REST API
        </div>
      </div>

      {/* Comparison links */}
      <div className="mb-6 flex gap-4">
        <Link
          href="/graphql-demo/client-side"
          className="rounded-lg bg-orange-600 px-4 py-2 font-medium text-white hover:bg-orange-700"
        >
          Compare: Client-Side (Old) →
        </Link>
        <span className="flex items-center text-sm text-gray-500">
          See the loading skeleton delay with client-side fetching
        </span>
      </div>

      {/* Products Grid */}
      <h2 className="mb-4 text-xl font-semibold">
        Products ({data.products.length} loaded via GraphQL)
      </h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.products.map((product) => (
          <div
            key={product.id}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            {/* Product Image */}
            <div className="aspect-square bg-gray-100">
              {product.featuredImage?.url ? (
                <img
                  src={product.featuredImage.url}
                  alt={product.featuredImage.altText || product.title}
                  className="h-full w-full object-contain p-4"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  No image
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="p-4">
              <h3 className="mb-1 line-clamp-2 font-medium text-gray-900">
                {product.title}
              </h3>

              <p className="mb-2 text-lg font-bold text-blue-600">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: product.priceRange.minVariantPrice.currencyCode,
                }).format(Number(product.priceRange.minVariantPrice.amount))}
              </p>

              <div className="flex items-center justify-between">
                <span
                  className={`text-sm ${
                    product.availableForSale
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {product.availableForSale ? "In Stock" : "Out of Stock"}
                </span>

                <Link
                  href={`/product/${product.handle}`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  View Details →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Back Link */}
      <div className="mt-8">
        <Link
          href="/"
          className="text-blue-600 hover:underline"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
