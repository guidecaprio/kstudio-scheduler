"use client";
import React, { useMemo, useState, useEffect } from "react";

const BUFFER_MIN = 15;

const SERVICES: Record<string, number> = {
  "Manutenção 100–150g": 105 + BUFFER_MIN,
  "Manutenção 200–250g": 150 + BUFFER_MIN,
  "Aplicação 100–150g": 120 + BUFFER_MIN,
  "Aplicação 200–250g": 180 + BUFFER_MIN,
  "Escovar e modelar": 45 + BUFFER_MIN,
  "Lavar": 25 + BUFFER_MIN,
};

const SESSIONS = [
  { label: "Manhã", start: "09:30", end: "13:00" },
  { label: "Tarde", start: "14:30", end: "19:00" },
] as const;

type SessionLabel = typeof SESSIONS[number]["label"];
type SlotStatus = "DISPONIVEL" | "DISPUTA" | "CHEIO";

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function minutesToHHMM(mins: number) {
  const h = Math.floor(mins / 60).toString().padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}
function generateStarts(sessionStart: string, sessionEnd: string, durationMin: number, step = 15) {
  const out: string[] = [];
  const start = toMinutes(sessionStart);
  const end = toMinutes(sessionEnd);
  for (let t = start; t + durationMin <= end; t += step) {
    out.push(minutesToHHMM(t));
  }
  return out;
}

function StatusPill({ status }: { status: SlotStatus }) {
  const map = {
    DISPONIVEL: "bg-green-100 text-green-800",
    DISPUTA: "bg-amber-100 text-amber-800",
    CHEIO: "bg-gray-200 text-gray-700",
  } as const;
  const text = { DISPONIVEL: "Disponível", DISPUTA: "Em Disputa", CHEIO: "Cheio" }[status];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}>{text}</span>;
}

function Countdown({ seconds, onExpire }: { seconds: number; onExpire?: () => void }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) { onExpire?.(); return; }
    const id = setInterval(() => setLeft((x) => x - 1), 1000);
    return () => clearInterval(id);
  }, [left, onExpire]);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return <div className="flex items-center gap-1 text-xs"><span>⏱</span><span>{mm}:{ss}</span></div>;
}

export default function Scheduler() {
  const [service, setService] = useState<keyof typeof SERVICES>("Manutenção 100–150g");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [strategicBlocks, setStrategicBlocks] = useState<Record<string, boolean>>({});
  const [holdSeconds, setHoldSeconds] = useState(30 * 60);

  const duration = SERVICES[service];
  const grid = useMemo(() => {
    const bySession: Record<SessionLabel, string[]> = { Manhã: [], Tarde: [] } as any;
    for (const s of SESSIONS) bySession[s.label] = generateStarts(s.start, s.end, duration, 15);
    return bySession;
  }, [duration]);

  function statusForSlot(hhmm: string): SlotStatus {
    if (strategicBlocks[hhmm]) return "DISPUTA";
    const n = parseInt(hhmm.replace(":", ""), 10);
    if (n % 6 === 0) return "CHEIO";
    if (n % 4 === 0) return "DISPUTA";
    return "DISPONIVEL";
  }
  function toggleStrategic(hhmm: string) {
    setStrategicBlocks((p) => ({ ...p, [hhmm]: !p[hhmm] }));
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Agenda K!Studio</h1>
          <p className="text-sm text-gray-500">Estados públicos: Disponível / Em Disputa / Cheio — sem dados pessoais.</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full border px-2 py-1">Stripe (Cartão/Klarna)</span>
          <span className="rounded-full border px-2 py-1">MB Way</span>
        </div>
      </header>

      <section className="mb-4 grid gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <label className="text-sm">Serviço (inclui {BUFFER_MIN} min buffer)</label>
          <select className="mt-1 w-full rounded border p-2" value={service} onChange={(e) => setService(e.target.value as any)}>
            {Object.entries(SERVICES).map(([k, v]) => (
              <option key={k} value={k}>{k} — {Math.floor(v/60)}h{String(v%60).padStart(2, '0')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm">Data</label>
          <input type="date" className="mt-1 w-full rounded border p-2" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Hold “Em Disputa” (min.)</label>
          <input type="number" min={5} max={240} className="mt-1 w-full rounded border p-2" value={Math.floor(holdSeconds/60)} onChange={(e) => setHoldSeconds(Number(e.target.value)*60)} />
        </div>
      </section>

      {SESSIONS.map((session) => (
        <section key={session.label} className="mb-6 rounded-xl border p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">{session.label} — {session.start} às {session.end}</h2>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Slots a cada 15 min. Não cruza a pausa.</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {grid[session.label].map((hhmm) => {
              const status = statusForSlot(hhmm);
              const isDispute = status === "DISPUTA";
              const isFull = status === "CHEIO";
              return (
                <div key={`${session.label}-${hhmm}`} className={`rounded-xl border p-3 ${isFull ? 'bg-gray-50' : isDispute ? 'bg-amber-50' : 'bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{hhmm}</div>
                    <StatusPill status={status} />
                  </div>
                  <div className="mt-1 text-xs text-gray-500">Duração total: {Math.floor(duration/60)}h{String(duration%60).padStart(2, '0')}</div>
                  {isDispute && (
                    <div className="mt-2 flex items-center justify-between">
                      <Countdown seconds={holdSeconds} />
                      <button className="rounded-md bg-black px-3 py-1 text-xs text-white">Disputar</button>
                    </div>
                  )}
                  {status === "DISPONIVEL" && (
                    <div className="mt-2">
                      <button className="w-full rounded-md bg-black px-3 py-1 text-xs text-white">Reservar</button>
                    </div>
                  )}
                  {isFull && (
                    <div className="mt-2 text-[11px] text-gray-500">Entre na lista de espera</div>
                  )}
                  <div className="mt-3 flex items-center justify-between border-t pt-2">
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                      <span>Bloqueio estratégico</span>
                      <input type="checkbox" checked={!!strategicBlocks[hhmm]} onChange={() => toggleStrategic(hhmm)} />
                    </div>
                    <div className="text-[11px] text-gray-500">Sem dados pessoais</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <section className="rounded-xl border p-4 text-sm text-gray-600">
        <p><b>Notas técnicas:</b> Integrações de pagamento e Google Calendar serão ligadas por API routes do Next.js (webhooks do Stripe e OAuth do Google). Este protótipo não coleta dados pessoais.</p>
      </section>
    </main>
  );
}
