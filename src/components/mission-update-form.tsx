"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useToast } from "@/components/toast-provider";
import { missionPriorityOptions, missionStatusOptions } from "@/lib/validators";

type MissionUpdateFormProps = {
  missionId: string;
  initialTitle: string;
  initialStatus: (typeof missionStatusOptions)[number];
  initialPriority: (typeof missionPriorityOptions)[number];
  initialNotes: string;
};

type MissionResponse = {
  data: unknown;
  error: string | null;
};

export default function MissionUpdateForm({
  missionId,
  initialTitle,
  initialStatus,
  initialPriority,
  initialNotes
}: MissionUpdateFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState(initialStatus);
  const [priority, setPriority] = useState(initialPriority);
  const [notes, setNotes] = useState(initialNotes);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch(`/api/missions/${missionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          status,
          priority,
          notes
        })
      });

      const result = (await response.json().catch(() => null)) as MissionResponse | null;

      if (!response.ok) {
        const message = result?.error ?? "Request failed";
        setError(message);
        toast.error(message);
        return;
      }

      setSaved(true);
      toast.success("Mission saved");
      router.refresh();
    } catch {
      setError("Network error");
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} data-testid="mission-update-form" className="oc-form">
      <label className="oc-field">
        <span className="oc-field__lbl">Title</span>
        <input
          data-testid="mission-update-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="oc-input"
        />
      </label>

      <div className="oc-field-row">
        <label className="oc-field">
          <span className="oc-field__lbl">Status</span>
          <select
            data-testid="mission-update-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as (typeof missionStatusOptions)[number])}
            className="oc-select oc-select--field"
          >
            {missionStatusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="oc-field">
          <span className="oc-field__lbl">Priority</span>
          <select
            data-testid="mission-update-priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value as (typeof missionPriorityOptions)[number])}
            className="oc-select oc-select--field"
          >
            {missionPriorityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="oc-field">
        <span className="oc-field__lbl">Notes</span>
        <textarea
          data-testid="mission-update-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={6}
          className="oc-textarea"
        />
      </label>

      {error ? (
        <p data-testid="mission-update-error" className="oc-form__state oc-error">
          {error}
        </p>
      ) : null}

      {saved ? (
        <p data-testid="mission-update-saved" className="oc-form__state oc-success">
          Mission saved.
        </p>
      ) : null}

      <div className="oc-form__actions">
        <button
          data-testid="mission-update-submit"
          type="submit"
          disabled={isSubmitting}
          className="oc-btn oc-btn--primary"
        >
          {isSubmitting ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
