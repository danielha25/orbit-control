import Link from "next/link";
import { redirect } from "next/navigation";

import AddToWatchlistButton from "@/components/add-to-watchlist-button";
import IssWorldMap from "@/components/iss-world-map";
import UtcClock from "@/components/utc-clock";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData, type DashboardObject } from "@/server/services/dashboard-service";
import type { ExternalSpaceData } from "@/server/services/external-space-service";
import { listMissions, type MissionData } from "@/server/services/mission-service";
import { getWatchlistObjectIds } from "@/server/services/watchlist-service";

function formatNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "medium"
  }).format(new Date(value));
}

type ModeMeta = {
  className: string;
  description: string;
};

function getModeMeta(mode: ExternalSpaceData["mode"]): ModeMeta {
  switch (mode) {
    case "live":
      return {
        className: "oc-tag oc-tag--ok",
        description: "Real-time external feeds"
      };
    case "mock":
      return {
        className: "oc-tag oc-tag--muted",
        description: "Deterministic test fixtures"
      };
    case "partial":
      return {
        className: "oc-tag oc-tag--warn",
        description: "Some live sources fell back"
      };
    case "fallback":
      return {
        className: "oc-tag oc-tag--bad",
        description: "All live sources failed — using fixtures"
      };
  }
}

function getCatalogLiveStats(object: DashboardObject, live: ExternalSpaceData) {
  if (object.externalId === "apod") {
    return [
      ["APOD date", live.apod.date],
      ["Media", live.apod.mediaType]
    ];
  }

  if (object.externalId === "iss") {
    return [
      ["Position", `${formatNumber(live.iss.latitude, 2)}, ${formatNumber(live.iss.longitude, 2)}`],
      ["Updated", formatDateTime(new Date(live.iss.timestamp * 1000).toISOString())]
    ];
  }

  if (object.externalId === "near-earth-asteroids") {
    const hazardousCount = live.asteroids.filter((asteroid) => asteroid.isPotentiallyHazardous).length;

    return [
      ["Tracked today", String(live.asteroids.length)],
      ["Closest", live.nearestAsteroid.name.replace(/[()]/g, "")],
      ["Approach", live.nearestAsteroid.closeApproachDate],
      ["Hazardous", String(hazardousCount)]
    ];
  }

  if (object.source === "live-neows") {
    return [
      ["Approach", object.metadata.closeApproachDate ?? "unknown"],
      ["Diameter", object.metadata.diameterMeters ? `${formatNumber(object.metadata.diameterMeters)} m` : "unknown"],
      ["Distance", object.metadata.missDistanceKm ? `${formatNumber(object.metadata.missDistanceKm)} km` : "unknown"],
      ["Hazardous", object.metadata.isPotentiallyHazardous ? "yes" : "no"]
    ];
  }

  return [];
}

function ObjectThumb({ object, size = 64 }: { object: DashboardObject; size?: number }) {
  const palette: Record<string, [string, string]> = {
    "image-feed": ["#a78bfa", "#7c3aed"],
    station: ["#7dd3fc", "#22d3ee"],
    "asteroid-feed": ["#fb7185", "#f59e0b"]
  };
  const [a, b] = palette[object.type] ?? ["#888", "#444"];
  const gradId = `g-${object.externalId}`;

  return (
    <svg width={size} height={size} viewBox="0 0 56 56" className="oc-thumb" aria-hidden>
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%">
          <stop offset="0%" stopColor={a} stopOpacity="0.95" />
          <stop offset="60%" stopColor={b} stopOpacity="0.5" />
          <stop offset="100%" stopColor={b} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="56" height="56" fill="#06070b" />
      {Array.from({ length: 14 }).map((_, i) => {
        const x = (i * 53) % 56;
        const y = (i * 17) % 56;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i % 4 === 0 ? 0.9 : 0.5}
            fill="#fff"
            opacity={0.4 + (i % 3) * 0.15}
          />
        );
      })}
      {object.type === "station" ? (
        <g transform="translate(28 28)">
          <rect x="-2" y="-2" width="4" height="4" fill={a} />
          <rect x="-10" y="-1" width="6" height="2" fill={a} opacity="0.7" />
          <rect x="4" y="-1" width="6" height="2" fill={a} opacity="0.7" />
        </g>
      ) : object.type === "asteroid-feed" ? (
        <g transform="translate(28 28)">
          <polygon points="-8,-4 -3,-9 5,-7 8,0 4,7 -4,8 -9,2" fill={a} />
        </g>
      ) : (
        <circle cx="28" cy="28" r={20} fill={`url(#${gradId})`} />
      )}
    </svg>
  );
}

function NebulaArt() {
  return (
    <svg viewBox="0 0 1200 500" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <radialGradient id="fneb" cx="40%" cy="55%">
          <stop offset="0%" stopColor="#c084fc" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#7c3aed" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#06070b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="fneb2" cx="65%" cy="40%">
          <stop offset="0%" stopColor="#fb7185" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#06070b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="vignette" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06070b" stopOpacity="0" />
          <stop offset="100%" stopColor="#06070b" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <rect width="1200" height="500" fill="#06070b" />
      <ellipse cx="480" cy="280" rx="520" ry="240" fill="url(#fneb)" />
      <ellipse cx="800" cy="180" rx="320" ry="180" fill="url(#fneb2)" />
      <g stroke="#a78bfa" strokeOpacity="0.35" fill="none">
        <path
          d="M 100,420 C 300,300 500,360 700,260 S 1100,200 1200,180"
          strokeWidth="1"
        />
        <path
          d="M 60,360 C 280,260 460,320 660,220 S 1080,160 1160,140"
          strokeWidth="0.6"
        />
      </g>
      {Array.from({ length: 180 }).map((_, i) => {
        const x = (i * 173) % 1200;
        const y = (i * 113) % 500;
        const r = i % 23 === 0 ? 1.8 : i % 7 === 0 ? 1 : 0.5;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={r}
            fill="#fff"
            opacity={0.3 + ((i * 11) % 60) / 100}
          />
        );
      })}
      <rect width="1200" height="500" fill="url(#vignette)" />
    </svg>
  );
}

const STATUS_DOT_CLASS: Record<MissionData["status"], string> = {
  new: "oc-dot oc-dot--new",
  monitoring: "oc-dot oc-dot--monitoring",
  critical: "oc-dot oc-dot--critical",
  resolved: "oc-dot oc-dot--resolved"
};

const CATALOG_PREVIEW_COUNT = 5;

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [dashboard, watchlistIds, allMissions] = await Promise.all([
    getDashboardData(),
    getWatchlistObjectIds(user.id),
    listMissions(user.id)
  ]);

  const watchlistObjectIds = new Set(watchlistIds);
  const activeMissions = allMissions.filter((m) => m.status !== "resolved").slice(0, 4);
  const criticalCount = allMissions.filter((m) => m.status === "critical").length;

  const live = dashboard.liveSpaceData;
  const apodMediaUrl = live.apod.hdUrl ?? live.apod.url;
  const apodHasImage = live.apod.mediaType === "image" && Boolean(apodMediaUrl);
  const modeMeta = getModeMeta(live.mode);

  const apodOk = !live.errors.some((e) => e.startsWith("APOD:"));
  const issOk = !live.errors.some((e) => e.startsWith("ISS:"));
  const neoOk = !live.errors.some((e) => e.startsWith("NeoWs:"));
  const catalogPreviewObjects = dashboard.spaceObjects.slice(0, CATALOG_PREVIEW_COUNT);
  const catalogExtraObjects = dashboard.spaceObjects.slice(CATALOG_PREVIEW_COUNT);

  function renderCatalogCard(object: DashboardObject) {
    const liveStats = getCatalogLiveStats(object, live);

    return (
      <li
        key={object.id}
        data-testid={`space-object-${object.externalId}`}
        className="oc-card oc-objcard"
      >
        <div className="oc-objcard__head">
          <ObjectThumb object={object} />
          <div>
            <div className="oc-objcard__type">
              {object.type} · {object.source}
            </div>
            <div className="oc-objcard__name">{object.name}</div>
          </div>
        </div>
        <div className="oc-objcard__body">
          <p className="oc-objcard__blurb">
            {object.metadata.description || "No description."}
          </p>
          <dl className="oc-objcard__stats">
            <div>
              <dt>ID</dt>
              <dd className="oc-mono">{object.externalId}</dd>
            </div>
            {object.metadata.category ? (
              <div>
                <dt>Category</dt>
                <dd>{object.metadata.category}</dd>
              </div>
            ) : null}
          </dl>
          {liveStats.length > 0 ? (
            <div className="oc-objcard__live">
              <div className="oc-objcard__live-title">
                Live feed
                <span className={modeMeta.className}>{live.mode}</span>
              </div>
              <dl className="oc-objcard__live-stats">
                {liveStats.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>
        <div className="oc-objcard__foot">
          <AddToWatchlistButton
            objectId={object.id}
            initiallySaved={watchlistObjectIds.has(object.id)}
            variant="card"
          />
          <Link
            className="oc-btn oc-btn--sm"
            href={`/missions?objectId=${encodeURIComponent(object.id)}&create=1`}
          >
            New mission
          </Link>
        </div>
      </li>
    );
  }

  return (
    <div className="oc-page">
      <header className="oc-topbar">
        <div className="oc-topbar__l">
          <h1 className="oc-h1">Welcome back, {user.email.split("@")[0]}.</h1>
          <p className="oc-sub" data-testid="dashboard-user-email">
            Signed in as {user.email} · {activeMissions.length} active missions
            {criticalCount > 0 ? ` · ${criticalCount} critical` : ""} · {dashboard.spaceObjects.length} objects in catalog
          </p>
        </div>
        <div className="oc-topbar__r">
          <UtcClock />
          <Link href="/watchlist" className="oc-btn">Watchlist</Link>
          <Link href="/missions" className="oc-btn oc-btn--primary">Missions</Link>
        </div>
      </header>

      <div className="oc-page__body">
        <section
          className="oc-featured"
          aria-labelledby="featured-object-title"
          data-testid="dashboard-featured-object"
        >
          <div className="oc-featured__art">
            {apodHasImage && apodMediaUrl ? (
              <img src={apodMediaUrl} alt={live.apod.title} />
            ) : (
              <NebulaArt />
            )}
          </div>
          <div className="oc-featured__content">
            <div className="oc-featured__tag">
              <span className="oc-tag">NASA APOD · {live.apod.date}</span>
              <span className={modeMeta.className} title={modeMeta.description}>
                Source: {live.mode}
              </span>
            </div>
            <h2
              id="featured-object-title"
              className="oc-featured__title"
              data-testid="featured-object-name"
            >
              {live.apod.title}
            </h2>
            <p className="oc-featured__blurb">
              {live.apod.explanation.length > 220
                ? `${live.apod.explanation.slice(0, 220)}…`
                : live.apod.explanation}
            </p>
            <dl className="oc-featured__stats">
              <div>
                <dt>Media</dt>
                <dd>{live.apod.mediaType}</dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd>{live.apod.date}</dd>
              </div>
              {live.apod.copyright ? (
                <div>
                  <dt>Credit</dt>
                  <dd>{live.apod.copyright}</dd>
                </div>
              ) : null}
              <div>
                <dt>Mode</dt>
                <dd className="oc-mono">{live.mode}</dd>
              </div>
            </dl>
            {dashboard.featuredObject ? (
              <div className="oc-featured__actions">
                <AddToWatchlistButton
                  objectId={dashboard.featuredObject.id}
                  initiallySaved={watchlistObjectIds.has(dashboard.featuredObject.id)}
                  variant="card"
                />
                <Link href="/missions" className="oc-btn oc-btn--primary">
                  Create mission
                </Link>
              </div>
            ) : null}
          </div>
        </section>

        <section
          className="oc-section"
          aria-labelledby="live-space-title"
          data-testid="live-space-panel"
        >
          <div className="oc-section__head">
            <div>
              <h2 id="live-space-title" className="oc-h2">Live space signals</h2>
              <div className="oc-section__sub">
                APOD · ISS · near-earth objects
              </div>
            </div>
            <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end" }}>
              <span
                className="oc-section__sub"
                data-testid="live-space-mode"
                title={modeMeta.description}
              >
                Source: <span className={modeMeta.className}>{live.mode}</span>
              </span>
              <span
                className="oc-section__sub"
                data-testid="live-space-fetched-at"
                style={{ fontSize: "11px", color: "var(--c-fg-faint)" }}
              >
                Fetched at: {formatDateTime(live.fetchedAt)}
              </span>
            </div>
          </div>

          {live.errors.length > 0 ? (
            <div
              data-testid="live-space-errors"
              className="oc-card oc-card--pad"
              style={{
                borderColor: "color-mix(in oklch, var(--c-warn) 40%, var(--c-line))",
                background: "color-mix(in oklch, var(--c-warn) 8%, var(--c-bg-1))",
                color: "var(--c-fg)"
              }}
            >
              <p style={{ margin: "0 0 0.35rem", fontWeight: 600 }}>
                Some live sources returned fallback data.
              </p>
              <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--c-fg-1)" }}>
                {live.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <article
            data-testid="live-apod-card"
            className="oc-card oc-card--pad"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
              <h3 className="oc-h2" style={{ fontSize: "16px" }}>NASA APOD</h3>
              <span className={`oc-stat__v ${apodOk ? "is-ok" : "is-bad"}`} style={{ fontSize: "11px" }}>
                {apodOk ? "synced" : "failed"}
              </span>
              <span className="oc-section__sub">Astronomy Picture of the Day</span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "20px",
                alignItems: "start"
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {apodHasImage && apodMediaUrl ? (
                  <img
                    src={apodMediaUrl}
                    alt={live.apod.title}
                    style={{
                      width: "100%",
                      maxHeight: "420px",
                      objectFit: "cover",
                      borderRadius: "var(--r-md)",
                      background: "#06070b"
                    }}
                  />
                ) : live.apod.thumbnailUrl ? (
                  <img
                    src={live.apod.thumbnailUrl}
                    alt={live.apod.title}
                    style={{
                      width: "100%",
                      maxHeight: "420px",
                      objectFit: "cover",
                      borderRadius: "var(--r-md)",
                      background: "#06070b"
                    }}
                  />
                ) : (
                  <div
                    style={{
                      minHeight: "260px",
                      border: "1px solid var(--c-line)",
                      borderRadius: "var(--r-md)",
                      display: "grid",
                      placeItems: "center",
                      color: "var(--c-fg-muted)"
                    }}
                  >
                    No APOD media returned.
                  </div>
                )}
                {!apodHasImage && live.apod.url ? (
                  <a
                    href={live.apod.url}
                    target="_blank"
                    rel="noreferrer"
                    className="oc-btn oc-btn--sm"
                    style={{ alignSelf: "flex-start" }}
                  >
                    Open on apod.nasa.gov ↗
                  </a>
                ) : null}
              </div>

              <div>
                <p data-testid="live-apod-title" style={{ margin: "0 0 6px", fontWeight: 600, fontSize: "16px" }}>
                  {live.apod.title}
                </p>
                <p data-testid="live-apod-date" className="oc-mono" style={{ margin: "0 0 4px", color: "var(--c-fg-muted)", fontSize: "12px", letterSpacing: "0.05em" }}>
                  APOD date: {live.apod.date}
                </p>
                <p style={{ margin: "0 0 14px", color: "var(--c-fg-muted)", fontSize: "12px" }}>
                  Media: {live.apod.mediaType}
                </p>
                <p
                  data-testid="live-apod-explanation"
                  style={{
                    margin: 0,
                    lineHeight: 1.55,
                    maxHeight: "320px",
                    overflowY: "auto",
                    paddingRight: "8px",
                    color: "var(--c-fg-1)"
                  }}
                >
                  {live.apod.explanation}
                </p>
                {live.apod.copyright ? (
                  <p style={{ margin: "12px 0 0", color: "var(--c-fg-muted)", fontStyle: "italic", fontSize: "12px" }}>
                    Credit: {live.apod.copyright}
                  </p>
                ) : null}
              </div>
            </div>
          </article>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: "16px"
            }}
          >
            <article
              data-testid="live-iss-card"
              className="oc-card oc-card--pad"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <h3 className="oc-h2" style={{ fontSize: "16px" }}>ISS position</h3>
                <span className={`oc-tag ${issOk ? "" : "oc-tag--muted"}`}>{issOk ? "live" : "fallback"}</span>
              </div>
              <div style={{ marginBottom: "14px" }}>
                <IssWorldMap latitude={live.iss.latitude} longitude={live.iss.longitude} />
              </div>
              <p
                data-testid="live-iss-position"
                className="oc-mono"
                style={{ margin: "0 0 12px", fontWeight: 600, fontSize: "14px" }}
              >
                {formatNumber(live.iss.latitude, 4)}°, {formatNumber(live.iss.longitude, 4)}°
              </p>
              <div className="oc-stat-grid" style={{ background: "var(--c-line)" }}>
                {[
                  ["Altitude", `${formatNumber(live.iss.altitudeKm)} km`],
                  ["Velocity", `${formatNumber(live.iss.velocityKmH)} km/h`],
                  ["Visibility", live.iss.visibility],
                  ["Updated", formatDateTime(new Date(live.iss.timestamp * 1000).toISOString())]
                ].map(([label, value]) => (
                  <div key={label} className="oc-stat">
                    <div className="oc-stat__row">
                      <span className="oc-stat__k">{label}</span>
                    </div>
                    <div className="oc-stat__d" style={{ color: "var(--c-fg-1)", marginTop: "2px" }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article
              data-testid="live-asteroid-card"
              className="oc-card oc-card--pad"
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h3 className="oc-h2" style={{ fontSize: "16px" }}>Near-earth objects</h3>
                  <span className={`oc-tag ${neoOk ? "" : "oc-tag--muted"}`}>{neoOk ? "synced" : "fallback"}</span>
                </div>
                <span className="oc-section__sub">{live.asteroids.length} tracked today</span>
              </div>
              <p
                data-testid="live-asteroid-name"
                style={{ margin: "0 0 14px", fontWeight: 600, fontSize: "14px" }}
              >
                Closest: {live.nearestAsteroid.name}
              </p>
              <div
                className="oc-neo-grid"
              >
                {live.asteroids.slice(0, 6).map((asteroid) => (
                  <section
                    key={asteroid.id}
                    className={`oc-neo-card ${asteroid.isPotentiallyHazardous ? "is-hazardous" : ""}`}
                  >
                    <div className="oc-neo-card__head">
                      <h4 className="oc-neo-card__title">
                        {asteroid.name.replace(/[()]/g, "")}
                      </h4>
                      {asteroid.isPotentiallyHazardous ? (
                        <span className="oc-neo-card__haz">
                          HAZ
                        </span>
                      ) : null}
                    </div>
                    <dl className="oc-neo-card__metrics">
                      <div>
                        <dt>Diameter</dt>
                        <dd>{formatNumber(asteroid.diameterMeters)} m</dd>
                      </div>
                      <div>
                        <dt>Velocity</dt>
                        <dd>{formatNumber(asteroid.relativeVelocityKmH)} km/h</dd>
                      </div>
                      <div>
                        <dt>Distance</dt>
                        <dd>{formatNumber(asteroid.missDistanceKm)} km</dd>
                      </div>
                      <div>
                        <dt>Approach</dt>
                        <dd>{asteroid.closeApproachDate}</dd>
                      </div>
                    </dl>
                  </section>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="oc-section">
          <div className="oc-section__head">
            <h2 className="oc-h2">Catalog</h2>
            <div className="oc-section__sub">
              Showing {Math.min(dashboard.spaceObjects.length, CATALOG_PREVIEW_COUNT)} of {dashboard.spaceObjects.length} trackable objects
            </div>
          </div>
          <div className="oc-catalog">
            {dashboard.spaceObjects.length > CATALOG_PREVIEW_COUNT ? (
              <input
                id="dashboard-catalog-toggle"
                className="oc-catalog__toggle"
                type="checkbox"
                aria-label="Toggle full catalog"
              />
            ) : null}
            <ul
              className="oc-grid oc-catalog__grid"
              data-testid="dashboard-object-list"
              style={{ listStyle: "none", padding: 0, margin: 0 }}
            >
              {catalogPreviewObjects.map(renderCatalogCard)}
            </ul>
            {catalogExtraObjects.length > 0 ? (
              <div className="oc-catalog__extra-panel">
                <ul
                  className="oc-grid"
                  style={{ listStyle: "none", padding: 0, margin: 0 }}
                >
                  {catalogExtraObjects.map(renderCatalogCard)}
                </ul>
              </div>
            ) : null}
            {catalogExtraObjects.length > 0 ? (
              <div className="oc-catalog__actions">
                <label htmlFor="dashboard-catalog-toggle" className="oc-btn oc-btn--sm oc-catalog__button">
                  <span className="oc-catalog__more">
                    Show {catalogExtraObjects.length} more
                  </span>
                  <span className="oc-catalog__less">
                    Show fewer
                  </span>
                </label>
              </div>
            ) : null}
          </div>
        </section>

        <section className="oc-section oc-section--split">
          <div>
            <div className="oc-section__head">
              <h2 className="oc-h2">Active missions</h2>
              <Link href="/missions" className="oc-link">View all →</Link>
            </div>
            <div className="oc-card oc-card--list">
              {activeMissions.length === 0 ? (
                <div className="oc-row" style={{ color: "var(--c-fg-muted)" }}>
                  <span className="oc-row__main">
                    <div className="oc-row__title">No active missions</div>
                    <div className="oc-row__meta">
                      Create one from the missions page.
                    </div>
                  </span>
                </div>
              ) : (
                activeMissions.map((mission) => (
                  <Link
                    key={mission.id}
                    href={`/missions/${mission.id}`}
                    className="oc-row"
                  >
                    <span className={STATUS_DOT_CLASS[mission.status]} aria-hidden />
                    <span className="oc-row__main">
                      <div className="oc-row__title">{mission.title}</div>
                      <div className="oc-row__meta">
                        {mission.object.name} · {mission.priority} priority · {mission.status}
                      </div>
                    </span>
                    <span className="oc-row__chev" aria-hidden>›</span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="oc-section__head">
              <h2 className="oc-h2">System status</h2>
            </div>
            <div className="oc-card oc-stat-grid">
              <div className="oc-stat">
                <div className="oc-stat__row">
                  <span className="oc-stat__k">API</span>
                  <span className="oc-stat__v is-ok">200 OK</span>
                </div>
                <div className="oc-stat__d">/api/dashboard reachable</div>
              </div>
              <div className="oc-stat">
                <div className="oc-stat__row">
                  <span className="oc-stat__k">DB</span>
                  <span className="oc-stat__v is-ok">healthy</span>
                </div>
                <div className="oc-stat__d">Postgres · Prisma</div>
              </div>
              <div className="oc-stat">
                <div className="oc-stat__row">
                  <span className="oc-stat__k">Mode</span>
                  <span
                    className={`oc-stat__v ${
                      live.mode === "live" || live.mode === "mock" ? "is-ok" : "is-warn"
                    }`}
                  >
                    {live.mode}
                  </span>
                </div>
                <div className="oc-stat__d">SPACE_API_MODE</div>
              </div>
              <div className="oc-stat">
                <div className="oc-stat__row">
                  <span className="oc-stat__k">Errors</span>
                  <span
                    className={`oc-stat__v ${
                      live.errors.length === 0 ? "is-ok" : "is-warn"
                    }`}
                  >
                    {live.errors.length === 0 ? "none" : `${live.errors.length} reported`}
                  </span>
                </div>
                <div className="oc-stat__d">live signal failures</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
