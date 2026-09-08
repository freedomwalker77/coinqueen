"use server";

import { resolvePersistedUser } from "@/lib/account";
import { listPublicUsers } from "@/lib/db";
import { isDemoShop } from "@/lib/market";
import {
  conversationFor,
  conversationsFor,
  otherParty,
  preview,
  sendChat,
} from "@/lib/messages";
import { getSessionUser } from "@/lib/session";

export async function getInbox(threadId?: string) {
  const session = await getSessionUser();
  if (!session) return { user: null, conversations: [], thread: null, shops: [] };
  const user = await resolvePersistedUser(session);
  if (!user) return { user: null, conversations: [], thread: null, shops: [] };
  const rows = await conversationsFor(user.id);
  const conversations = rows.map((row) => {
    const other = otherParty(row, user.id);
    return {
      id: row.id,
      name: other.name,
      shopSlug: other.shopSlug,
      preview: preview(row),
      updatedAt: row.updatedAt,
      listingTitle: row.listingTitle,
    };
  });
  const thread = threadId ? await conversationFor(user.id, threadId) : null;
  const shops = listPublicUsers()
    .filter((shop) => shop.id !== user.id && !isDemoShop(shop.shopSlug))
    .map((shop) => ({ name: shop.name, shopSlug: shop.shopSlug }));
  return {
    user: { id: user.id, name: user.name, shopSlug: user.shopSlug },
    conversations,
    thread: thread
      ? {
          id: thread.id,
          other: otherParty(thread, user.id),
          listingTitle: thread.listingTitle,
          messages: thread.messages,
        }
      : null,
    shops,
  };
}

export async function sendInboxMessage(input: {
  toSlug: string;
  body: string;
  listingId?: string;
  listingTitle?: string;
}) {
  const session = await getSessionUser();
  if (!session) return { error: "Sign in to send a message." };
  const user = await resolvePersistedUser(session);
  if (!user) return { error: "Account not found." };
  if (isDemoShop(input.toSlug)) return { error: "Sample shops cannot receive messages." };
  const result = await sendChat({
    from: { id: user.id, name: user.name, shopSlug: user.shopSlug },
    toSlug: input.toSlug,
    body: input.body,
    listingId: input.listingId,
    listingTitle: input.listingTitle,
  });
  if ("error" in result) return result;
  return { id: result.conversation.id };
}
