"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { LogOut, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import ArrowLink from "./arrow-link";
import type { NavigationSection } from "./navigation";

export type { NavigationSection };

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="CoverPro home">
      <Image
        src="/coverpro-logo.png"
        alt=""
        width={40}
        height={40}
        priority
        className="h-10 w-10 rounded-full"
      />
      <span className="text-xl font-bold tracking-tight text-foreground">
        Cover<span className="text-primary">Pro</span>
      </span>
    </Link>
  );
}

function useAccount() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const role = user?.unsafeMetadata?.role;
  const dashboardUrl =
    role === "client"
      ? process.env.NEXT_PUBLIC_CLIENT_DASHBOARD
      : role === "freelancer"
        ? process.env.NEXT_PUBLIC_FREELANCER_DASHBOARD
        : undefined;

  const logOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({ redirectUrl: "/" });
    } finally {
      setIsSigningOut(false);
    }
  };

  return {
    isSignedIn: isLoaded && Boolean(user),
    dashboardUrl: dashboardUrl ?? "/login",
    isSigningOut,
    logOut,
  };
}

function AccountActions({ stacked = false }: { stacked?: boolean }) {
  const { isSignedIn, dashboardUrl, isSigningOut, logOut } = useAccount();

  return (
    <div className={cn("flex gap-1", stacked ? "flex-col-reverse gap-2" : "items-center")}>
      {isSignedIn ? (
        <>
          <Button
            variant="ghost"
            className="rounded-full font-semibold"
            onClick={logOut}
            disabled={isSigningOut}
          >
            <LogOut className="mr-1.5 h-4 w-4" />
            {isSigningOut ? "Logging out..." : "Log out"}
          </Button>
          <ArrowLink href={dashboardUrl}>Go to dashboard</ArrowLink>
        </>
      ) : (
        <>
          <Button asChild variant="ghost" className="rounded-full font-semibold">
            <Link href="/login">Sign in</Link>
          </Button>
          <ArrowLink href="/signup">Get started</ArrowLink>
        </>
      )}
    </div>
  );
}

export default function Header({
  navigationData,
}: {
  navigationData: NavigationSection[];
}) {
  const [open, setOpen] = useState(false);

  // pt-4 + h-16 = 80px; the hero pulls itself up by this much so its
  // background runs behind the floating bar.
  return (
    <header className="sticky top-0 z-50 px-3 pt-4 sm:px-6">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 rounded-full border border-border bg-background/80 pr-2 pl-3 shadow-lg shadow-black/5 backdrop-blur-md">
        <Logo />

        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList className="rounded-full bg-muted p-1">
            {navigationData.map((item) => (
              <NavigationMenuItem key={item.title}>
                <NavigationMenuLink asChild active={item.isActive}>
                  <Link
                    href={item.href}
                    aria-current={item.isActive ? "page" : undefined}
                    className={cn(
                      "block rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                      item.isActive && "bg-foreground text-background hover:text-background",
                    )}
                  >
                    {item.title}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="hidden sm:block">
          <AccountActions />
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full sm:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex flex-col gap-6">
            <SheetHeader>
              <SheetTitle className="text-left">Menu</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1">
              {navigationData.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-full px-4 py-3 text-sm font-medium hover:bg-muted",
                    item.isActive && "bg-foreground text-background hover:bg-foreground",
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
            <div className="mt-auto border-t border-border pt-4">
              <AccountActions stacked />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
