"use client";

import { useEffect, useState } from "react";

// Current time in India, refreshed every 20 seconds; empty until mounted to avoid a hydration mismatch
export function useIstClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const format = () =>
      new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });
    setTime(format());
    const id = window.setInterval(() => setTime(format()), 20_000);
    return () => window.clearInterval(id);
  }, []);
  return time;
}
