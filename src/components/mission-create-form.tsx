"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useToast } from "@/components/toast-provider";
import { missionPriorityOptions, missionStatusOptions } from "@/lib/validators";

type MissionObjectOption = {
  id: string;
  name: string;
};

type MissionCreateFormProps = {
  spaceObjects: MissionObjectOption[];
  initialObjectId?: string;
  initialOpen?: boolean;
};

type MissionResponse = {
  data?: {
    id: string;
  };
  error: string | null;
};

function formatLabel(value: string) {
  return value.replace(/-/g, " ").replace(/^\w/, (letter) => letter.toUpperCase());
}

export default function MissionCreateForm({
  spaceObjects,
  initialObjectId,
  initialOpen = false
}: MissionCreateFormProps) {
  const router = useRouter();
  const toast = useToast();
  const initialSelectedObjectId = spaceObjects.some((object) => object.id === initialObjectId)
    ? initialObjectId ?? ""
    : spaceObjects[0]?.id ?? "";
  const [isOpen, setIsOpen] = useState(initialOpen && Boolean(initialSelectedObjectId));
  const [objectId, setObjectId] = useState(initialSelectedObjectId);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<(typeof missionStatusOptions)[number]>("new");
  const [priority, setPriority] = useState<(typeof missionPriorityOptions)[number]>("medium");
  const [notes, setNotes] = useState("");
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

  function openModal() {
    setError(null);
    setObjectId(initialSelectedObjectId);
    setTitle("");
    setStatus("new");
    setPriority("medium");
    setNotes("");
    setIsOpen(true);
  }

  function closeModal() {
    if (isSubmitting) {
      return;
    }

    setIsOpen(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || !objectId) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/missions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          objectId,
          title,
          status,
          priority,
          notes
        })
      });

      const result = (await response.json().catch(() => null)) as MissionResponse | null;

      if (!response.ok || !result?.data?.id) {
        const message = result?.error ?? "Request failed";
        setError(message);
        toast.error(message);
        return;
      }

      setIsOpen(false);
      toast.success("Mission created");
      router.push(`/missions/${result.data.id}`);
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
        type="button"
        className="oc-btn oc-btn--primary"
        onClick={openModal}
        data-testid="mission-create-open"
      >
        New mission
      </button>

      {isOpen ? (
        <div
          className="oc-modal"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="oc-modal__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mission-create-heading"
            data-testid="mission-create-card"
          >
            <div className="oc-modal__head">
              <div id="mission-create-heading" className="oc-modal__title">Create mission</div>
              <button
                type="button"
                className="oc-iconbtn"
                onClick={closeModal}
                aria-label="Close composer"
                disabled={isSubmitting}
              >
                ×
              </button>
            </div>

            {spaceObjects.length === 0 ? (
              <div className="oc-modal__body">
                <p className="oc-form__state">No trackable objects available.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} data-testid="mission-create-form">
                <div className="oc-modal__body">
                  <div className="oc-form">
                    <label className="oc-field">
                      <span className="oc-field__lbl">Object</span>
                      <select
                        data-testid="mission-create-object"
                        className="oc-select oc-select--field"
                        value={objectId}
                        onChange={(event) => setObjectId(event.target.value)}
                      >
                        {spaceObjects.map((object) => (
                          <option key={object.id} value={object.id}>
                            {object.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="oc-field">
                      <span className="oc-field__lbl">Title</span>
                      <input
                        data-testid="mission-create-title"
                        className="oc-input"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                      />
                    </label>

                    <div className="oc-field-row">
                      <label className="oc-field">
                        <span className="oc-field__lbl">Status</span>
                        <select
                          data-testid="mission-create-status"
                          className="oc-select oc-select--field"
                          value={status}
                          onChange={(event) => setStatus(event.target.value as (typeof missionStatusOptions)[number])}
                        >
                          {missionStatusOptions.map((option) => (
                            <option key={option} value={option}>
                              {formatLabel(option)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="oc-field">
                        <span className="oc-field__lbl">Priority</span>
                        <select
                          data-testid="mission-create-priority"
                          className="oc-select oc-select--field"
                          value={priority}
                          onChange={(event) => setPriority(event.target.value as (typeof missionPriorityOptions)[number])}
                        >
                          {missionPriorityOptions.map((option) => (
                            <option key={option} value={option}>
                              {formatLabel(option)}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label className="oc-field">
                      <span className="oc-field__lbl">Notes</span>
                      <textarea
                        data-testid="mission-create-notes"
                        className="oc-textarea"
                        rows={4}
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                      />
                    </label>

                    {error ? (
                      <p data-testid="mission-create-error" className="oc-form__state oc-error">
                        {error}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="oc-modal__foot">
                  <button
                    type="button"
                    className="oc-btn"
                    onClick={closeModal}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    data-testid="mission-create-submit"
                    type="submit"
                    className="oc-btn oc-btn--primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Create mission"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
