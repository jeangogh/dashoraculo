"use client"
// ═══════════════════════════════════════════════════════════════
// Σ — Oracle Universal Tracker
//
// COMO USAR EM QUALQUER APP NEXT.JS:
// 1. Copie este arquivo pro seu projeto
// 2. No layout.tsx, adicione: <OracleTracker appName="nomedoapp" />
// 3. Pronto. Eventos vão pro cérebro central do Oráculo.
//
// Eventos automáticos: page_view, session_summary
// Eventos manuais: import { oracleTrack } from "./universal-tracker"
//                  oracleTrack("task_complete", { taskId: "123" })
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

const ORACLE_API = process.env.NEXT_PUBLIC_ORACLE_API || "https://app.ahsdlab.com/api/oracle"

let _appName = "unknown"
let _sessionId = ""
let _startedAt = 0
let _currentPage = ""

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function getFingerprint() {
  if (typeof window === "undefined") return "server"
  const raw = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
  ].join("|")
  let h = 0
  for (let i = 0; i < raw.length; i++) {
    h = (h << 5) - h + raw.charCodeAt(i)
    h |= 0
  }
  return "fp_" + Math.abs(h).toString(36)
}

function getUTM() {
  if (typeof window === "undefined") return {}
  const p = new URLSearchParams(window.location.search)
  const utm: Record<string, string> = {}
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
    const v = p.get(k)
    if (v) utm[k] = v
  }
  return utm
}

function send(event: string, metadata?: Record<string, unknown>) {
  if (typeof window === "undefined") return
  if (!_sessionId) _sessionId = genId()

  const payload = {
    session_id: _sessionId,
    app: _appName,
    event,
    device: getFingerprint(),
    metadata: {
      page: _currentPage,
      ...getUTM(),
      ...metadata,
    },
  }

  // sendBeacon pra não perder evento no unload
  if (navigator.sendBeacon) {
    navigator.sendBeacon(ORACLE_API, JSON.stringify(payload))
  } else {
    fetch(ORACLE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {})
  }
}

// Exporta pra uso manual: oracleTrack("task_complete", { taskId: "x" })
export function oracleTrack(event: string, metadata?: Record<string, unknown>) {
  send(event, metadata)
}

// Componente React — cola no layout.tsx
export function OracleTracker({ appName }: { appName: string }) {
  const pathname = usePathname()
  const mounted = useRef(false)

  useEffect(() => {
    _appName = appName
    if (!_sessionId) _sessionId = genId()
    if (!_startedAt) _startedAt = Date.now()

    // Flush session_summary no unload
    const flush = () => {
      const screenTime = Math.round((Date.now() - _startedAt) / 1000)
      if (screenTime > 5) {
        send("session_summary", {
          screen_time: screenTime,
          peak_hour: new Date().getHours(),
          exit_page: _currentPage,
        })
      }
    }

    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush()
    })
    window.addEventListener("beforeunload", flush)

    mounted.current = true
    return () => {
      window.removeEventListener("beforeunload", flush)
    }
  }, [appName])

  // Track page view em cada mudança de rota
  useEffect(() => {
    if (!mounted.current) return
    _currentPage = pathname
    send("page_view", { page: pathname })
  }, [pathname])

  return null
}
