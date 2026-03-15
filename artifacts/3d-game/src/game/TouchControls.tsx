import { useEffect, useRef } from "react";

interface TouchState {
  moveJoystick: { active: boolean; id: number; startX: number; startY: number; dx: number; dy: number };
  lookJoystick: { active: boolean; id: number; lastX: number; lastY: number; deltaX: number; deltaY: number };
}

export const touchState: TouchState = {
  moveJoystick: { active: false, id: -1, startX: 0, startY: 0, dx: 0, dy: 0 },
  lookJoystick: { active: false, id: -1, lastX: 0, lastY: 0, deltaX: 0, deltaY: 0 },
};

export let touchJumpPending = false;
export function clearTouchJump() { touchJumpPending = false; }

export let touchShootPending = false;
export function clearTouchShoot() { touchShootPending = false; }

export let touchScopePending = false;
export let touchScopeActive = false;

export default function TouchControls({ onShoot }: { onShoot: () => void }) {
  const moveKnobRef = useRef<HTMLDivElement>(null);
  const lookBaseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      const W = window.innerWidth;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const isLeft = t.clientX < W / 2;

        if (e.type === "touchstart") {
          if (isLeft && !touchState.moveJoystick.active) {
            touchState.moveJoystick = {
              active: true, id: t.identifier,
              startX: t.clientX, startY: t.clientY,
              dx: 0, dy: 0,
            };
          } else if (!isLeft && !touchState.lookJoystick.active) {
            touchState.lookJoystick = {
              active: true, id: t.identifier,
              lastX: t.clientX, lastY: t.clientY,
              deltaX: 0, deltaY: 0,
            };
            if (lookBaseRef.current) {
              lookBaseRef.current.style.left = `${t.clientX - 50}px`;
              lookBaseRef.current.style.top = `${t.clientY - 50}px`;
              lookBaseRef.current.style.opacity = "0.5";
            }
          }
        } else if (e.type === "touchmove") {
          if (touchState.moveJoystick.active && t.identifier === touchState.moveJoystick.id) {
            touchState.moveJoystick.dx = (t.clientX - touchState.moveJoystick.startX) / 55;
            touchState.moveJoystick.dy = (t.clientY - touchState.moveJoystick.startY) / 55;
            if (moveKnobRef.current) {
              const dx = Math.min(1, Math.max(-1, touchState.moveJoystick.dx)) * 38;
              const dy = Math.min(1, Math.max(-1, touchState.moveJoystick.dy)) * 38;
              moveKnobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
            }
          }
          if (touchState.lookJoystick.active && t.identifier === touchState.lookJoystick.id) {
            touchState.lookJoystick.deltaX += t.clientX - touchState.lookJoystick.lastX;
            touchState.lookJoystick.deltaY += t.clientY - touchState.lookJoystick.lastY;
            touchState.lookJoystick.lastX = t.clientX;
            touchState.lookJoystick.lastY = t.clientY;
          }
        } else if (e.type === "touchend" || e.type === "touchcancel") {
          if (touchState.moveJoystick.active && t.identifier === touchState.moveJoystick.id) {
            touchState.moveJoystick = { active: false, id: -1, startX: 0, startY: 0, dx: 0, dy: 0 };
            if (moveKnobRef.current) moveKnobRef.current.style.transform = "translate(0,0)";
          }
          if (touchState.lookJoystick.active && t.identifier === touchState.lookJoystick.id) {
            touchState.lookJoystick = { active: false, id: -1, lastX: 0, lastY: 0, deltaX: 0, deltaY: 0 };
            if (lookBaseRef.current) lookBaseRef.current.style.opacity = "0";
          }
        }
      }
    };

    document.addEventListener("touchstart", handleTouch, { passive: false });
    document.addEventListener("touchmove", handleTouch, { passive: false });
    document.addEventListener("touchend", handleTouch, { passive: false });
    document.addEventListener("touchcancel", handleTouch, { passive: false });
    return () => {
      document.removeEventListener("touchstart", handleTouch);
      document.removeEventListener("touchmove", handleTouch);
      document.removeEventListener("touchend", handleTouch);
      document.removeEventListener("touchcancel", handleTouch);
    };
  }, []);

  const isTouch = typeof window !== "undefined" && ("ontouchstart" in window);
  if (!isTouch) return null;

  const btnStyle = (color: string): React.CSSProperties => ({
    position: "fixed",
    zIndex: 100,
    borderRadius: "50%",
    background: color,
    border: "2px solid rgba(255,255,255,0.3)",
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
    WebkitUserSelect: "none",
  });

  return (
    <>
      {/* ─── MOVE JOYSTICK (left) ─── */}
      <div style={{ position: "fixed", left: 24, bottom: 60, zIndex: 100 }}>
        <div style={{
          width: 110, height: 110, borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
          border: "2px solid rgba(255,255,255,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div ref={moveKnobRef} style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "rgba(255,255,255,0.45)",
            transition: "none",
          }} />
        </div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, textAlign: "center", marginTop: 4, letterSpacing: 1 }}>MOVE</div>
      </div>

      {/* ─── LOOK JOYSTICK BASE (follows touch) ─── */}
      <div ref={lookBaseRef} style={{
        position: "fixed", width: 100, height: 100, borderRadius: "50%",
        background: "rgba(255,255,255,0.08)",
        border: "2px solid rgba(255,255,255,0.18)",
        zIndex: 99, pointerEvents: "none",
        opacity: 0, transition: "opacity 0.1s",
      }} />

      {/* ─── SHOOT button (right side, big) ─── */}
      <div
        onTouchStart={(e) => { e.preventDefault(); onShoot(); }}
        style={{
          ...btnStyle("rgba(220,50,50,0.75)"),
          right: 28, bottom: 80,
          width: 76, height: 76, fontSize: 13,
        }}
      >
        FIRE
      </div>

      {/* ─── JUMP button ─── */}
      <div
        onTouchStart={(e) => { e.preventDefault(); touchJumpPending = true; }}
        style={{
          ...btnStyle("rgba(80,160,255,0.75)"),
          right: 120, bottom: 130,
          width: 58, height: 58, fontSize: 10,
        }}
      >
        JUMP
      </div>

      {/* ─── SCOPE / ADS button ─── */}
      <div
        onTouchStart={(e) => { e.preventDefault(); touchScopeActive = true; }}
        onTouchEnd={(e) => { e.preventDefault(); touchScopeActive = false; }}
        style={{
          ...btnStyle("rgba(60,200,120,0.75)"),
          right: 120, bottom: 60,
          width: 58, height: 58, fontSize: 9,
        }}
      >
        ADS
      </div>

      {/* ─── RELOAD button ─── */}
      <div
        onTouchStart={(e) => {
          e.preventDefault();
          window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyR" }));
        }}
        style={{
          ...btnStyle("rgba(255,180,40,0.7)"),
          right: 200, bottom: 80,
          width: 52, height: 52, fontSize: 9,
        }}
      >
        RELOAD
      </div>
    </>
  );
}
