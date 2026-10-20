"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  presentNotification,
  useAgencyNotifications,
  useAgencyNotificationStream,
} from "@/hooks/use-agency-notifications";

export function AgencyNotificationsPopover() {
  const [open, setOpen] = useState(false);
  const { notifications: data, markAllRead, markRead } = useAgencyNotifications();
  const notifications = data.slice(0, 6).map(presentNotification);
  const containerRef = useRef<HTMLDivElement>(null);
  const unreadCount = data.filter((item) => !item.is_read).length;

  useAgencyNotificationStream();

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
        className={`relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[#65625e] transition ${
          open ? "bg-[#faece4] text-[#d85a1b]" : "hover:bg-black/5"
        }`}
      >
        <Icon icon={open ? "solar:bell-bold" : "solar:bell-linear"} width="22" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-[#e7753c] px-1 text-[8px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-17 z-40 cursor-default bg-black/10 sm:hidden"
          />
          <section
            role="dialog"
            aria-label="Notifications"
            className="fixed top-18 right-3 left-3 z-50 overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_24px_70px_rgba(34,29,26,0.18)] sm:absolute sm:top-12 sm:right-0 sm:left-auto sm:w-105"
          >
            <header className="flex items-center justify-between border-b border-black/7 px-5 py-4">
              <div>
                <h2 className="font-semibold">Notifications</h2>
                <p className="mt-0.5 text-[11px] text-[#86827e]">
                  {unreadCount
                    ? `${unreadCount} unread company updates`
                    : "You’re all caught up"}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead()}
                  className="cursor-pointer text-xs font-semibold text-[#dd5c1b] hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </header>

            <div className="max-h-105 overflow-y-auto">
              {notifications.length === 0 && (
                <p className="px-5 py-10 text-center text-xs text-[#8f8b87]">
                  You have no notifications yet.
                </p>
              )}
              {notifications.map((notification, index) => (
                <Link
                  key={notification.id}
                  href={notification.href}
                  onClick={() => {
                    if (notification.unread) markRead(notification.id);
                    setOpen(false);
                  }}
                  className={`relative flex gap-3.5 px-5 py-4 transition hover:bg-[#fbf5f2] ${
                    index ? "border-t border-black/6" : ""
                  } ${notification.unread ? "bg-[#fbf2ed]" : "bg-white"}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#dd5c1b] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]">
                    <Icon icon={notification.icon} width="20" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      {notification.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[#787470]">
                      {notification.description}
                    </span>
                    <span className="mt-1.5 block text-[11px] text-[#97938f]">
                      {notification.time}
                    </span>
                  </span>
                  {notification.unread && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#e7753c]" />
                  )}
                </Link>
              ))}
            </div>

            <footer className="border-t border-black/7 bg-[#fdf9f7] p-3">
              <Link
                href="/settings?section=notifications"
                onClick={() => setOpen(false)}
                className="flex h-10 w-full items-center justify-center rounded-xl text-xs font-semibold text-[#d85a1b] hover:bg-[#faece4]"
              >
                Manage notification preferences
              </Link>
            </footer>
          </section>
        </>
      )}
    </div>
  );
}
