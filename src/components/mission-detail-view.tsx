"use client";

import Link from "next/link";
import { useState } from "react";

import MissionDeleteButton from "@/components/mission-delete-button";
import MissionUpdateForm from "@/components/mission-update-form";
import type { MissionPriorityInput, MissionStatusInput } from "@/lib/validators";
import type { MissionData } from "@/server/services/mission-service";

type MissionDetailViewProps = {
  mission: MissionData;
  userEmail: string;
};

const priorityWeights: Record<MissionPriorityInput, number> = {
  low: 1,
  medium: 2,
  high: 3
};

function formatLabel(value: string) {
  return value.replace(/-/g, " ").replace(/^\w/, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return value.slice(0, 10);
}

function formatDateTime(value: string) {
  return value.slice(0, 16).replace("T", " ");
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength).trimEnd()}...` : value;
}

function StatusPill({ status }: { status: MissionStatusInput }) {
  return (
    <span className={`oc-pill oc-pill--${status}`}>
      <span className={`oc-dot oc-dot--${status}`} aria-hidden="true" />
      {formatLabel(status)}
    </span>
  );
}

function PriorityBars({ priority }: { priority: MissionPriorityInput }) {
  const activeBars = priorityWeights[priority];

  return (
    <span className={`oc-prio oc-prio--${priority}`} aria-label={`${formatLabel(priority)} priority`}>
      {[1, 2, 3].map((bar) => (
        <span key={bar} className={bar <= activeBars ? "is-active" : undefined} aria-hidden="true" />
      ))}
      <span className="oc-prio__label">{formatLabel(priority)}</span>
    </span>
  );
}

function ObjectThumb({ object, size = 64 }: { object: MissionData["object"]; size?: number }) {
  const palette = object.externalId === "apod"
    ? ["oklch(0.78 0.13 230)", "oklch(0.72 0.20 28)"]
    : object.externalId === "iss"
      ? ["oklch(0.78 0.13 150)", "oklch(0.80 0.13 230)"]
      : ["oklch(0.82 0.16 70)", "oklch(0.68 0.15 230)"];
  const label = object.name.slice(0, 2).toUpperCase();

  return (
    <svg
      className="oc-thumb"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-label={object.name}
    >
      <rect width="40" height="40" rx="10" fill={palette[0]} opacity="0.18" />
      <circle cx="27" cy="13" r="9" fill={palette[0]} opacity="0.28" />
      <path d="M7 29 C14 19, 21 34, 33 16" stroke={palette[1]} strokeWidth="2" fill="none" opacity="0.85" />
      <text x="20" y="24" textAnchor="middle" fontSize="10" fontWeight="700" fill="currentColor">
        {label}
      </text>
    </svg>
  );
}

export default function MissionDetailView({ mission, userEmail }: MissionDetailViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const notes = mission.notes || "No mission notes have been recorded yet.";
  const shortTitle = truncate(mission.title, 44);

  return (
    <main className="oc-page">
      <header className="oc-topbar">
        <div className="oc-topbar__l">
          <nav className="oc-crumbs" aria-label="Breadcrumb">
            <Link className="oc-crumbs__a" href="/missions">Missions</Link>
            <span className="oc-crumbs__sep" aria-hidden="true">/</span>
            <span className="oc-crumbs__c">{shortTitle}</span>
          </nav>
          <h1 className="oc-h1">{isEditing ? "Edit mission" : mission.title}</h1>
          <div className="oc-sub">
            Updated {formatDate(mission.updatedAt)} / Created {formatDate(mission.createdAt)}
          </div>
        </div>

        <div className="oc-topbar__r">
          {isEditing ? (
            <button className="oc-btn" type="button" onClick={() => setIsEditing(false)}>
              View mission
            </button>
          ) : (
            <>
              <Link className="oc-btn" href="/missions">Back to list</Link>
              <button className="oc-btn oc-btn--primary" type="button" onClick={() => setIsEditing(true)}>
                Edit
              </button>
            </>
          )}
        </div>
      </header>

      <div className="oc-page__body oc-detail">
        <div className="oc-detail__main">
          {isEditing ? (
            <section className="oc-card oc-card--pad">
              <div className="oc-section__head oc-section__head--stacked">
                <div>
                  <h2 className="oc-h2">Update mission</h2>
                  <p className="oc-section__sub">Changes are saved through the existing mission API.</p>
                </div>
              </div>
              <MissionUpdateForm
                missionId={mission.id}
                initialTitle={mission.title}
                initialStatus={mission.status}
                initialPriority={mission.priority}
                initialNotes={mission.notes}
              />
            </section>
          ) : (
            <>
              <section className="oc-card oc-card--pad oc-detail__state">
                <div className="oc-detail__h">Mission state</div>
                <div className="oc-detail__state-grid">
                  <div>
                    <span>Status</span>
                    <strong><StatusPill status={mission.status} /></strong>
                  </div>
                  <div>
                    <span>Priority</span>
                    <strong><PriorityBars priority={mission.priority} /></strong>
                  </div>
                  <div>
                    <span>Linked object</span>
                    <strong>{mission.object.name}</strong>
                  </div>
                </div>
              </section>

              <section className="oc-card oc-card--pad oc-detail__notes">
                <div className="oc-detail__h">Mission notes</div>
                <p>{notes}</p>
              </section>

              <section className="oc-card oc-card--pad oc-timeline">
                <div className="oc-detail__h">Activity</div>
                <ul>
                  <li>
                    <span className="oc-mono">{formatDateTime(mission.updatedAt)}</span>
                    <span>Status set to <b>{formatLabel(mission.status)}</b></span>
                  </li>
                  <li>
                    <span className="oc-mono">{formatDateTime(mission.createdAt)}</span>
                    <span>Mission created against <b>{mission.object.name}</b></span>
                  </li>
                </ul>
              </section>
            </>
          )}
        </div>

        <aside className="oc-detail__side">
          <section className="oc-card oc-card--pad oc-detail__side-card">
            <div className="oc-detail__h">Linked object</div>
            <div className="oc-detail__obj">
              <ObjectThumb object={mission.object} />
              <div>
                <div className="oc-detail__objname">{mission.object.name}</div>
                <div className="oc-detail__objtype">
                  {mission.object.type} / {mission.object.source}
                </div>
              </div>
            </div>
            <p className="oc-detail__object-desc">{mission.object.metadata.description}</p>
            <dl className="oc-kv">
              <div>
                <dt>Category</dt>
                <dd>{mission.object.metadata.category || "Uncategorized"}</dd>
              </div>
              <div>
                <dt>External ID</dt>
                <dd className="oc-mono">{mission.object.externalId}</dd>
              </div>
              <div>
                <dt>Object ID</dt>
                <dd className="oc-mono">{mission.object.id}</dd>
              </div>
            </dl>
          </section>

          <section className="oc-card oc-card--pad oc-detail__side-card">
            <div className="oc-detail__h">Mission metadata</div>
            <dl className="oc-kv">
              <div>
                <dt>Status</dt>
                <dd><StatusPill status={mission.status} /></dd>
              </div>
              <div>
                <dt>Priority</dt>
                <dd><PriorityBars priority={mission.priority} /></dd>
              </div>
              <div>
                <dt>Owner</dt>
                <dd>{userEmail}</dd>
              </div>
              <div>
                <dt>Mission ID</dt>
                <dd className="oc-mono">{mission.id}</dd>
              </div>
            </dl>
          </section>

          <section className="oc-card oc-card--pad oc-danger-zone">
            <div>
              <div className="oc-detail__h">Danger zone</div>
              <p>Deleting this mission returns you to the mission list.</p>
            </div>
            <MissionDeleteButton missionId={mission.id} />
          </section>
        </aside>
      </div>
    </main>
  );
}
