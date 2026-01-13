import { ApolloWrapper } from "@/lib/apollo-provider";
import { ReactNode } from "react";

export default function ClientSideLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ApolloWrapper>{children}</ApolloWrapper>;
}
