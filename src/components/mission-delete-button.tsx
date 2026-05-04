"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useToast } from "@/components/toast-provider";

type MissionDeleteButtonProps = {
  missionId: string;
};

type MissionResponse = {
  data: unknown;
  error: string | null;
};

export default function MissionDeleteButton({ missionId }: MissionDeleteButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, isSubmitting]);

  function openConfirm() {
    setError(null);
    setIsOpen(true);
  }

  function closeConfirm() {
    if (isSubmitting) {
      return;
    }
    setIsOpen(false);
  }

  async function handleDelete() {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/missions/${missionId}`, {
        method: "DELETE"
      });

      const result = (await response.json().catch(() => null)) as MissionResponse | null;

      if (!response.ok) {
        const message = result?.error ?? "Request failed";
        setError(message);
        toast.error(message);
        return;
      }

      setIsOpen(false);
      toast.success("Mission deleted");
      router.push("/missions");
      router.refresh();
    } catch {
      setError("Network error");
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="oc-delete-action">
      <button
        data-testid="mission-delete-button"
        type="button"
        disabled={isSubmitting}
        onClick={openConfirm}
        className="oc-btn oc-btn--danger"
      >
        {isSubmitting ? "Deleting..." : "Delete mission"}
      </button>

      {error ? (
        <p data-testid="mission-delete-error" className="oc-form__state oc-error">
          {error}
        </p>
      ) : null}

      {isOpen ? (
        <div
          className="oc-modal"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeConfirm();
            }
          }}
        >
          <div
            className="oc-modal__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mission-delete-heading"
            data-testid="mission-delete-confirm"
          >
            <div className="oc-modal__head">
              <div id="mission-delete-heading" className="oc-modal__title">Delete mission</div>
              <button
                type="button"
                className="oc-iconbtn"
                onClick={closeConfirm}
                aria-label="Close confirmation"
                disabled={isSubmitting}
              >
                ×
              </button>
            </div>

            <div className="oc-modal__body">
              <p className="oc-confirm__text">
                This permanently deletes the mission and its activity log. This action cannot be undone.
              </p>
            </div>

            <div className="oc-modal__foot">
              <button
                type="button"
                className="oc-btn"
                onClick={closeConfirm}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                data-testid="mission-delete-confirm-submit"
                type="button"
                className="oc-btn oc-btn--danger"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Deleting..." : "Delete mission"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
