"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useToast } from "@/components/toast-provider";

type AddToWatchlistButtonProps = {
  objectId: string;
  initiallySaved: boolean;
  variant?: "default" | "card";
};

type WatchlistResponse = {
  data: unknown;
  error: string | null;
};

export default function AddToWatchlistButton({
  objectId,
  initiallySaved,
  variant = "default"
}: AddToWatchlistButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const [isSaved, setIsSaved] = useState(initiallySaved);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (isSaved || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          objectId
        })
      });

      const result = (await response.json().catch(() => null)) as WatchlistResponse | null;

      if (!response.ok) {
        const message = result?.error ?? "Request failed";
        setError(message);
        toast.error(message);
        return;
      }

      setIsSaved(true);
      toast.success("Added to watchlist");
      router.refresh();
    } catch {
      setError("Network error");
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (variant === "card") {
    return (
      <>
        <button
          data-testid={`add-watchlist-${objectId}`}
          type="button"
          disabled={isSaved || isSubmitting}
          onClick={handleAdd}
          className="oc-btn oc-btn--sm"
        >
          {isSaved ? "✓ Watching" : isSubmitting ? "Adding..." : "+ Watchlist"}
        </button>
        {error ? (
          <span
            data-testid={`add-watchlist-error-${objectId}`}
            style={{
              color: "var(--c-status-critical)",
              fontSize: "11px",
              marginLeft: "8px"
            }}
          >
            {error}
          </span>
        ) : null}
      </>
    );
  }

  return (
    <div>
      <button
        data-testid={`add-watchlist-${objectId}`}
        type="button"
        disabled={isSaved || isSubmitting}
        onClick={handleAdd}
        style={{
          marginTop: "0.75rem",
          padding: "0.65rem 0.85rem",
          border: "none",
          borderRadius: "10px",
          backgroundColor: isSaved ? "#9ca3af" : "#111827",
          color: "#ffffff",
          font: "inherit",
          cursor: isSaved || isSubmitting ? "default" : "pointer",
          opacity: isSubmitting ? 0.7 : 1
        }}
      >
        {isSaved ? "In Watchlist" : isSubmitting ? "Adding..." : "Add to Watchlist"}
      </button>

      {error ? (
        <p
          data-testid={`add-watchlist-error-${objectId}`}
          style={{ margin: "0.5rem 0 0", color: "#b91c1c", fontSize: "0.9rem" }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
