import { useEffect, useRef, useState } from "react";
import { createGameState, resetGame, update, VIEW_H, VIEW_W } from "@/game/engine";
import { render } from "@/game/renderer";
import type { GameState, Input } from "@/game/types";
import oooLogo from "@assets/OOO-logo_1777181952692.png";

const BRAND_PINK = "#E31992";
const BRAND_ORANGE = "#FC4C00";

const SWIPE_DEADZONE = 10;
const TAP_MOVE_THRESHOLD = 14;
const JUMP_PULSE_SECONDS = 0.18;

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState>(createGameState());
  const inputRef = useRef<Input>({ left: false, right: false, jump: false });
  const keyHoldRef = useRef({ left: false, right: false, jump: false });
  const swipeRef = useRef({ left: false, right: false });
  const jumpPulseRef = useRef(0);
  const [showOverlay, setShowOverlay] = useState(true);

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

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(raf);
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
        if (state.status !== "playing") {
          resetGame(state);
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
  }, []);

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

    const tryRestart = () => {
      const state = stateRef.current;
      if (state.status !== "playing") {
        resetGame(state);
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
      tryRestart();
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

  const onCanvasClick = () => {
    setShowOverlay(false);
    const state = stateRef.current;
    if (state.status !== "playing") {
      resetGame(state);
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
        {showOverlay && <StartOverlay onDismiss={() => setShowOverlay(false)} />}
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
          <span className="font-bold" style={{ color: BRAND_PINK }}>
            SWIPE
          </span>{" "}
          to walk
        </p>
        <p className="text-white-200 text-[16px]">
          <span className="font-bold" style={{ color: BRAND_PINK }}>
            TAP
          </span>{" "}
          to jump
        </p>
        <p className="text-white-200 mt-4 text-[16px]">
          <span className="font-bold" style={{ color: BRAND_ORANGE }}>
            🕐 CLOCK
          </span>
          {" "}collect for PTO hours
        </p>
        <p className="text-white-200 mt-4 text-[16px]">
          <span className="font-bold" style={{ color: BRAND_PINK }}>
            👨🏻‍💼✉️🔔 BOSS, EMAILS, AND TEAMS PINGS
          </span>
          {" "}don't let them catch you
        </p>
        <p className="text-white-200 mt-4 text-[16px]">
          <span className="font-bold" style={{ color: BRAND_ORANGE }}>
            ☕ COFFEE
          </span>
          {" "}gives you a speed boost
        </p>
        <p className="text-white-200 text-[16px]">
          <span className="font-bold" style={{ color: BRAND_PINK }}>
            🎧 HEADPHONES
          </span>
          {" "}make you untouchable
        </p>
        <p className="text-white-200 text-[16px]">
          <span className="font-bold" style={{ color: BRAND_ORANGE }}>
            🏠 WORK FROM HOME
          </span>
          {" "}lets you float and jump higher
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
