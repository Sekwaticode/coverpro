import type { Metadata } from "next";
import { MessagesDashboard } from "./messages-dashboard";

export const metadata: Metadata = {
  title: "Company Messages | CoverPro",
  description:
    "Manage company conversations with clients about proposals and contracts.",
};

export default async function AgencyMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conversationId?: string }>;
}) {
  const { conversationId } = await searchParams;

  return <MessagesDashboard conversationId={conversationId} />;
}
