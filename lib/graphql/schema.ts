import { makeExecutableSchema } from "@graphql-tools/schema";
import { getCollectionProducts, getProduct } from "lib/sfcc";

// Simple schema matching the existing SFCC data structure
const typeDefs = `
  type Money {
    amount: String!
    currencyCode: String!
  }

  type PriceRange {
    minVariantPrice: Money!
    maxVariantPrice: Money!
  }

  type Image {
    url: String!
    altText: String!
    width: Int!
    height: Int!
  }

  type ProductVariant {
    id: ID!
    title: String!
    availableForSale: Boolean!
    price: Money!
  }

  type Product {
    id: ID!
    title: String!
    handle: String!
    description: String!
    descriptionHtml: String!
    availableForSale: Boolean!
    featuredImage: Image
    images: [Image!]!
    priceRange: PriceRange!
    variants: [ProductVariant!]!
    currencyCode: String!
  }

  type Query {
    product(id: ID!): Product
    products(collection: String, simulateDelay: Boolean): [Product!]!
  }
`;

const resolvers = {
  Query: {
    product: async (_: unknown, { id }: { id: string }) => {
      try {
        return await getProduct(id);
      } catch (error) {
        console.error("Error fetching product:", error);
        return null;
      }
    },
    products: async (_: unknown, { collection }: { collection?: string }) => {
      try {
        return await getCollectionProducts({
          collection: collection || "mens",
        });
      } catch (error) {
        console.error("Error fetching products:", error);
        return [];
      }
    },
  },
};

export const schema = makeExecutableSchema({ typeDefs, resolvers });
