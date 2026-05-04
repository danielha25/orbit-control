import Link from "next/link";
import { redirect } from "next/navigation";

import MissionCreateForm from "@/components/mission-create-form";
import { getCurrentUser } from "@/lib/auth";
import {
  missionPriorityOptions,
  missionStatusOptions,
  type MissionPriorityInput,
  type MissionStatusInput
} from "@/lib/validators";
import { getDashboardObjects, type DashboardObject } from "@/server/services/dashboard-service";
import { listMissions, type MissionData, type MissionFilters } from "@/server/services/mission-service";

type MissionsPageProps = {
  searchParams?: Promise<{
    search?: string;
    status?: string;
    priority?: string;
    sort?: string;
    density?: string;
    objectId?: string;
    create?: string;
  }>;
};

type MissionSortInput = "updated" | "priority" | "title";

const missionSortOptions = [
  "updated",
  "priority",
  "title"
] as const;

const missionDensityOptions = [
  "compact",
  "default",
  "airy"
] as const;

const priorityWeights: Record<MissionPriorityInput, number> = {
  low: 1,
  medium: 2,
  high: 3
};

function normalizeFilterValue<T extends string>(value: string | undefined, allowedValues: readonly T[]) {
  return value && allowedValues.includes(value as T) ? value as T : undefined;
}

function formatLabel(value: string) {
  return value.replace(/-/g, " ").replace(/^\w/, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return value.slice(0, 10);
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength).trimEnd()}...` : value;
}

function sortMissions(missions: MissionData[], sort: MissionSortInput) {
  return [...missions].sort((left, right) => {
    if (sort === "priority") {
      const priorityDelta = priorityWeights[right.priority] - priorityWeights[left.priority];

      return priorityDelta || right.updatedAt.localeCompare(left.updatedAt);
    }

    if (sort === "title") {
      return left.title.localeCompare(right.title);
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });
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

type ThumbObject = Pick<DashboardObject, "externalId" | "name" | "type"> | MissionData["object"];

function ObjectThumb({ object, size = 28 }: { object: ThumbObject; size?: number }) {
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

function EmptyMissions() {
  return (
    <div className="oc-empty" data-testid="missions-empty-state">
      <div className="oc-empty__mark" aria-hidden="true">⌕</div>
      <div className="oc-empty__title">No missions match.</div>
      <div className="oc-empty__body">Try clearing filters or search terms.</div>
    </div>
  );
}

export default async function MissionsPage({ searchParams }: MissionsPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const filters: MissionFilters = {
    search: resolvedSearchParams?.search?.trim() || undefined,
    status: normalizeFilterValue(resolvedSearchParams?.status, missionStatusOptions),
    priority: normalizeFilterValue(resolvedSearchParams?.priority, missionPriorityOptions)
  };
  const sort = normalizeFilterValue(resolvedSearchParams?.sort, missionSortOptions) ?? "updated";
  const density = normalizeFilterValue(resolvedSearchParams?.density, missionDensityOptions) ?? "default";
  const initialMissionObjectId = resolvedSearchParams?.objectId?.trim() || undefined;
  const shouldOpenComposer = resolvedSearchParams?.create === "1";

  const [filteredMissions, allMissions, spaceObjects] = await Promise.all([
    listMissions(user.id, filters),
    listMissions(user.id),
    getDashboardObjects()
  ]);
  const missions = sortMissions(filteredMissions, sort);
  const counts = {
    total: allMissions.length,
    critical: allMissions.filter((mission) => mission.status === "critical").length,
    monitoring: allMissions.filter((mission) => mission.status === "monitoring").length
  };
  const hasActiveFilters = Boolean(filters.search || filters.status || filters.priority || sort !== "updated" || density !== "default");

  return (
    <main className="oc-page">
      <header className="oc-topbar">
        <div className="oc-topbar__l">
          <div className="oc-tag oc-tag--muted">Mission control</div>
          <h1 className="oc-h1">Missions</h1>
          <div className="oc-sub">
            {counts.total} total / {counts.critical} critical / {counts.monitoring} monitoring
          </div>
        </div>
        <div className="oc-topbar__r">
          <Link className="oc-btn" href="/dashboard">Dashboard</Link>
          <Link className="oc-btn" href="/watchlist">Watchlist</Link>
          <MissionCreateForm
            spaceObjects={spaceObjects.map((object) => ({
              id: object.id,
              name: object.name
            }))}
            initialObjectId={initialMissionObjectId}
            initialOpen={shouldOpenComposer}
          />
        </div>
      </header>

      <div className="oc-page__body">
        <form action="/missions" method="GET" data-testid="mission-filters-form" className="oc-toolbar">
          <div className="oc-search">
            <span className="oc-search__icon" aria-hidden="true">⌕</span>
            <input
              name="search"
              defaultValue={filters.search ?? ""}
              data-testid="mission-filter-search"
              className="oc-search__input"
              placeholder="Search missions by title..."
            />
            {filters.search ? (
              <Link className="oc-iconbtn" href="/missions" aria-label="Clear search">×</Link>
            ) : null}
          </div>

          <div className="oc-toolbar__filters">
            <label className="oc-filter">
              <span>Status</span>
              <select
                name="status"
                defaultValue={filters.status ?? ""}
                data-testid="mission-filter-status"
                className="oc-select"
              >
                <option value="">All</option>
                {missionStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatLabel(option)}
                  </option>
                ))}
              </select>
            </label>

            <label className="oc-filter">
              <span>Priority</span>
              <select
                name="priority"
                defaultValue={filters.priority ?? ""}
                data-testid="mission-filter-priority"
                className="oc-select"
              >
                <option value="">All</option>
                {missionPriorityOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatLabel(option)}
                  </option>
                ))}
              </select>
            </label>

            <label className="oc-filter">
              <span>Sort</span>
              <select name="sort" defaultValue={sort} className="oc-select">
                <option value="updated">Recently updated</option>
                <option value="priority">Priority</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </label>

            <label className="oc-filter">
              <span>Density</span>
              <select name="density" defaultValue={density} className="oc-select">
                <option value="compact">Compact</option>
                <option value="default">Default</option>
                <option value="airy">Airy</option>
              </select>
            </label>

            <div className="oc-toolbar__actions">
              <button className="oc-btn oc-btn--primary" type="submit">Apply</button>
              {hasActiveFilters ? (
                <Link className="oc-btn" href="/missions">Clear</Link>
              ) : null}
            </div>
          </div>
        </form>

        <section className="oc-section">
          <div className="oc-section__head">
            <h2 className="oc-h2">Mission queue</h2>
            <span className="oc-section__sub">{missions.length} shown</span>
          </div>

          <div
            className={`oc-table ${density === "compact" ? "oc-table--compact" : density === "airy" ? "oc-table--airy" : ""}`}
            data-testid="missions-list"
          >
            <div className="oc-table__head" aria-hidden="true">
              <div className="oc-table__c oc-table__c--status">Status</div>
              <div className="oc-table__c oc-table__c--title">Mission</div>
              <div className="oc-table__c oc-table__c--obj">Linked object</div>
              <div className="oc-table__c oc-table__c--prio">Priority</div>
              <div className="oc-table__c oc-table__c--upd">Updated</div>
              <div className="oc-table__c oc-table__c--end" />
            </div>

            {missions.length === 0 ? (
              <EmptyMissions />
            ) : missions.map((mission) => (
              <Link
                key={mission.id}
                className="oc-table__row"
                href={`/missions/${mission.id}`}
                data-testid={`mission-card-${mission.id}`}
              >
                <div className="oc-table__c oc-table__c--status">
                  <StatusPill status={mission.status} />
                </div>
                <div className="oc-table__c oc-table__c--title">
                  <div className="oc-table__title">{mission.title}</div>
                  <div className="oc-table__sub">{mission.notes ? truncate(mission.notes, 96) : "No notes yet."}</div>
                </div>
                <div className="oc-table__c oc-table__c--obj">
                  <ObjectThumb object={mission.object} />
                  <span>{mission.object.name}</span>
                </div>
                <div className="oc-table__c oc-table__c--prio">
                  <PriorityBars priority={mission.priority} />
                </div>
                <div className="oc-table__c oc-table__c--upd oc-mono">{formatDate(mission.updatedAt)}</div>
                <div className="oc-table__c oc-table__c--end" aria-hidden="true">›</div>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
