import type { ReactNode } from "react";

import type { SessionUser } from "@/lib/auth";

import Sidebar from "./sidebar";

type AppShellProps = {
  user: SessionUser | null;
  children: ReactNode;
};

export default function AppShell({ user, children }: AppShellProps) {
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="oc-app">
      <Sidebar user={user} />
      <main className="oc-app__main">{children}</main>
    </div>
  );
}
