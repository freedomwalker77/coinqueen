import { MessagesInbox } from "@/components/MessagesInbox";
import { Suspense } from "react";

export default function MessagesPage() {
  return (
    <Suspense fallback={<p className="p-10 text-cream/50">Loading messages…</p>}>
      <MessagesInbox />
    </Suspense>
  );
}
