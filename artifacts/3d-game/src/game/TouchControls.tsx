import { useEffect, useRef } from "react";

interface TouchState {
  moveJoystick: { active: boolean; id: number; startX: number; startY: number; dx: number; dy: number };
  lookJoystick: { active: boolean; id: number; startX: number; startY: number; dx: number; dy: number };
}

export const touchState: TouchState = {
  moveJoystick: { active: false, id: -1, startX: 0, startY: 0, dx: 0, dy: 0 },
  lookJoystick: { active: false, id: -1, startX: 0, startY: 0, dx: 0, dy: 0 },
};

export let touchShootPending = false;
export function clearTouchShoot() { touchShootPending = false; }

export default function TouchControls({ onShoot }: { onShoot: () => void }) {
  const moveKnobRef = useRef<HTMLDivElement>(null);
  const lookKnobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isTouch = 'ontouchstart' in window;
    if (!isTouch) return;

    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      const W = window.innerWidth;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const isLeft = t.clientX < W / 2;

        if (e.type === "touchstart") {
          if (isLeft && !touchState.moveJoystick.active) {
            touchState.moveJoystick = { active: true, id: t.identifier, startX: t.clientX, startY: t.clientY, dx: 0, dy: 0 };
          } else if (!isLeft && !touchState.lookJoystick.active) {
            touchState.lookJoystick = { active: true, id: t.identifier, startX: t.clientX, startY: t.clientY, dx: 0, dy: 0 };
          }
        } else if (e.type === "touchmove") {
          if (touchState.moveJoystick.active && t.identifier === touchState.moveJoystick.id) {
            touchState.moveJoystick.dx = (t.clientX - touchState.moveJoystick.startX) / 60;
            touchState.moveJoystick.dy = (t.clientY - touchState.moveJoystick.startY) / 60;
            if (moveKnobRef.current) {
              const dx = Math.min(1, Math.max(-1, touchState.moveJoystick.dx)) * 40;
              const dy = Math.min(1, Math.max(-1, touchState.moveJoystick.dy)) * 40;
              moveKnobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
            }
          }
          if (touchState.lookJoystick.active && t.identifier === touchState.lookJoystick.id) {
            touchState.lookJoystick.dx = (t.clientX - touchState.lookJoystick.startX) / 50;
            touchState.lookJoystick.dy = (t.clientY - touchState.lookJoystick.startY) / 50;
            touchState.lookJoystick.startX = t.clientX;
            touchState.lookJoystick.startY = t.clientY;
            touchState.lookJoystick.dx = (t.clientX - touchState.lookJoystick.startX);
            touchState.lookJoystick.dy = (t.clientY - touchState.lookJoystick.startY);
            if (lookKnobRef.current) {
              const dx2 = Math.min(1, Math.max(-1, touchState.lookJoystick.dx / 60)) * 40;
              const dy2 = Math.min(1, Math.max(-1, touchState.lookJoystick.dy / 60)) * 40;
              lookKnobRef.current.style.transform = `translate(${dx2}px, ${dy2}px)`;
            }
          }
        } else if (e.type === "touchend" || e.type === "touchcancel") {
          if (touchState.moveJoystick.active && t.identifier === touchState.moveJoystick.id) {
            touchState.moveJoystick = { active: false, id: -1, startX: 0, startY: 0, dx: 0, dy: 0 };
            if (moveKnobRef.current) moveKnobRef.current.style.transform = "translate(0, 0)";
          }
          if (touchState.lookJoystick.active && t.identifier === touchState.lookJoystick.id) {
            touchState.lookJoystick = { active: false, id: -1, startX: 0, startY: 0, dx: 0, dy: 0 };
            if (lookKnobRef.current) lookKnobRef.current.style.transform = "translate(0, 0)";
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

  const isTouch = typeof window !== "undefined" && 'ontouchstart' in window;
  if (!isTouch) return null;

  return (
    <>
      <div style={{ position: "fixed", left: 30, bottom: 50, zIndex: 100 }}>
        <div style={{ width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div ref={moveKnobRef} style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.5)", transition: "none" }} />
        </div>
        <div style={{ color: "#fff", fontSize: 10, textAlign: "center", marginTop: 4, opacity: 0.7 }}>MOVE</div>
      </div>

      <div style={{ position: "fixed", right: 30, bottom: 50, zIndex: 100 }}>
        <div style={{ width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div ref={lookKnobRef} style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,100,100,0.6)", transition: "none" }} />
        </div>
        <div style={{ color: "#fff", fontSize: 10, textAlign: "center", marginTop: 4, opacity: 0.7 }}>LOOK</div>
      </div>

      <button
        onTouchStart={() => onShoot()}
        style={{ position: "fixed", right: 150, bottom: 60, zIndex: 100, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,50,50,0.7)", border: "2px solid rgba(255,100,100,0.8)", color: "#fff", fontSize: 12, fontWeight: "bold" }}
      >
        FIRE
      </button>
    </>
  );
}
