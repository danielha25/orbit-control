type ExternalApiMode = "live" | "mock" | "partial" | "fallback";
type ExternalSourceMode = "live" | "mock" | "fallback";

type ApodApiResponse = {
  title?: unknown;
  date?: unknown;
  media_type?: unknown;
  url?: unknown;
  hdurl?: unknown;
  thumbnail_url?: unknown;
  explanation?: unknown;
  copyright?: unknown;
};

type IssApiResponse = {
  latitude?: unknown;
  longitude?: unknown;
  altitude?: unknown;
  velocity?: unknown;
  visibility?: unknown;
  timestamp?: unknown;
  units?: unknown;
};

type NeoWsObject = {
  id?: unknown;
  name?: unknown;
  estimated_diameter?: {
    meters?: {
      estimated_diameter_min?: unknown;
      estimated_diameter_max?: unknown;
    };
  };
  is_potentially_hazardous_asteroid?: unknown;
  close_approach_data?: Array<{
    close_approach_date?: unknown;
    relative_velocity?: {
      kilometers_per_hour?: unknown;
    };
    miss_distance?: {
      kilometers?: unknown;
    };
  }>;
};

type NeoWsApiResponse = {
  near_earth_objects?: Record<string, NeoWsObject[]>;
};

export type LiveApodData = {
  title: string;
  date: string;
  mediaType: string;
  url: string | null;
  hdUrl: string | null;
  thumbnailUrl: string | null;
  explanation: string;
  copyright: string | null;
};

export type LiveIssData = {
  latitude: number;
  longitude: number;
  altitudeKm: number;
  velocityKmH: number;
  visibility: string;
  timestamp: number;
};

export type LiveAsteroidData = {
  id: string;
  name: string;
  closeApproachDate: string;
  missDistanceKm: number;
  relativeVelocityKmH: number;
  diameterMeters: number;
  isPotentiallyHazardous: boolean;
};

export type ExternalSpaceData = {
  mode: ExternalApiMode;
  sourceModes: {
    apod: ExternalSourceMode;
    iss: ExternalSourceMode;
    asteroids: ExternalSourceMode;
  };
  fetchedAt: string;
  apod: LiveApodData;
  iss: LiveIssData;
  nearestAsteroid: LiveAsteroidData;
  asteroids: LiveAsteroidData[];
  errors: string[];
};

const NASA_BASE_URL = "https://api.nasa.gov";
const ISS_URL = "https://api.wheretheiss.at/v1/satellites/25544";

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function readNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function readBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function getApiTimeoutMs() {
  const parsed = Number(process.env.SPACE_API_TIMEOUT_MS);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5000;
}

function getNasaApiKey() {
  return process.env.NASA_API_KEY || "DEMO_KEY";
}

function getMockExternalSpaceData(mode: ExternalApiMode = "mock", errors: string[] = []): ExternalSpaceData {
  return {
    mode,
    sourceModes: {
      apod: mode === "mock" ? "mock" : "fallback",
      iss: mode === "mock" ? "mock" : "fallback",
      asteroids: mode === "mock" ? "mock" : "fallback"
    },
    fetchedAt: new Date().toISOString(),
    apod: {
      title: "Mock Astronomy Picture",
      date: "2026-01-01",
      mediaType: "image",
      url: "https://apod.nasa.gov/apod/image/mock-orbit-control.jpg",
      hdUrl: null,
      thumbnailUrl: null,
      explanation: "Deterministic APOD payload used for local automation and fallback rendering.",
      copyright: null
    },
    iss: {
      latitude: 12.3456,
      longitude: 65.4321,
      altitudeKm: 408.2,
      velocityKmH: 27600,
      visibility: "daylight",
      timestamp: 1767225600
    },
    nearestAsteroid: {
      id: "mock-neo-2026-qa",
      name: "Mock NEO 2026 QA",
      closeApproachDate: "2026-01-01",
      missDistanceKm: 4200000,
      relativeVelocityKmH: 54000,
      diameterMeters: 120,
      isPotentiallyHazardous: false
    },
    asteroids: [
      {
        id: "mock-neo-2026-qa",
        name: "Mock NEO 2026 QA",
        closeApproachDate: "2026-01-01",
        missDistanceKm: 4200000,
        relativeVelocityKmH: 54000,
        diameterMeters: 120,
        isPotentiallyHazardous: false
      },
      {
        id: "mock-neo-2026-hz",
        name: "Mock NEO 2026 HZ",
        closeApproachDate: "2026-01-01",
        missDistanceKm: 7600000,
        relativeVelocityKmH: 72100,
        diameterMeters: 310,
        isPotentiallyHazardous: true
      },
      {
        id: "mock-neo-2026-sm",
        name: "Mock NEO 2026 SM",
        closeApproachDate: "2026-01-01",
        missDistanceKm: 12800000,
        relativeVelocityKmH: 38200,
        diameterMeters: 48,
        isPotentiallyHazardous: false
      }
    ],
    errors
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getApiTimeoutMs());

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json() as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchApod(): Promise<LiveApodData> {
  const url = new URL("/planetary/apod", NASA_BASE_URL);
  url.searchParams.set("api_key", getNasaApiKey());
  url.searchParams.set("thumbs", "true");

  const payload = await fetchJson<ApodApiResponse>(url.toString());

  return {
    title: readString(payload.title, "Astronomy Picture of the Day"),
    date: readString(payload.date, getTodayIsoDate()),
    mediaType: readString(payload.media_type, "unknown"),
    url: readString(payload.url) || null,
    hdUrl: readString(payload.hdurl) || null,
    thumbnailUrl: readString(payload.thumbnail_url) || null,
    explanation: readString(payload.explanation, "No APOD explanation returned."),
    copyright: readString(payload.copyright) || null
  };
}

async function fetchIssPosition(): Promise<LiveIssData> {
  const payload = await fetchJson<IssApiResponse>(ISS_URL);

  return {
    latitude: readNumber(payload.latitude),
    longitude: readNumber(payload.longitude),
    altitudeKm: readNumber(payload.altitude),
    velocityKmH: readNumber(payload.velocity),
    visibility: readString(payload.visibility, "unknown"),
    timestamp: readNumber(payload.timestamp, Math.floor(Date.now() / 1000))
  };
}

function sortAsteroidsByRiskAndDistance(left: LiveAsteroidData, right: LiveAsteroidData) {
  if (left.isPotentiallyHazardous !== right.isPotentiallyHazardous) {
    return left.isPotentiallyHazardous ? -1 : 1;
  }

  return left.missDistanceKm - right.missDistanceKm;
}

function getNearEarthObjects(payload: NeoWsApiResponse): NeoWsObject[] {
  const objects = Object.values(payload.near_earth_objects ?? {}).flat();

  if (objects.length === 0) {
    return [];
  }

  return objects.sort((left, right) => {
    const leftDistance = readNumber(left.close_approach_data?.[0]?.miss_distance?.kilometers, Number.MAX_VALUE);
    const rightDistance = readNumber(right.close_approach_data?.[0]?.miss_distance?.kilometers, Number.MAX_VALUE);

    return leftDistance - rightDistance;
  });
}

function mapAsteroid(asteroid: NeoWsObject, fallbackDate: string): LiveAsteroidData {
  const approach = asteroid.close_approach_data?.[0];
  const minDiameter = readNumber(
    asteroid.estimated_diameter?.meters?.estimated_diameter_min
  );
  const maxDiameter = readNumber(
    asteroid.estimated_diameter?.meters?.estimated_diameter_max
  );

  return {
    id: readString(asteroid.id, readString(asteroid.name, "unknown-near-earth-object")),
    name: readString(asteroid.name, "Unknown near-earth object"),
    closeApproachDate: readString(approach?.close_approach_date, fallbackDate),
    missDistanceKm: readNumber(approach?.miss_distance?.kilometers),
    relativeVelocityKmH: readNumber(approach?.relative_velocity?.kilometers_per_hour),
    diameterMeters: Math.round((minDiameter + maxDiameter) / 2),
    isPotentiallyHazardous: readBoolean(asteroid.is_potentially_hazardous_asteroid)
  };
}

async function fetchAsteroids(): Promise<LiveAsteroidData[]> {
  const today = getTodayIsoDate();
  const url = new URL("/neo/rest/v1/feed", NASA_BASE_URL);
  url.searchParams.set("start_date", today);
  url.searchParams.set("end_date", today);
  url.searchParams.set("api_key", getNasaApiKey());

  const payload = await fetchJson<NeoWsApiResponse>(url.toString());
  const asteroids = getNearEarthObjects(payload);

  if (asteroids.length === 0) {
    throw new Error("NeoWs returned no near-earth objects");
  }

  return asteroids.map((asteroid) => mapAsteroid(asteroid, today)).sort(sortAsteroidsByRiskAndDistance);
}

export async function getExternalSpaceData(): Promise<ExternalSpaceData> {
  if (process.env.SPACE_API_MODE === "mock") {
    return getMockExternalSpaceData("mock");
  }

  const fallback = getMockExternalSpaceData("fallback");
  const [apodResult, issResult, asteroidResult] = await Promise.allSettled([
    fetchApod(),
    fetchIssPosition(),
    fetchAsteroids()
  ]);
  const errors: string[] = [];

  if (apodResult.status === "rejected") {
    errors.push(`APOD: ${apodResult.reason instanceof Error ? apodResult.reason.message : "request failed"}`);
  }

  if (issResult.status === "rejected") {
    errors.push(`ISS: ${issResult.reason instanceof Error ? issResult.reason.message : "request failed"}`);
  }

  if (asteroidResult.status === "rejected") {
    errors.push(`NeoWs: ${asteroidResult.reason instanceof Error ? asteroidResult.reason.message : "request failed"}`);
  }

  const allFailed = errors.length === 3;

  return {
    mode: allFailed ? "fallback" : errors.length > 0 ? "partial" : "live",
    sourceModes: {
      apod: apodResult.status === "fulfilled" ? "live" : "fallback",
      iss: issResult.status === "fulfilled" ? "live" : "fallback",
      asteroids: asteroidResult.status === "fulfilled" ? "live" : "fallback"
    },
    fetchedAt: new Date().toISOString(),
    apod: apodResult.status === "fulfilled" ? apodResult.value : fallback.apod,
    iss: issResult.status === "fulfilled" ? issResult.value : fallback.iss,
    nearestAsteroid: asteroidResult.status === "fulfilled" ? asteroidResult.value[0] : fallback.nearestAsteroid,
    asteroids: asteroidResult.status === "fulfilled" ? asteroidResult.value : fallback.asteroids,
    errors
  };
}
