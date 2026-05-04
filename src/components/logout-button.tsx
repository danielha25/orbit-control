"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LogoutResponse = {
  data: unknown;
  error: string | null;
};

type LogoutButtonProps = {
  variant?: "default" | "icon";
};

export default function LogoutButton({ variant = "default" }: LogoutButtonProps = {}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST"
      });

      const result = (await response.json().catch(() => null)) as LogoutResponse | null;

      if (!response.ok || result?.error) {
        setIsSubmitting(false);
        return;
      }

      router.push("/login");
      router.refresh();
    } catch {
      setIsSubmitting(false);
    }
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        data-testid="logout-button"
        onClick={handleLogout}
        disabled={isSubmitting}
        title="Sign out"
        aria-label="Sign out"
        className="oc-iconbtn"
      >
        ⏻
      </button>
    );
  }

  return (
    <button
      type="button"
      data-testid="logout-button"
      onClick={handleLogout}
      disabled={isSubmitting}
      style={{
        padding: "0.6rem 0.9rem",
        border: "1px solid #d1d5db",
        borderRadius: "999px",
        backgroundColor: "#ffffff",
        color: "#111827",
        font: "inherit",
        cursor: isSubmitting ? "default" : "pointer",
        opacity: isSubmitting ? 0.7 : 1
      }}
    >
      {isSubmitting ? "Logging out..." : "Logout"}
    </button>
  );
}
