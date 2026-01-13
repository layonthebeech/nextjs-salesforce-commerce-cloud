# Migrating from Apollo Client to Server-Side GraphQL

This guide walks through migrating from client-side Apollo Client (`useQuery`) to server-side GraphQL fetching with React Server Components.

## Overview

| Aspect | Before (Apollo Client) | After (Server-Side) |
|--------|------------------------|---------------------|
| Data fetching | Browser (after page load) | Server (before HTML sent) |
| Bundle size | Apollo Client (~40KB gzipped) | Zero client-side GraphQL |
| Loading states | Required (`loading` from useQuery) | Not needed (data ready on render) |
| SEO | Requires SSR setup | Built-in (HTML includes data) |
| Caching | Apollo Cache (client) | Next.js Cache (server) |

## Before: Client-Side with useQuery

This is the typical Apollo Client pattern you may be using today:

```tsx
'use client';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useState } from 'react';

const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      name
      price
      imageGroups {
        images {
          link
        }
      }
    }
  }
`;

export default function ProductDetail({ productId }: { productId: string }) {
  const { loading, error, data } = useQuery(GET_PRODUCT, {
    variables: { id: productId },
  });

  // Must handle loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  // Must handle error state
  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const product = data.product;

  return (
    <div>
      <h1>{product.name}</h1>
      <p>${product.price}</p>
    </div>
  );
}
```

### Issues with this approach

1. **Bundle size**: Apollo Client adds ~40KB to your JavaScript bundle
2. **Waterfall requests**: Page loads, then JavaScript runs, then GraphQL fetches
3. **Loading spinners**: Users see loading states while data fetches
4. **SEO challenges**: Search engines may not wait for client-side data
5. **Complexity**: Must manage loading, error, and data states

## After: Server-Side with React Server Components

The new approach fetches data on the server before sending HTML to the browser:

```tsx
// No 'use client' directive - this is a Server Component
import { gql } from 'graphql-tag';
import { print } from 'graphql';

const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      name
      price
      imageGroups {
        images {
          link
        }
      }
    }
  }
`;

// Simple fetch function - no Apollo Client needed
async function fetchGraphQL<T>(
  query: ReturnType<typeof gql>,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: print(query),
      variables,
    }),
  });

  const json = await response.json();
  if (json.errors) {
    throw new Error(json.errors[0]?.message || 'GraphQL error');
  }
  return json.data;
}

// Component is async - data is ready when it renders
export default async function ProductDetail({ productId }: { productId: string }) {
  const data = await fetchGraphQL<{ product: Product }>(GET_PRODUCT, {
    id: productId,
  });

  const product = data.product;

  // No loading state needed - data is already here
  return (
    <div>
      <h1>{product.name}</h1>
      <p>${product.price}</p>
    </div>
  );
}
```

### Benefits of this approach

1. **Zero client bundle**: No GraphQL libraries sent to browser
2. **No loading spinners**: Data is ready when HTML arrives
3. **Better SEO**: Full HTML with data sent to search engines
4. **Simpler code**: No loading/error state management
5. **Faster perceived performance**: Users see content immediately

## Step-by-Step Migration

### Step 1: Remove 'use client' directive

```diff
- 'use client';
+ // This is now a Server Component (no directive needed)
```

### Step 2: Change imports

```diff
- import { gql } from '@apollo/client';
- import { useQuery } from '@apollo/client/react';
- import { useState } from 'react';
+ import { gql } from 'graphql-tag';
+ import { print } from 'graphql';
```

### Step 3: Add the fetchGraphQL helper

Create a utility function for GraphQL fetching:

```typescript
// lib/graphql.ts
import { gql } from 'graphql-tag';
import { print } from 'graphql';

export async function fetchGraphQL<T>(
  query: ReturnType<typeof gql>,
  variables?: Record<string, unknown>
): Promise<T> {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  const response = await fetch(`${baseUrl}/api/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: print(query),
      variables,
    }),
  });

  const json = await response.json();
  if (json.errors) {
    throw new Error(json.errors[0]?.message || 'GraphQL error');
  }
  return json.data;
}
```

### Step 4: Convert the component to async

```diff
- export default function ProductDetail({ productId }: Props) {
-   const { loading, error, data } = useQuery(GET_PRODUCT, {
-     variables: { id: productId },
-   });
+ export default async function ProductDetail({ productId }: Props) {
+   const data = await fetchGraphQL<{ product: Product }>(GET_PRODUCT, {
+     id: productId,
+   });
```

### Step 5: Remove loading/error handling

```diff
-   if (loading) {
-     return <Skeleton />;
-   }
-
-   if (error) {
-     return <Alert severity="error">{error.message}</Alert>;
-   }

    // Component now renders directly with data
    const product = data.product;
```

### Step 6: Convert useState to props or server state

If you have local state that doesn't depend on user interaction, it can often be removed:

```diff
- const [selectedImage, setSelectedImage] = useState(0);
+ // For truly interactive state, extract to a Client Component (see below)
```

## Handling Interactive Elements

Some UI elements require client-side interactivity (e.g., image galleries, quantity selectors). For these, use the composition pattern:

### Parent Server Component (fetches data)

```tsx
// app/product/[id]/page.tsx
import { fetchGraphQL } from '@/lib/graphql';
import { ProductGallery } from './ProductGallery';

export default async function ProductPage({ params }: Props) {
  const data = await fetchGraphQL(GET_PRODUCT, { id: params.id });

  return (
    <div>
      <h1>{data.product.name}</h1>
      {/* Pass data to interactive client component */}
      <ProductGallery images={data.product.images} />
    </div>
  );
}
```

### Child Client Component (handles interaction)

```tsx
// app/product/[id]/ProductGallery.tsx
'use client';

import { useState } from 'react';

export function ProductGallery({ images }: { images: Image[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div>
      <img src={images[selectedIndex].url} />
      <div>
        {images.map((img, i) => (
          <button key={i} onClick={() => setSelectedIndex(i)}>
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
```

## Comparison: Full Component Migration

### Before (604 lines, client-side)

```tsx
'use client';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useState } from 'react';

const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      name
      price
      // ... many fields
    }
  }
`;

export default function ProductDetail({ productId }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariations, setSelectedVariations] = useState({});

  const { loading, error, data } = useQuery(GET_PRODUCT, {
    variables: { id: productId },
  });

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  // ... rest of component
}
```

### After (split into Server + Client components)

```tsx
// page.tsx (Server Component - fetches data)
import { fetchGraphQL } from '@/lib/graphql';
import { ProductDetails } from './ProductDetails';

const GET_PRODUCT = gql`...`;

export default async function ProductPage({ params }: Props) {
  const data = await fetchGraphQL(GET_PRODUCT, { id: params.id });

  // Data is ready - no loading state
  return <ProductDetails product={data.product} />;
}
```

```tsx
// ProductDetails.tsx (Client Component - handles interaction)
'use client';

import { useState } from 'react';

export function ProductDetails({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  // No loading state needed - product data is already available
  return (
    <div>
      <h1>{product.name}</h1>
      {/* Interactive elements */}
    </div>
  );
}
```

## Error Handling

### Option 1: Error Boundary (recommended)

Create an error.tsx file next to your page:

```tsx
// app/product/[id]/error.tsx
'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <h2>Failed to load product</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Option 2: Try-catch in component

```tsx
export default async function ProductPage({ params }: Props) {
  try {
    const data = await fetchGraphQL(GET_PRODUCT, { id: params.id });
    return <ProductDetails product={data.product} />;
  } catch (error) {
    return <ErrorDisplay message="Failed to load product" />;
  }
}
```

## Caching

Server-side fetching integrates with Next.js caching:

```tsx
// Cache for 1 hour
const response = await fetch(`${baseUrl}/api/graphql`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: print(query), variables }),
  next: { revalidate: 3600 }, // Cache for 1 hour
});
```

Or use Next.js 15+ cache directives:

```tsx
export default async function ProductPage({ params }: Props) {
  'use cache';

  const data = await fetchGraphQL(GET_PRODUCT, { id: params.id });
  return <ProductDetails product={data.product} />;
}
```

## Common Patterns

### Pattern 1: Pagination

```tsx
// Server Component handles initial load
export default async function ProductList({ searchParams }: Props) {
  const page = searchParams.page || 1;
  const data = await fetchGraphQL(GET_PRODUCTS, { page, limit: 20 });

  return (
    <>
      <ProductGrid products={data.products} />
      <Pagination currentPage={page} totalPages={data.totalPages} />
    </>
  );
}
```

### Pattern 2: Search (with user input)

```tsx
// Page receives search params from URL
export default async function SearchPage({ searchParams }: Props) {
  const query = searchParams.q || '';
  const data = await fetchGraphQL(SEARCH_PRODUCTS, { query });

  return (
    <>
      <SearchInput defaultValue={query} /> {/* Client Component */}
      <ProductGrid products={data.products} />
    </>
  );
}
```

### Pattern 3: Mutations (Add to Cart)

Mutations still happen client-side via Server Actions:

```tsx
// actions.ts
'use server';

export async function addToCart(productId: string, quantity: number) {
  const response = await fetch(`${baseUrl}/api/graphql`, {
    method: 'POST',
    body: JSON.stringify({
      query: print(ADD_TO_CART),
      variables: { productId, quantity },
    }),
  });

  const result = await response.json();
  revalidateTag('cart');
  return result.data;
}
```

```tsx
// AddToCartButton.tsx
'use client';

import { addToCart } from './actions';

export function AddToCartButton({ productId }: Props) {
  return (
    <button onClick={() => addToCart(productId, 1)}>
      Add to Cart
    </button>
  );
}
```

## Static Site Generation with GraphQL

For fully static sites, you can execute GraphQL queries directly at build time without needing an HTTP server. This approach:

- Fetches data during `next build`
- Generates static HTML with embedded data
- No runtime GraphQL server needed
- Works with static hosting (CDN, S3, etc.)

### Architecture

```
Build Time:
┌─────────────────────────────────────────────────────────────┐
│  next build                                                  │
│       │                                                      │
│       ▼                                                      │
│  GraphQL Schema (in-process)                                 │
│       │                                                      │
│       ▼                                                      │
│  Resolvers → SFCC REST API                                   │
│       │                                                      │
│       ▼                                                      │
│  Static HTML files with embedded data                        │
└─────────────────────────────────────────────────────────────┘
```

### Setup

**1. Create the GraphQL schema (`lib/graphql/schema.ts`):**

```typescript
import { makeExecutableSchema } from "@graphql-tools/schema";
import { getCollectionProducts, getProduct } from "lib/sfcc";

const typeDefs = `
  type Product {
    id: ID!
    title: String!
    handle: String!
    # ... your schema
  }

  type Query {
    product(id: ID!): Product
    products(collection: String): [Product!]!
  }
`;

const resolvers = {
  Query: {
    product: async (_, { id }) => getProduct(id),
    products: async (_, { collection }) => 
      getCollectionProducts({ collection: collection || "mens" }),
  },
};

export const schema = makeExecutableSchema({ typeDefs, resolvers });
```

**2. Create a direct executor (`lib/graphql/execute.ts`):**

```typescript
import { DocumentNode, execute } from "graphql";
import { schema } from "./schema";

export async function executeGraphQL<TData>(
  query: DocumentNode,
  variables?: Record<string, unknown>
): Promise<TData> {
  const result = await execute({
    schema,
    document: query,
    variableValues: variables,
  });

  if (result.errors) {
    throw new Error(result.errors.map((e) => e.message).join(", "));
  }

  return result.data as TData;
}
```

**3. Use in pages (no HTTP fetch needed):**

```tsx
import { gql } from "graphql-tag";
import { executeGraphQL } from "lib/graphql/execute";

const GET_PRODUCTS = gql`
  query GetProducts($collection: String) {
    products(collection: $collection) {
      id
      title
      handle
    }
  }
`;

// This runs at BUILD TIME - generates static HTML
export default async function ProductsPage() {
  const data = await executeGraphQL(GET_PRODUCTS, {
    collection: "mens",
  });

  return (
    <div>
      {data.products.map((product) => (
        <div key={product.id}>{product.title}</div>
      ))}
    </div>
  );
}
```

### Key Difference from HTTP Approach

| Approach | How it works | When to use |
|----------|--------------|-------------|
| **HTTP fetch** (`/api/graphql`) | Fetches via HTTP at runtime | Dynamic pages, client-side updates |
| **Direct execution** (`executeGraphQL`) | Executes in-process at build time | Static sites, SSG |

Both approaches use the same GraphQL schema and queries - only the execution method differs.

## Quick Reference

| Apollo Client | Server-Side Equivalent |
|---------------|------------------------|
| `useQuery(QUERY, { variables })` | `await executeGraphQL(QUERY, variables)` |
| `useMutation(MUTATION)` | Server Action with `fetch` |
| `loading` state | Not needed (use Suspense if desired) |
| `error` state | Error boundary or try-catch |
| `refetch()` | `revalidatePath()` or `revalidateTag()` |
| Apollo Cache | Next.js Data Cache |
| `'use client'` | Remove (default is Server Component) |

## Summary

1. **Remove** `'use client'` and Apollo imports
2. **Add** `fetchGraphQL` utility function
3. **Convert** component to `async function`
4. **Remove** loading/error state handling
5. **Extract** interactive elements to Client Components
6. **Use** Server Actions for mutations

The result: faster page loads, better SEO, smaller bundles, and simpler code.
