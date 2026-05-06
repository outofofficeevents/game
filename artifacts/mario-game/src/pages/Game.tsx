import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createGameState, resetGame, update, VIEW_H, VIEW_W } from "@/game/engine";
import { render } from "@/game/renderer";
import type { GameState, Input } from "@/game/types";
import oooLogo from "@assets/OOO-logo_1777181952692.png";
import {
  useSubmitScore,
  useGetLeaderboard,
  getGetLeaderboardQueryKey,
} from "@workspace/api-client-react";
import type { ScoreEntry } from "@workspace/api-client-react";

const BRAND_PINK = "#E31992";
const BRAND_ORANGE = "#FC4C00";

const SWIPE_DEADZONE = 10;
const TAP_MOVE_THRESHOLD = 14;
const JUMP_PULSE_SECONDS = 0.18;

type Phase = "playing" | "entering-name" | "leaderboard";

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState>(createGameState());
  const inputRef = useRef<Input>({ left: false, right: false, jump: false });
  const keyHoldRef = useRef({ left: false, right: false, jump: false });
  const swipeRef = useRef({ left: false, right: false });
  const jumpPulseRef = useRef(0);
  const prevStatusRef = useRef<GameState["status"]>("playing");
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showOverlay, setShowOverlay] = useState(true);
  const [phase, setPhase] = useState<Phase>("playing");
  const [finalScore, setFinalScore] = useState(0);
  const [wonGame, setWonGame] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = VIEW_W;
    canvas.height = VIEW_H;

    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      const state = stateRef.current;

      const k = keyHoldRef.current;
      const sw = swipeRef.current;
      inputRef.current.left = k.left || sw.left;
      inputRef.current.right = k.right || sw.right;
      inputRef.current.jump = k.jump || jumpPulseRef.current > 0;
      if (jumpPulseRef.current > 0) jumpPulseRef.current -= dt;

      update(state, inputRef.current, dt);
      render(ctx, state);

      if (
        state.status !== prevStatusRef.current &&
        (state.status === "dead" || state.status === "won") &&
        prevStatusRef.current === "playing"
      ) {
        prevStatusRef.current = state.status;
        const score = state.score;
        const isWon = state.status === "won";
        endTimerRef.current = setTimeout(() => {
          setFinalScore(score);
          setWonGame(isWon);
          setPhase("entering-name");
        }, 1800);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      if (endTimerRef.current) clearTimeout(endTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const hold = keyHoldRef.current;
      if (k === "arrowleft" || k === "a") {
        hold.left = down;
        e.preventDefault();
      } else if (k === "arrowright" || k === "d") {
        hold.right = down;
        e.preventDefault();
      } else if (k === " " || k === "arrowup" || k === "w" || k === "z") {
        hold.jump = down;
        e.preventDefault();
      } else if (down && (k === "r" || k === "enter")) {
        const state = stateRef.current;
        if (state.status !== "playing" && phase === "playing") {
          handleRestart();
        }
      }
    };
    const dn = onKey(true);
    const up = onKey(false);
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", dn);
      window.removeEventListener("keyup", up);
    };
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    type TouchRec = {
      startX: number;
      startY: number;
      lastX: number;
      lastY: number;
      moved: boolean;
    };
    const touches = new Map<number, TouchRec>();

    const recomputeSwipe = () => {
      const sw = swipeRef.current;
      sw.left = false;
      sw.right = false;
      for (const rec of touches.values()) {
        const dx = rec.lastX - rec.startX;
        if (dx > SWIPE_DEADZONE) sw.right = true;
        else if (dx < -SWIPE_DEADZONE) sw.left = true;
      }
    };

    const onStart = (e: TouchEvent) => {
      e.preventDefault();
      for (const t of Array.from(e.changedTouches)) {
        touches.set(t.identifier, {
          startX: t.clientX,
          startY: t.clientY,
          lastX: t.clientX,
          lastY: t.clientY,
          moved: false,
        });
      }
      setShowOverlay(false);
    };

    const onMove = (e: TouchEvent) => {
      e.preventDefault();
      for (const t of Array.from(e.changedTouches)) {
        const rec = touches.get(t.identifier);
        if (!rec) continue;
        rec.lastX = t.clientX;
        rec.lastY = t.clientY;
        const dx = t.clientX - rec.startX;
        const dy = t.clientY - rec.startY;
        if (Math.hypot(dx, dy) > TAP_MOVE_THRESHOLD) {
          rec.moved = true;
        }
      }
      recomputeSwipe();
    };

    const onEnd = (e: TouchEvent) => {
      e.preventDefault();
      for (const t of Array.from(e.changedTouches)) {
        const rec = touches.get(t.identifier);
        if (rec && !rec.moved) {
          jumpPulseRef.current = JUMP_PULSE_SECONDS;
        }
        touches.delete(t.identifier);
      }
      recomputeSwipe();
    };

    canvas.addEventListener("touchstart", onStart, { passive: false });
    canvas.addEventListener("touchmove", onMove, { passive: false });
    canvas.addEventListener("touchend", onEnd, { passive: false });
    canvas.addEventListener("touchcancel", onEnd, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", onStart);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("touchend", onEnd);
      canvas.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  const handleRestart = () => {
    if (endTimerRef.current) clearTimeout(endTimerRef.current);
    prevStatusRef.current = "playing";
    resetGame(stateRef.current);
    setPhase("playing");
    setShowOverlay(false);
  };

  const onCanvasClick = () => {
    setShowOverlay(false);
    if (phase !== "playing") return;
    const state = stateRef.current;
    if (state.status !== "playing") {
      return;
    } else {
      jumpPulseRef.current = JUMP_PULSE_SECONDS;
    }
  };

  return (
    <div className="fixed inset-0 bg-black no-select flex items-center justify-center">
      <div className="relative h-full" style={{ width: "100%", maxWidth: 490 }}>
        <canvas
          ref={canvasRef}
          onClick={onCanvasClick}
          className="absolute inset-0 w-full h-full pixelated"
          style={{ touchAction: "none" }}
        />
        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-end justify-center pointer-events-none px-3 pb-2 pt-6 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
          <img
            src={oooLogo}
            alt="Out of Office"
            className="w-full h-10 sm:h-12 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]"
          />
        </div>
        {showOverlay && phase === "playing" && (
          <StartOverlay onDismiss={() => setShowOverlay(false)} />
        )}
        {phase === "entering-name" && (
          <NameEntryOverlay
            score={finalScore}
            won={wonGame}
            onSubmitted={() => {
              queryClient.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
              setPhase("leaderboard");
            }}
            onSkip={() => {
              queryClient.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
              setPhase("leaderboard");
            }}
          />
        )}
        {phase === "leaderboard" && (
          <LeaderboardOverlay score={finalScore} onPlayAgain={handleRestart} />
        )}
      </div>
    </div>
  );
}

function StartOverlay({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      onClick={onDismiss}
      onTouchStart={onDismiss}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 text-white p-6 cursor-pointer text-center"
    >
      <img
        src={oooLogo}
        alt="Out of Office"
        className="w-64 max-w-[80%] mb-2 drop-shadow-[0_4px_12px_rgba(227,25,146,0.4)]"
      />
      <p
        className="text-xs tracking-[0.4em] mb-3"
        style={{ color: BRAND_ORANGE }}
      >The Game</p>
      <p className="md:text-base mt-4 mb-8 text-white-300 text-[16px]">Are you ready to clock out and tap in!<br />The party isn't until <i><b>Friday, October 16th</b></i> but, in the meantime, you can play Out of Office: The Game.</p>
      <div className="space-y-3 text-center text-sm max-w-xs">
        <p className="text-white-200 text-[16px]">
          <span className="font-bold" style={{ color: BRAND_PINK }}>SWIPE</span>{" "}to walk
        </p>
        <p className="text-white-200 text-[16px]">
          <span className="font-bold" style={{ color: BRAND_PINK }}>TAP</span>{" "}to jump
        </p>
        <p className="text-white-200 mt-4 text-[16px]">
          <span className="font-bold" style={{ color: BRAND_ORANGE }}>🕐 CLOCK</span>{" "}collect for PTO hours
        </p>
        <p className="text-white-200 mt-4 text-[16px]">
          <span className="font-bold" style={{ color: BRAND_PINK }}>👨🏻‍💼✉️🔔 BOSS, EMAILS, AND TEAMS PINGS</span>{" "}don't let them catch you
        </p>
        <p className="text-white-200 mt-4 text-[16px]">
          <span className="font-bold" style={{ color: BRAND_ORANGE }}>☕ COFFEE</span>{" "}gives you a speed boost
        </p>
        <p className="text-white-200 text-[16px]">
          <span className="font-bold" style={{ color: BRAND_PINK }}>🎧 HEADPHONES</span>{" "}make you untouchable
        </p>
        <p className="text-white-200 text-[16px]">
          <span className="font-bold" style={{ color: BRAND_ORANGE }}>🏠 WORK FROM HOME</span>{" "}lets you float and jump higher
        </p>
      </div>
      <p
        className="mt-10 animate-pulse font-bold text-[28px] text-center"
        style={{ color: BRAND_PINK }}
      >
        TAP TO START
      </p>
    </div>
  );
}

function NameEntryOverlay({
  score,
  won,
  onSubmitted,
  onSkip,
}: {
  score: number;
  won: boolean;
  onSubmitted: () => void;
  onSkip: () => void;
}) {
  const [name, setName] = useState("");
  const submitMutation = useSubmitScore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    submitMutation.mutate(
      { data: { playerName: trimmed, score } },
      { onSettled: () => onSubmitted() },
    );
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 text-white px-6 text-center">
      <img
        src={oooLogo}
        alt="Out of Office"
        className="w-48 max-w-[70%] mb-4 drop-shadow-[0_4px_12px_rgba(227,25,146,0.4)]"
      />
      <p
        className="text-2xl font-bold mb-1 tracking-wide"
        style={{ color: won ? BRAND_ORANGE : BRAND_PINK }}
      >
        {won ? "YOU MADE IT! 🎉" : "GAME OVER"}
      </p>
      <p className="text-4xl font-bold mb-6" style={{ color: BRAND_PINK }}>
        {score.toLocaleString()} <span className="text-xl font-normal text-white/70">pts</span>
      </p>
      <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 30))}
          placeholder="Enter your name"
          maxLength={30}
          autoFocus
          className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-center text-lg focus:outline-none focus:border-pink-500"
          style={{ caretColor: BRAND_PINK }}
        />
        <button
          type="submit"
          disabled={!name.trim() || submitMutation.isPending}
          className="w-full py-3 rounded-lg font-bold text-lg text-white disabled:opacity-50 transition-opacity"
          style={{ background: BRAND_PINK }}
        >
          {submitMutation.isPending ? "Saving…" : "Submit Score"}
        </button>
      </form>
      <button
        onClick={onSkip}
        className="mt-4 text-sm text-white/40 hover:text-white/70 transition-colors"
      >
        Skip
      </button>
    </div>
  );
}

function LeaderboardOverlay({
  score,
  onPlayAgain,
}: {
  score: number;
  onPlayAgain: () => void;
}) {
  const { data, isLoading } = useGetLeaderboard();
  const entries: ScoreEntry[] = data?.entries ?? [];

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center bg-black/90 text-white px-4 pt-6 pb-4 overflow-y-auto">
      <img
        src={oooLogo}
        alt="Out of Office"
        className="w-40 max-w-[60%] mb-2 drop-shadow-[0_4px_12px_rgba(227,25,146,0.4)]"
      />
      <p
        className="text-xs tracking-[0.35em] mb-4"
        style={{ color: BRAND_ORANGE }}
      >
        LEADERBOARD
      </p>

      <div className="w-full max-w-xs flex-1">
        {isLoading ? (
          <p className="text-center text-white/50 mt-8">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-center text-white/50 mt-8">No scores yet. Be the first!</p>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry, i) => {
              const isYou = entry.score === score;
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
              return (
                <li
                  key={entry.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  style={{
                    background: isYou ? "rgba(227,25,146,0.18)" : "rgba(255,255,255,0.05)",
                    border: isYou ? `1px solid ${BRAND_PINK}44` : "1px solid transparent",
                  }}
                >
                  <span className="w-7 text-center text-sm font-bold" style={{ color: BRAND_ORANGE }}>
                    {medal ?? `#${i + 1}`}
                  </span>
                  <span className="flex-1 truncate text-sm font-medium">
                    {entry.playerName}
                    {isYou && (
                      <span className="ml-1 text-xs" style={{ color: BRAND_PINK }}>
                        (you)
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: BRAND_PINK }}>
                    {entry.score.toLocaleString()}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <button
        onClick={onPlayAgain}
        className="mt-6 w-full max-w-xs py-3 rounded-lg font-bold text-lg text-white"
        style={{ background: BRAND_PINK }}
      >
        Play Again
      </button>
    </div>
  );
}
