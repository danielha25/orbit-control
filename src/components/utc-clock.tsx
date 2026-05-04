"use client";

import { useEffect, useState } from "react";

export default function UtcClock() {
  const [time, setTime] = useState<string>(() => new Date().toISOString().slice(11, 19));

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toISOString().slice(11, 19));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="oc-clock" data-testid="topbar-utc-clock">
      <span className="oc-clock__lbl">UTC</span>
      <span className="oc-clock__v">{time}</span>
    </div>
  );
}
