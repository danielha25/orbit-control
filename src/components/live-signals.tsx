"use client";

import { useEffect, useState } from "react";

export default function LiveSignals() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1500);
    return () => clearInterval(id);
  }, []);

  const issLat = (Math.sin(tick / 9) * 51.6).toFixed(2);
  const issLon = (((tick * 4.1) % 360) - 180).toFixed(2);
  const neoCount = 3 + (tick % 2);

  return (
    <div className="oc-signals" data-testid="sidebar-live-signals">
      <div className="oc-sig">
        <span className="oc-sig__k">ISS</span>
        <span className="oc-sig__v">
          {issLat}°, {issLon}°
        </span>
      </div>
      <div className="oc-sig">
        <span className="oc-sig__k">NEO</span>
        <span className="oc-sig__v">{neoCount} tracked</span>
      </div>
      <div className="oc-sig">
        <span className="oc-sig__k">APOD</span>
        <span className="oc-sig__v oc-sig__v--ok">synced</span>
      </div>
    </div>
  );
}
