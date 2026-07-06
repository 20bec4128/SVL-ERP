import { useEffect, useState } from "react";

let activeLoaders = 0;
const listeners = new Set();

function notify() {
  const isActive = activeLoaders > 0;
  listeners.forEach((listener) => listener(isActive));
}

export function beginRouteProgress() {
  activeLoaders += 1;
  notify();
}

export function endRouteProgress() {
  activeLoaders = Math.max(0, activeLoaders - 1);
  notify();
}

export default function RouteProgress() {
  const [isActive, setIsActive] = useState(false);
  const [width, setWidth] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const listener = (active) => setIsActive(active);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  useEffect(() => {
    let timer;
    if (isActive) {
      setIsVisible(true);
      setWidth(20);
      timer = window.setInterval(() => {
        setWidth((prev) => Math.min(prev + Math.random() * 18, 92));
      }, 180);
    } else if (isVisible) {
      setWidth(100);
      timer = window.setTimeout(() => {
        setIsVisible(false);
        setWidth(0);
      }, 220);
    }

    return () => {
      if (timer) {
        window.clearTimeout(timer);
        window.clearInterval(timer);
      }
    };
  }, [isActive, isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="position-fixed top-0 start-0 w-100"
      style={{ height: 3, zIndex: 2000, pointerEvents: "none" }}
      aria-hidden="true"
    >
      <div
        className="bg-primary"
        style={{
          height: "100%",
          width: `${width}%`,
          transition: "width 180ms ease-out, opacity 180ms ease-out",
        }}
      />
    </div>
  );
}

