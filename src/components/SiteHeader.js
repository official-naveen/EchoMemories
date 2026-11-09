"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/libs/api";
import Avatar from "@/components/Avatar";
import Ghost from "@/components/Ghost";
import Icon from "@/components/Icon";
import ThemeToggle from "@/components/ThemeToggle";

const LINKS = [
  { href: "/home", label: "Home", icon: "home", auth: true },
  { href: "/space", label: "Space", icon: "space" },
  { href: "/rooms", label: "Rooms", icon: "rooms" },
  ];

function UserMenu({ me, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const path = usePathname();

  useEffect(() => setOpen(false), [path]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) =>
      ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="menu-wrap" ref={ref}>
      <button
        className="avatar-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <Avatar name={me.fullName} seed={me.username} />
      </button>
      {open && (
        <div className="menu" role="menu">
          <div className="menu-head">
            <strong>{me.fullName}</strong>
            <span className="muted">@{me.username}</span>
          </div>
          <Link
            role="menuitem"
            className="menu-item"
            href={`/u/${me.username}`}
          >
            <Icon name="user" /> Profile
          </Link>
          <Link role="menuitem" className="menu-item" href="/leaderboard">
            <Icon name="pulse" /> Pulse
          </Link>
          <button
            role="menuitem"
            className="menu-item danger"
            onClick={onLogout}
          >
            <Icon name="logout" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default function SiteHeader() {
  const { me, loading, logout } = useAuth();
  const path = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!me) return;
    let stop = false;
    const load = () =>
      api("/api/notifications/unread")
        .then((d) => !stop && setUnread(d.count || 0))
        .catch(() => {});
    load();
    const t = setInterval(load, 60000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [me, path]);

  const on = (href) => path === href || path.startsWith(href + "/");
  const links = LINKS.filter((l) => !l.auth || me);
  const count = me ? unread : 0;
  const badge = count > 0 && (
    <span className="badge" aria-label={`${count} unread`}>
      {count > 99 ? "99+" : count}
    </span>
  );

  return (
    <>
      <header className="topbar">
        <div className="topbar-in">
          <Link
            href={me ? "/home" : "/"}
            className="brand"
            aria-label="EchoMemories home"
          >
            <Ghost size={30} priority />
            <span className="wordmark">
              Echo<b>Memories</b>
            </span>
          </Link>

          <nav className="topnav" aria-label="Main">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={on(l.href) ? "page" : undefined}
              >
                <Icon name={l.icon} />
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="topbar-actions">
            {!loading && me && (
              <Link
                href="/notifications"
                className="icon-btn"
                aria-label="Alerts"
                aria-current={on("/notifications") ? "page" : undefined}
              >
                <Icon name="bell" />
                {badge}
              </Link>
            )}
            <ThemeToggle />
            {!loading && me && <UserMenu me={me} onLogout={logout} />}
            {!loading && !me && (
              <>
                <Link href="/login" className="text-link">
                  Log in
                </Link>
                <Link href="/signup" className="btn primary small">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {me && (
        <nav className="bottom-nav" aria-label="Primary">
          {[
            ...links.filter((l) => !l.desktopOnly),
            { href: "/notifications", label: "Alerts", icon: "bell" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={on(l.href) ? "page" : undefined}
            >
              <Icon name={l.icon} />
              {l.label}
              {l.href === "/notifications" && badge}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
