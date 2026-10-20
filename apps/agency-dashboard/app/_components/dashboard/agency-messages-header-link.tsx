"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUnreadMessages } from "@/hooks/use-unread-messages";
import { Icon } from "../ui/icon";

export function AgencyMessagesHeaderLink() {
  const pathname = usePathname();
  const unreadCount = useUnreadMessages();
  const active = pathname === "/messages";

  return (
    <Link
      href="/messages"
      aria-label={`Messages${unreadCount ? `, ${unreadCount} unread` : ""}`}
      className={`relative hidden h-10 w-10 items-center justify-center rounded-full transition sm:flex ${
        active
          ? "bg-[#faece4] text-[#d85a1b]"
          : "text-[#65625e] hover:bg-black/5"
      }`}
    >
      <Icon name="message" size={22} active={active} />
      {unreadCount > 0 && (
        <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-[#e7753c] px-1 text-[8px] font-bold text-white">
          {unreadCount}
        </span>
      )}
    </Link>
  );
}
