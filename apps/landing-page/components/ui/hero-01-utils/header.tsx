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

export type NavigationSection = {
  title: string;
  href: string;
  isActive?: boolean;
};

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="CoverPro home">
      <Image
        src="/coverpro-logo.png"
        alt=""
        width={36}
        height={36}
        priority
        className="h-9 w-9 rounded-full"
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
  const pill = "rounded-full font-semibold";

  return (
    <div className={cn("flex gap-2", stacked ? "flex-col" : "items-center")}>
      {isSignedIn ? (
        <>
          <Button
            variant="ghost"
            className={pill}
            onClick={logOut}
            disabled={isSigningOut}
          >
            <LogOut className="mr-1.5 h-4 w-4" />
            {isSigningOut ? "Logging out..." : "Log out"}
          </Button>
          <Button asChild className={cn(pill, "shadow-lg shadow-primary/25")}>
            <Link href={dashboardUrl}>Go to dashboard</Link>
          </Button>
        </>
      ) : (
        <>
          <Button asChild variant="ghost" className={pill}>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild className={cn(pill, "shadow-lg shadow-primary/25")}>
            <Link href="/signup">Get started</Link>
          </Button>
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

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <Logo />

        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList>
            {navigationData.map((item) => (
              <NavigationMenuItem key={item.title}>
                <NavigationMenuLink asChild active={item.isActive}>
                  <Link
                    href={item.href}
                    className={cn(
                      "rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                      item.isActive && "bg-accent text-accent-foreground",
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
              className="rounded-xl sm:hidden"
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
                    "rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted",
                    item.isActive && "text-primary",
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
