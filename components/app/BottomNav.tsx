"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/discover", label: "Discover", icon: "🔥" },
  { href: "/likes", label: "Likes", icon: "💖" },
  { href: "/messages", label: "Messages", icon: "💬" },
  { href: "/premium", label: "Premium", icon: "⭐" },
  { href: "/profile", label: "Profile", icon: "👤" }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-20 border-t border-line/70 bg-bg/95 px-2 py-2 backdrop-blur-xl">
      <div className="mx-auto grid w-full max-w-xl grid-cols-5 gap-1">
        {ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href === "/messages" && pathname.startsWith("/chat"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center rounded-xl px-1 py-2 text-[11px] transition ${
                active ? "bg-white/90 text-ink" : "text-sub hover:bg-white/60"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
