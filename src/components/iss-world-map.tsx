import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";

import worldAtlas from "world-atlas/countries-110m.json";

type IssWorldMapProps = {
  latitude: number;
  longitude: number;
};

type WorldAtlasTopology = Topology<{
  countries: GeometryCollection;
  land: GeometryCollection;
}>;

const VIEW_W = 1000;
const VIEW_H = 500;

const atlas = worldAtlas as unknown as WorldAtlasTopology;
const countries = feature(
  atlas,
  atlas.objects.countries
) as FeatureCollection<Geometry, GeoJsonProperties>;
const projection = geoNaturalEarth1()
  .fitExtent(
    [
      [18, 24],
      [VIEW_W - 18, VIEW_H - 20]
    ],
    { type: "Sphere" }
  );
const path = geoPath(projection);
const graticule = geoGraticule10();

export default function IssWorldMap({ latitude, longitude }: IssWorldMapProps) {
  const [markerX, markerY] = projection([longitude, latitude]) ?? [VIEW_W / 2, VIEW_H / 2];

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "var(--r-md)",
        border: "1px solid var(--c-line)",
        background: "#06070b",
        aspectRatio: "1000 / 500"
      }}
      data-testid="iss-world-map"
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block", width: "100%", height: "100%" }}
        aria-label="World map with ISS position"
      >
        <defs>
          <linearGradient id="iss-ocean" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.22 0.026 225)" />
            <stop offset="100%" stopColor="oklch(0.14 0.018 240)" />
          </linearGradient>
          <radialGradient id="iss-glow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="var(--c-accent)" stopOpacity="0.7" />
            <stop offset="65%" stopColor="var(--c-accent)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--c-accent)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width={VIEW_W} height={VIEW_H} fill="url(#iss-ocean)" />
        <path
          d={path({ type: "Sphere" }) ?? undefined}
          fill="none"
          stroke="oklch(0.5 0.06 230)"
          strokeWidth="1"
          opacity="0.3"
        />
        <path
          d={path(graticule) ?? undefined}
          fill="none"
          stroke="oklch(0.62 0.055 230)"
          strokeWidth="0.6"
          opacity="0.18"
        />

        <g
          fill="oklch(0.34 0.02 240)"
          stroke="oklch(0.58 0.05 230)"
          strokeWidth="0.45"
          opacity="0.96"
        >
          {countries.features.map((country) => (
            <path
              key={country.id ?? country.properties?.name}
              d={path(country) ?? undefined}
            />
          ))}
        </g>

        <g transform={`translate(${markerX} ${markerY})`}>
          <circle r="30" fill="url(#iss-glow)" />
          <circle
            r="15"
            fill="color-mix(in oklch, var(--c-bg) 48%, transparent)"
            stroke="var(--c-accent)"
            strokeWidth="2"
          />
          <circle r="4" fill="var(--c-accent)" />
          <text
            y="4"
            textAnchor="middle"
            fill="var(--c-fg)"
            fontFamily="var(--t-mono)"
            fontSize="10"
            fontWeight="700"
          >
            ISS
          </text>
        </g>
      </svg>
    </div>
  );
}
