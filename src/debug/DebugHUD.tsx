"use client";

import { useEffect, useState } from "react";
import { clearDbg, getDbg } from "./dbg";

export default function DebugHUD() {
  const [items, setItems] = useState(getDbg());

  useEffect(() => {
    const onEv = () => setItems(getDbg().slice()); // 새 배열로 트리거
    window.addEventListener("__DBG_EVENT__", onEv as EventListener);
    return () =>
      window.removeEventListener("__DBG_EVENT__", onEv as EventListener);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        right: 8,
        bottom: 8,
        zIndex: 10_000,
        width: "min(90vw, 380px)",
        maxHeight: "40vh",
        overflow: "auto",
        background: "rgba(10,10,10,0.85)",
        color: "#fff",
        fontSize: 12,
        padding: 8,
        borderRadius: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <strong>DebugHUD</strong>
        <button
          onClick={() => {
            clearDbg();
            setItems(getDbg());
          }}
          style={{
            color: "#f66",
            background: "transparent",
            border: "1px solid #f66",
            borderRadius: 4,
            padding: "2px 6px",
          }}
        >
          Clear
        </button>
        <button
          onClick={() => {
            try {
              localStorage.removeItem("__DBG");
            } catch {}
            location.reload();
          }}
          style={{
            color: "#9cf",
            background: "transparent",
            border: "1px solid #9cf",
            borderRadius: 4,
            padding: "2px 6px",
          }}
        >
          Reload
        </button>
      </div>

      {items.length === 0 ? (
        <div style={{ opacity: 0.6 }}>no logs…</div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {items.slice(-200).map((it, i) => (
            <li
              key={i}
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                padding: "4px 0",
              }}
            >
              <div>
                <span style={{ opacity: 0.6, marginRight: 6 }}>
                  {new Date(it.t).toLocaleTimeString()}
                </span>
                <code>{it.tag}</code>
              </div>
              {it.data ? (
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                  }}
                >
                  {JSON.stringify(it.data, null, 2)}
                </pre>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
