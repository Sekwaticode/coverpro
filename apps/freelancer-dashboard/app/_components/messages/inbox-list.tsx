"use client";

import { Icon } from "@iconify/react";
import type { Conversation } from "./types";

type InboxListProps = {
  conversations: Conversation[];
  activeId: number | null;
  search: string;
  onSearch: (value: string) => void;
  onSelect: (conversation: Conversation) => void;
};

export function InboxList({
  conversations,
  activeId,
  search,
  onSearch,
  onSelect,
}: InboxListProps) {
  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-black/8 bg-white">
      <header className="border-b border-black/7 p-4">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.03em]">Messages</h1>
          <p className="mt-1 text-xs text-[#807c78]">Client conversations</p>
        </div>
        <label className="mt-4 flex h-10 items-center gap-2 rounded-xl bg-[#f9f1ed] px-3">
          <Icon icon="solar:magnifer-linear" width="17" className="text-[#8a8682]" />
          <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search conversations" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        </label>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversations.map((conversation) => {
          const active = conversation.id === activeId;
          return (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelect(conversation)}
              className={`flex w-full cursor-pointer gap-3 border-b border-black/6 px-4 py-4 text-left transition last:border-b-0 ${
                active ? "bg-[#faece4]" : "hover:bg-[#fbf7f4]"
              }`}
            >
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#cc5519] text-xs font-semibold text-white">
                {conversation.initials}
                {conversation.online && <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-[#e77840]" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <strong className="truncate text-sm">{conversation.client}</strong>
                  <span className="shrink-0 text-[10px] text-[#908c88]">{conversation.lastMessageTime}</span>
                </span>
                <span className="mt-0.5 block truncate text-[11px] font-medium text-[#706b66]">{conversation.company}</span>
                <span className={`mt-1 block truncate text-xs ${conversation.unread ? "font-semibold text-[#3c3a37]" : "text-[#86827e]"}`}>
                  {conversation.lastMessage}
                </span>
              </span>
              {conversation.unread > 0 && (
                <span className="mt-7 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e66e32] px-1.5 text-[9px] font-bold text-white">
                  {conversation.unread}
                </span>
              )}
            </button>
          );
        })}
        {!conversations.length && (
          <div className="grid min-h-64 place-items-center px-6 py-12 text-center">
            <div>
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#faece4] text-[#dd5c1b]">
                <Icon icon="solar:chat-round-dots-linear" width="24" />
              </span>
              <h2 className="mt-4 text-sm font-semibold">No results available</h2>
              <p className="mt-1.5 text-xs leading-5 text-[#8a8682]">
                No conversations match “{search}”.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
