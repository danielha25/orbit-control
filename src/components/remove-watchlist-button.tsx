"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useToast } from "@/components/toast-provider";

type RemoveWatchlistButtonProps = {
  watchlistItemId: string;
};

type WatchlistResponse = {
  data: unknown;
  error: string | null;
};

export default function RemoveWatchlistButton({
  watchlistItemId
}: RemoveWatchlistButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove() {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/watchlist/${watchlistItemId}`, {
        method: "DELETE"
      });

      const result = (await response.json().catch(() => null)) as WatchlistResponse | null;

      if (!response.ok) {
        const message = result?.error ?? "Request failed";
        setError(message);
        toast.error(message);
        return;
      }

      toast.success("Removed from watchlist");
      router.refresh();
    } catch {
      setError("Network error");
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        data-testid={`remove-watchlist-${watchlistItemId}`}
        type="button"
        className="oc-btn oc-btn--sm"
        disabled={isSubmitting}
        onClick={handleRemove}
      >
        {isSubmitting ? "Removing..." : "Remove"}
      </button>

      {error ? (
        <p
          data-testid={`remove-watchlist-error-${watchlistItemId}`}
          className="oc-watchcard__error"
        >
          {error}
        </p>
      ) : null}
    </>
  );
}
