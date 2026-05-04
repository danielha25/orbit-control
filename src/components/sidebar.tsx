"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { SessionUser } from "@/lib/auth";

import LiveSignals from "./live-signals";
import LogoutButton from "./logout-button";

type SidebarProps = {
  user: SessionUser;
};

const NAV_ITEMS: Array<{ href: string; label: string; icon: string }> = [
  { href: "/dashboard", label: "Dashboard", icon: "◐" },
  { href: "/watchlist", label: "Watchlist", icon: "◇" },
  { href: "/missions", label: "Missions", icon: "▲" }
];

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname() ?? "";

  return (
    <aside className="oc-sidebar" data-testid="app-sidebar">
      <div className="oc-brand">
        <div className="oc-brand__mark" aria-hidden>
          <svg viewBox="0 0 32 32" width="22" height="22">
            <circle cx="16" cy="16" r="3" fill="currentColor" />
            <ellipse
              cx="16"
              cy="16"
              rx="13"
              ry="5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              transform="rotate(-22 16 16)"
            />
            <circle cx="27" cy="9" r="1.6" fill="currentColor" />
          </svg>
        </div>
        <div>
          <div className="oc-brand__name">Orbit Control</div>
          <div className="oc-brand__sub">v0.4 · MVP</div>
        </div>
      </div>

      <nav className="oc-nav" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`oc-nav__item${isActive ? " is-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="oc-nav__icon">{item.icon}</span>
              <span className="oc-nav__lbl">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="oc-sidebar__feed">
        <div className="oc-side-h">Live signals</div>
        <LiveSignals />
      </div>

      <div className="oc-user">
        <div className="oc-user__avatar" aria-hidden>
          {user.email[0]?.toUpperCase() ?? "U"}
        </div>
        <div className="oc-user__meta">
          <div className="oc-user__email" data-testid="sidebar-user-email">
            {user.email}
          </div>
          <div className="oc-user__role">Operator</div>
        </div>
        <LogoutButton variant="icon" />
      </div>
    </aside>
  );
}
