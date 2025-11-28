"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";

type AvBlock = {
  id: number;
  userId: number;
  userName: string;
  start: string; // ISO
  end: string;   // ISO
};

type Props = {
  currentUserId: number;
};

const COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f97316", // orange
  "#a855f7", // purple
  "#eab308", // yellow
  "#ec4899", // pink
  "#0ea5e9", // sky
];

// Always give the same color for the same userId
function colorForUser(userId: number) {
  const idx = (userId - 1 + COLORS.length * 10) % COLORS.length;
  return COLORS[idx];
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = x.getDay(); // 0 = Sun
  x.setDate(x.getDate() - dow);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function hourShade(hour: number): string {
  const keyframes = [
    { h: 0, l: 20 },
    { h: 5, l: 35 },
    { h: 8, l: 75 },
    { h: 12, l: 90 },
    { h: 16, l: 75 },
    { h: 19, l: 35 },
    { h: 23, l: 20 },
  ];
  let k1 = keyframes[0];
  let k2 = keyframes[keyframes.length - 1];
  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i];
    const b = keyframes[i + 1];
    if (hour >= a.h && hour <= b.h) {
      k1 = a;
      k2 = b;
      break;
    }
  }
  const span = k2.h - k1.h || 1;
  const t = (hour - k1.h) / span;
  const l = k1.l + (k2.l - k1.l) * t;
  return `hsl(215, 55%, ${l}%)`;
}

function formatTimeLabel(hour: number, use24: boolean) {
  if (use24) {
    return hour.toString().padStart(2, "0") + "00";
  }
  const suffix = hour < 12 ? "AM" : "PM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${suffix}`;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = Array.from({ length: 7 }, (_, i) => i);

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function WeeklyCalendar({ currentUserId }: Props) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [blocks, setBlocks] = useState<AvBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [use24, setUse24] = useState(false);
  const [now, setNow] = useState(new Date());

  // popup state
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupStart, setPopupStart] = useState<Date | null>(null);
  const [endDayOffset, setEndDayOffset] = useState(0);
  const [endHour, setEndHour] = useState(0);
  const [saving, setSaving] = useState(false);

  // Load saved time format preference for this user
  useEffect(() => {
    try {
      const key = `timeFormat_${currentUserId}`;
      const saved = typeof window !== "undefined"
        ? window.localStorage.getItem(key)
        : null;
      if (saved === "24") setUse24(true);
      if (saved === "12") setUse24(false);
    } catch {
      // ignore localStorage errors
    }
  }, [currentUserId]);

  // function to toggle and save preference
  function toggleTimeFormat() {
    setUse24((prev) => {
      const next = !prev;
      try {
        const key = `timeFormat_${currentUserId}`;
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, next ? "24" : "12");
        }
      } catch {
        // ignore
      }
      return next;
    });
  }

  // tick current time
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // fetch blocks for week
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      try {
        const qs = new URLSearchParams({
          weekStart: weekStart.toISOString().slice(0, 10),
        });
        const res = await fetch(`/api/availability?${qs.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setBlocks(data.blocks || []);
      } catch (err) {
        if ((err as any).name !== "AbortError") {
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [weekStart]);

  // legend data (user + color)
  const legendUsers = useMemo(() => {
    const map = new Map<number, { id: number; name: string; color: string }>();
    blocks.forEach((b) => {
      if (!map.has(b.userId)) {
        map.set(b.userId, {
          id: b.userId,
          name: b.userName,
          color: colorForUser(b.userId),
        });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [blocks]);

  // who is available now
  const availableNow = useMemo(() => {
    const n = now;
    const list = blocks.filter((b) => {
      const s = new Date(b.start);
      const e = new Date(b.end);
      return s <= n && n < e;
    });
    const byUser = new Map<number, AvBlock>();
    list.forEach((b) => {
      if (!byUser.has(b.userId)) byUser.set(b.userId, b);
    });
    return Array.from(byUser.values());
  }, [blocks, now]);

  const currentTimeDisplay = useMemo(() => {
    return now.toLocaleString(undefined, {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: !use24,
    });
  }, [now, use24]);

  const today = now;

  function cellDate(dayIdx: number, hour: number) {
    const d = addDays(weekStart, dayIdx);
    d.setHours(hour, 0, 0, 0);
    return d;
  }

  function openPopup(dayIdx: number, hour: number) {
    const start = cellDate(dayIdx, hour);
    setPopupStart(start);
    setEndDayOffset(0);
    setEndHour((hour + 1) % 24);
    setPopupOpen(true);
  }

  async function saveAvailability() {
    if (!popupStart) return;
    setSaving(true);
    try {
      const endDate = addDays(popupStart, endDayOffset);
      endDate.setHours(endHour, 0, 0, 0);
      if (!(endDate > popupStart)) {
        alert("End time must be after start time.");
        setSaving(false);
        return;
      }
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: popupStart.toISOString(),
          end: endDate.toISOString(),
        }),
      });
      if (!res.ok) {
        console.error(await res.text());
        alert("Failed to save.");
      } else {
        const qs = new URLSearchParams({
          weekStart: weekStart.toISOString().slice(0, 10),
        });
        const r2 = await fetch(`/api/availability?${qs.toString()}`);
        const data = await r2.json();
        setBlocks(data.blocks || []);
        setPopupOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function clearHere() {
    if (!popupStart) return;
    setSaving(true);
    try {
      const endDate = new Date(popupStart);
      endDate.setHours(popupStart.getHours() + 1);
      await fetch("/api/availability", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: popupStart.toISOString(),
          end: endDate.toISOString(),
        }),
      });
      const qs = new URLSearchParams({
        weekStart: weekStart.toISOString().slice(0, 10),
      });
      const r2 = await fetch(`/api/availability?${qs.toString()}`);
      const data = await r2.json();
      setBlocks(data.blocks || []);
      setPopupOpen(false);
    } finally {
      setSaving(false);
    }
  }

  function blocksForCell(dayIdx: number, hour: number): AvBlock[] {
    const cellStart = cellDate(dayIdx, hour);
    const cellEnd = new Date(cellStart);
    cellEnd.setHours(cellEnd.getHours() + 1);
    return blocks.filter((b) => {
      const s = new Date(b.start);
      const e = new Date(b.end);
      return s < cellEnd && e > cellStart;
    });
  }

  const weekTitle = (() => {
    const end = addDays(weekStart, 6);
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return (
      "Week of " +
      weekStart.toLocaleDateString(undefined, opts) +
      " – " +
      end.toLocaleDateString(undefined, opts)
    );
  })();

  return (
    <div>
      {/* Top controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: ".5rem",
          marginBottom: ".6rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: ".35rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setWeekStart(startOfWeek(addDays(weekStart, -7)))}
            style={navButtonStyle}
          >
            ← Previous week
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            style={navButtonStyle}
          >
            This week
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(startOfWeek(addDays(weekStart, 7)))}
            style={navButtonStyle}
          >
            Next week →
          </button>
          <button
            type="button"
            onClick={toggleTimeFormat}
            style={navButtonStyle}
          >
            {use24 ? "AM / PM" : "24h time"}
          </button>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: ".9rem", fontWeight: 500 }}>{weekTitle}</div>
          <div style={{ fontSize: ".75rem", color: "#6b7280" }}>
            Current time: {currentTimeDisplay}
          </div>
        </div>
      </div>

      {/* Legend */}
      {legendUsers.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: ".35rem .75rem",
            fontSize: ".75rem",
            marginBottom: ".4rem",
          }}
        >
          <span style={{ color: "#6b7280" }}>Colors:</span>
          {legendUsers.map((u) => (
            <span
              key={u.id}
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 9999,
                  backgroundColor: u.color,
                  border:
                    u.id === currentUserId
                      ? "1px solid #111827"
                      : "1px solid rgba(0,0,0,0.25)",
                  boxShadow: "0 1px 1px rgba(15,23,42,0.5)",
                }}
              />
              <span>{u.name}</span>
            </span>
          ))}
        </div>
      )}

      {/* Available now line */}
      <div
        style={{
          fontSize: ".85rem",
          color: "#6b7280",
          marginBottom: ".4rem",
        }}
      >
        {loading
          ? "Loading availability…"
          : availableNow.length === 0
          ? "No one is marked available right now."
          : "Available now: " +
            availableNow
              .map((b) => b.userName)
              .filter((v, i, arr) => arr.indexOf(v) === i)
              .join(", ")}
      </div>

      {/* Calendar */}
      <div
        style={{
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "#f9fafb",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              borderCollapse: "separate",
              borderSpacing: 0,
              minWidth: 800,
              width: "100%",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    position: "sticky",
                    left: 0,
                    zIndex: 3,
                    background: "#e5e7eb",
                    padding: ".4rem .5rem",
                    fontSize: ".8rem",
                    textAlign: "right",
                    borderRight: "1px solid #e5e7eb",
                  }}
                >
                  Time
                </th>
                {DAYS.map((d) => {
                  const date = addDays(weekStart, d);
                  const isToday = sameDay(date, today);
                  return (
                    <th
                      key={d}
                      style={{
                        padding: ".4rem .5rem",
                        fontSize: ".8rem",
                        textAlign: "center",
                        borderBottom: "1px solid #e5e7eb",
                        borderLeft: "1px solid #e5e7eb",
                        background: isToday ? "#dbeafe" : "#e5e7eb",
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                      }}
                    >
                      {date.toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour) => {
                const isNowHour = today.getHours() === hour;
                return (
                  <tr key={hour}>
                    <td
                      style={{
                        position: "sticky",
                        left: 0,
                        zIndex: 1,
                        background: hourShade(hour),
                        color: "#f9fafb",
                        textShadow: "0 1px 2px rgba(0,0,0,.7)",
                        borderRight: "1px solid #e5e7eb",
                        padding: ".25rem .4rem",
                        textAlign: "right",
                        fontSize: ".75rem",
                        whiteSpace: "nowrap",
                        fontWeight: isNowHour ? 700 : 400,
                      }}
                    >
                      {formatTimeLabel(hour, use24)}
                    </td>
                    {DAYS.map((dayIdx) => {
                      const cellBlocks = blocksForCell(dayIdx, hour);
                      const hasNow =
                        sameDay(addDays(weekStart, dayIdx), today) &&
                        today.getHours() === hour;

                      // unique users for this cell
                      const userMap = new Map<number, AvBlock>();
                      cellBlocks.forEach((b) => {
                        if (!userMap.has(b.userId)) userMap.set(b.userId, b);
                      });
                      const users = Array.from(userMap.values());

                      return (
                        <td
                          key={dayIdx}
                          onClick={() => openPopup(dayIdx, hour)}
                          style={{
                            cursor: "pointer",
                            minWidth: 90,
                            height: 26,
                            borderLeft: "1px solid rgba(255,255,255,0.15)",
                            borderTop: "1px solid rgba(0,0,0,0.03)",
                            background: hourShade(hour),
                            position: "relative",
                          }}
                        >
                          {(users.length > 0 || hasNow) && (
                            <div
                              style={{
                                position: "absolute",
                                inset: 2,
                                borderRadius: 8,
                                padding: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 2,
                                border: hasNow
                                  ? "2px solid #ef4444"
                                  : "1px solid rgba(255,255,255,0.35)",
                                background:
                                  users.length > 0
                                    ? "rgba(15,23,42,0.24)"
                                    : "transparent",
                                flexWrap: "nowrap",
                                overflow: "hidden",
                              }}
                            >
                              {users.map((u) => {
                                const color = colorForUser(u.userId);
                                return (
                                  <div
                                    key={u.userId}
                                    style={{
                                      flex: 1,
                                      height: "70%",
                                      minWidth: 6,
                                      borderRadius: 9999,
                                      backgroundColor: color,
                                      border:
                                        u.userId === currentUserId
                                          ? "1px solid #111827"
                                          : "1px solid rgba(255,255,255,0.8)",
                                      boxShadow:
                                        "0 1px 2px rgba(15,23,42,0.5)",
                                    }}
                                  />
                                );
                              })}
                              {users.length === 0 && hasNow && (
                                <div
                                  style={{
                                    flex: 1,
                                    borderRadius: 6,
                                  }}
                                />
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Availability popup */}
      {popupOpen && popupStart && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 30,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: "1rem 1.1rem",
              width: "min(360px, 100% - 2rem)",
              boxShadow: "0 18px 45px rgba(15,23,42,0.35)",
            }}
          >
            <div
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                marginBottom: ".25rem",
              }}
            >
              Set availability
            </div>
            <div
              style={{
                fontSize: ".8rem",
                color: "#6b7280",
                marginBottom: ".6rem",
              }}
            >
              Start:{" "}
              {popupStart.toLocaleString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>

            <div
              style={{
                fontSize: ".8rem",
                color: "#6b7280",
                marginBottom: ".35rem",
              }}
            >
              Available until
            </div>

            <div
              style={{
                display: "flex",
                gap: ".4rem",
                marginBottom: ".5rem",
                flexWrap: "wrap",
              }}
            >
              {[0, 1, 2].map((off) => (
                <button
                  key={off}
                  type="button"
                  onClick={() => setEndDayOffset(off)}
                  style={{
                    borderRadius: 9999,
                    padding: ".25rem .7rem",
                    border: "1px solid #e5e7eb",
                    fontSize: ".8rem",
                    cursor: "pointer",
                    background:
                      endDayOffset === off ? "#111827" : "#f9fafb",
                    color: endDayOffset === off ? "#f9fafb" : "#111827",
                  }}
                >
                  {off === 0 ? "Same day" : off === 1 ? "Next day" : "In 2 days"}
                </button>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                gap: ".75rem",
                alignItems: "center",
                marginBottom: ".75rem",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: 140,
                  maxHeight: 160,
                  overflowY: "auto",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background: "#f9fafb",
                }}
              >
                {HOURS.map((h) => (
                  <div
                    key={h}
                    onClick={() => setEndHour(h)}
                    style={{
                      padding: ".4rem .75rem",
                      display: "flex",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      fontSize: ".85rem",
                      background:
                        endHour === h ? "#dbeafe" : "transparent",
                      fontWeight: endHour === h ? 600 : 400,
                    }}
                  >
                    <span>{h.toString().padStart(2, "0")}00</span>
                    <span style={{ color: "#6b7280", fontSize: ".8rem" }}>
                      {formatTimeLabel(h, false)}
                    </span>
                  </div>
                ))}
              </div>
              <div
                style={{
                  fontSize: ".8rem",
                  color: "#6b7280",
                  maxWidth: 160,
                }}
              >
                Hour (24-hour)
                <br />
                <span style={{ fontSize: ".75rem" }}>
                  Each line shows 24-hour time and 12-hour with AM / PM.
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: ".5rem",
                flexWrap: "wrap",
                marginTop: ".5rem",
              }}
            >
              <button
                type="button"
                onClick={clearHere}
                disabled={saving}
                style={{
                  borderRadius: 9999,
                  padding: ".3rem .8rem",
                  fontSize: ".8rem",
                  background: "#e5e7eb",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Clear my availability here
              </button>
              <div style={{ display: "flex", gap: ".4rem" }}>
                <button
                  type="button"
                  onClick={() => setPopupOpen(false)}
                  disabled={saving}
                  style={{
                    borderRadius: 9999,
                    padding: ".3rem .8rem",
                    fontSize: ".8rem",
                    background: "#e5e7eb",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveAvailability}
                  disabled={saving}
                  style={{
                    borderRadius: 9999,
                    padding: ".3rem .9rem",
                    fontSize: ".8rem",
                    background: "#3b82f6",
                    color: "#ffffff",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const navButtonStyle: React.CSSProperties = {
  borderRadius: 9999,
  padding: ".3rem .8rem",
  fontSize: ".8rem",
  background: "#e5e7eb",
  border: "none",
  cursor: "pointer",
};
