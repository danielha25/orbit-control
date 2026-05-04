import Link from "next/link";
import { redirect } from "next/navigation";

import RemoveWatchlistButton from "@/components/remove-watchlist-button";
import { getCurrentUser } from "@/lib/auth";
import { listMissions } from "@/server/services/mission-service";
import { listWatchlistItems, type WatchlistItemData } from "@/server/services/watchlist-service";

type WatchlistPageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

const watchlistStatusOptions = ["watching", "paused", "archived"] as const;

type WatchlistStatus = (typeof watchlistStatusOptions)[number];
type WatchlistFilter = "all" | WatchlistStatus;

function isWatchlistFilter(value: string | undefined): value is WatchlistFilter {
  return value === "all" || (typeof value === "string" && (watchlistStatusOptions as readonly string[]).includes(value));
}

function formatLabel(value: string) {
  return value.replace(/^\w/, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return value.slice(0, 10);
}

function StatusPill({ status }: { status: string }) {
  const safe = (watchlistStatusOptions as readonly string[]).includes(status) ? status : "watching";

  return (
    <span className={`oc-pill oc-pill--${safe}`}>
      <span className={`oc-dot oc-dot--${safe}`} aria-hidden="true" />
      {formatLabel(safe)}
    </span>
  );
}

function ObjectThumb({ object, size = 72 }: { object: WatchlistItemData["object"]; size?: number }) {
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

function buildTabHref(filter: WatchlistFilter) {
  return filter === "all" ? "/watchlist" : `/watchlist?status=${filter}`;
}

export default async function WatchlistPage({ searchParams }: WatchlistPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedFilter = resolvedSearchParams?.status;
  const filter: WatchlistFilter = isWatchlistFilter(requestedFilter) ? requestedFilter : "all";

  const [watchlistItems, missions] = await Promise.all([
    listWatchlistItems(user.id),
    listMissions(user.id)
  ]);

  const counts = {
    all: watchlistItems.length,
    watching: watchlistItems.filter((item) => item.status === "watching").length,
    paused: watchlistItems.filter((item) => item.status === "paused").length,
    archived: watchlistItems.filter((item) => item.status === "archived").length
  };

  const visibleItems = filter === "all"
    ? watchlistItems
    : watchlistItems.filter((item) => item.status === filter);

  const linkedMissionCounts = missions.reduce<Record<string, number>>((accumulator, mission) => {
    accumulator[mission.object.id] = (accumulator[mission.object.id] ?? 0) + 1;
    return accumulator;
  }, {});

  const tabs: { key: WatchlistFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "watching", label: "Watching" },
    { key: "paused", label: "Paused" },
    { key: "archived", label: "Archived" }
  ];

  return (
    <main className="oc-page">
      <header className="oc-topbar">
        <div className="oc-topbar__l">
          <div className="oc-tag oc-tag--muted">Catalog</div>
          <h1 className="oc-h1">Watchlist</h1>
          <div className="oc-sub">
            {counts.watching} watching / {counts.paused} paused / {counts.archived} archived
          </div>
        </div>
        <div className="oc-topbar__r">
          <Link className="oc-btn" href="/dashboard">Dashboard</Link>
          <Link className="oc-btn" href="/missions">Missions</Link>
        </div>
      </header>

      <div className="oc-page__body">
        <nav className="oc-tabs" aria-label="Filter watchlist by status">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              className={`oc-tab ${filter === tab.key ? "is-active" : ""}`}
              href={buildTabHref(tab.key)}
              data-testid={`watchlist-tab-${tab.key}`}
            >
              {tab.label}
              <span className="oc-tab__c">{counts[tab.key]}</span>
            </Link>
          ))}
        </nav>

        {visibleItems.length === 0 ? (
          <div className="oc-empty" data-testid="watchlist-empty-state">
            <div className="oc-empty__mark" aria-hidden="true">☆</div>
            <div className="oc-empty__title">
              {counts.all === 0 ? "Nothing here yet." : "No items match this filter."}
            </div>
            <div className="oc-empty__body">
              {counts.all === 0
                ? "Add objects from the dashboard to start watching."
                : "Try a different status tab to see saved objects."}
            </div>
          </div>
        ) : (
          <div className="oc-watchlist" data-testid="watchlist-item-list">
            {visibleItems.map((item) => {
              const linkedCount = linkedMissionCounts[item.object.id] ?? 0;

              return (
                <article
                  key={item.id}
                  className="oc-card oc-watchcard"
                  data-testid={`watchlist-item-${item.id}`}
                >
                  <div className="oc-watchcard__obj">
                    <ObjectThumb object={item.object} size={72} />
                    <div>
                      <div className="oc-watchcard__type">
                        {item.object.type} · added {formatDate(item.createdAt)}
                      </div>
                      <div className="oc-watchcard__name">{item.object.name}</div>
                      <div className="oc-watchcard__blurb">
                        {item.object.metadata.description || "No description available."}
                      </div>
                    </div>
                  </div>

                  <div className="oc-watchcard__meta">
                    <div className="oc-meta-row">
                      <span className="oc-meta-row__k">Status</span>
                      <StatusPill status={item.status} />
                    </div>
                    <div className="oc-meta-row">
                      <span className="oc-meta-row__k">Linked missions</span>
                      <span className="oc-meta-row__v oc-mono">{linkedCount}</span>
                    </div>
                    {item.object.metadata.category ? (
                      <div className="oc-meta-row">
                        <span className="oc-meta-row__k">Category</span>
                        <span className="oc-meta-row__v">{item.object.metadata.category}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="oc-watchcard__actions">
                    <RemoveWatchlistButton watchlistItemId={item.id} />
                    <Link className="oc-btn oc-btn--sm oc-btn--primary" href="/missions">
                      New mission
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
