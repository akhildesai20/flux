import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const FILTER_ALPHA = 0.7;
const MOTION_THRESHOLD = 0.15;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function useSensorInput() {
  const [hasMotion, setHasMotion] = useState(false);
  const [isRequested, setIsRequested] = useState(false);
  const [force, setForce] = useState({ forceX: 0, forceY: 0, forceMag: 0 });
  const [error, setError] = useState("");
  const filteredRef = useRef({ forceX: 0, forceY: 0, forceMag: 0 });
  const seenEventRef = useRef(false);

  const onOrientation = useCallback((event) => {
    const beta = typeof event.beta === "number" ? event.beta : 0;
    const gamma = typeof event.gamma === "number" ? event.gamma : 0;

    const currentX = clamp(gamma / 90, -1, 1);
    const currentY = clamp(beta / 90, -1, 1);
    const currentMag = Math.sqrt(currentX ** 2 + currentY ** 2);

    const prev = filteredRef.current;
    const nextX = FILTER_ALPHA * prev.forceX + (1 - FILTER_ALPHA) * currentX;
    const nextY = FILTER_ALPHA * prev.forceY + (1 - FILTER_ALPHA) * currentY;
    const nextMag = FILTER_ALPHA * prev.forceMag + (1 - FILTER_ALPHA) * currentMag;

    if (!seenEventRef.current) {
      seenEventRef.current = true;
      setHasMotion(true);
      setError("");
    }

    const thresholded =
      nextMag < MOTION_THRESHOLD
        ? { forceX: 0, forceY: 0, forceMag: 0 }
        : { forceX: nextX, forceY: nextY, forceMag: clamp(nextMag, 0, 1.2) };
    filteredRef.current = thresholded;
    setForce(thresholded);
  }, []);

  const registerListener = useCallback(() => {
    window.addEventListener("deviceorientation", onOrientation, true);
  }, [onOrientation]);

  const requestMotionPermission = useCallback(async () => {
    if (typeof window === "undefined" || typeof DeviceOrientationEvent === "undefined") {
      setError("Device orientation is not supported on this device.");
      setHasMotion(false);
      setIsRequested(true);
      return false;
    }

    setIsRequested(true);
    try {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        const state = await DeviceOrientationEvent.requestPermission();
        if (state !== "granted") {
          setError("Motion permission denied. Tilt controls are unavailable.");
          setHasMotion(false);
          return false;
        }
      }
      setError("");
      registerListener();
      return true;
    } catch (requestError) {
      setError("Unable to request motion permission. Please check browser settings.");
      setHasMotion(false);
      return false;
    }
  }, [registerListener]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof DeviceOrientationEvent === "undefined") {
      setHasMotion(false);
      return undefined;
    }

    if (!window.isSecureContext) {
      setError("Motion sensors require HTTPS (or localhost) in this browser.");
      setHasMotion(false);
      setIsRequested(true);
      return undefined;
    }

    const needsPermission = typeof DeviceOrientationEvent.requestPermission === "function";
    if (!needsPermission) {
      registerListener();
      setIsRequested(true);
    }

    return () => {
      window.removeEventListener("deviceorientation", onOrientation, true);
    };
  }, [onOrientation, registerListener]);

  return useMemo(
    () => ({
      hasMotion,
      isRequested,
      forceX: force.forceX,
      forceY: force.forceY,
      forceMag: force.forceMag,
      requestMotionPermission,
      error,
    }),
    [error, force.forceMag, force.forceX, force.forceY, hasMotion, isRequested, requestMotionPermission],
  );
}

export default useSensorInput;
