import { gql } from "graphql-tag";
import { executeGraphQL } from "lib/graphql/execute";
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
  // Direct GraphQL execution - works at BUILD TIME for static generation!
  // No HTTP fetch, no running server needed.
  const data = await executeGraphQL<{ products: Product[] }>(GET_PRODUCTS, {
    collection: "mens",
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 rounded-lg border border-green-200 bg-green-50 p-6">
        <h1 className="mb-2 text-3xl font-bold text-green-900">
          GraphQL Demo - Static Generation
        </h1>
        <p className="text-green-700">
          This page uses GraphQL queries executed at <strong>build time</strong>.
          The data is fetched during static generation - no runtime server needed.
          This page is fully static HTML with embedded data.
        </p>
        <div className="mt-4 rounded bg-green-100 p-3 font-mono text-sm text-green-800">
          <strong>How it works:</strong> Build Time → GraphQL Schema → Resolvers → SFCC REST API → Static HTML
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
        Products ({data.products.length} loaded via GraphQL at build time)
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

              <p className="mb-2 text-lg font-bold text-green-600">
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
                  className="text-sm font-medium text-green-600 hover:underline"
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
          className="text-green-600 hover:underline"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
