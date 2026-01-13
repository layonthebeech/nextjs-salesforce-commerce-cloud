"use client";

import { gql } from "@apollo/client/core";
import { useQuery } from "@apollo/client/react";
import Link from "next/link";
import { useEffect, useState } from "react";

const GET_PRODUCTS = gql`
  query GetProducts($collection: String, $simulateDelay: Boolean) {
    products(collection: $collection, simulateDelay: $simulateDelay) {
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
  } | null;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
};

// Skeleton component for loading state
function ProductSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="aspect-square bg-gray-200" />
      <div className="p-4">
        <div className="mb-2 h-5 w-3/4 rounded bg-gray-200" />
        <div className="mb-2 h-6 w-1/2 rounded bg-gray-200" />
        <div className="h-4 w-1/4 rounded bg-gray-200" />
      </div>
    </div>
  );
}

function ProductGrid() {
  const [loadingTime, setLoadingTime] = useState(0);
  const [startTime] = useState(Date.now());

  const { loading, error, data } = useQuery<{ products: Product[] }>(
    GET_PRODUCTS,
    {
      variables: { collection: "mens", simulateDelay: true },
    }
  );

  // Track loading time
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingTime(Date.now() - startTime);
      }, 10);
      return () => clearInterval(interval);
    }
  }, [loading, startTime]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-700">Error: {error.message}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <>
        {/* Loading timer */}
        <div className="mb-6 rounded-lg border-2 border-orange-300 bg-orange-50 p-4">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            <span className="font-mono text-lg font-bold text-orange-700">
              Loading: {(loadingTime / 1000).toFixed(2)}s
            </span>
          </div>
          <p className="mt-2 text-sm text-orange-600">
            User is seeing skeleton placeholders while GraphQL fetches data in
            the browser...
          </p>
        </div>

        {/* Skeleton grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      </>
    );
  }

  const products = data?.products || [];
  const finalLoadTime = loadingTime;

  return (
    <>
      {/* Loaded indicator */}
      <div className="mb-6 rounded-lg border-2 border-green-300 bg-green-50 p-4">
        <p className="font-mono text-lg font-bold text-green-700">
          Data loaded after {(finalLoadTime / 1000).toFixed(2)}s
        </p>
        <p className="mt-1 text-sm text-green-600">
          This delay happened AFTER the page HTML arrived. Users saw skeletons
          during this time.
        </p>
      </div>

      {/* Products grid */}
      <h2 className="mb-4 text-xl font-semibold">
        Products ({products.length} loaded via client-side GraphQL)
      </h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
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
            <div className="p-4">
              <h3 className="mb-1 line-clamp-2 font-medium text-gray-900">
                {product.title}
              </h3>
              <p className="mb-2 text-lg font-bold text-orange-600">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: product.priceRange.minVariantPrice.currencyCode,
                }).format(Number(product.priceRange.minVariantPrice.amount))}
              </p>
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm ${
                    product.availableForSale ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {product.availableForSale ? "In Stock" : "Out of Stock"}
                </span>
                <Link
                  href={`/product/${product.handle}`}
                  className="text-sm font-medium text-orange-600 hover:underline"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function ClientSideDemo() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 rounded-lg border border-orange-200 bg-orange-50 p-6">
        <h1 className="mb-2 text-3xl font-bold text-orange-900">
          Client-Side GraphQL (Old Approach)
        </h1>
        <p className="text-orange-700">
          This page uses <strong>useQuery from Apollo Client</strong>. Notice
          the loading skeletons while data fetches in the browser. The timer
          shows how long users wait.
        </p>
        <div className="mt-4 rounded bg-orange-100 p-3 font-mono text-sm text-orange-800">
          <strong>How it works:</strong> HTML loads (empty) → JavaScript runs →
          Apollo Client fetches → Data appears
        </div>
      </div>

      {/* Comparison links */}
      <div className="mb-6 flex gap-4">
        <Link
          href="/graphql-demo"
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Compare: Server-Side (New) →
        </Link>
        <span className="flex items-center text-sm text-gray-500">
          Server-side loads instantly with no skeleton delay
        </span>
      </div>

      {/* Product Grid with Apollo */}
      <ProductGrid />

      {/* Back Link */}
      <div className="mt-8">
        <Link href="/" className="text-orange-600 hover:underline">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
