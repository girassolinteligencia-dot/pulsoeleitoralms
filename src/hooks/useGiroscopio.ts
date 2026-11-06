'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface ParallaxState {
  x: number;
  y: number;
}

/**
 * Hook for gyroscope/parallax movement with Lerp smoothing.
 */
export const useGiroscopio = (lerpFactor: number = 0.06) => {
  const [offset, setOffset] = useState<ParallaxState>({ x: 0, y: 0 });
  const targetRef = useRef<ParallaxState>({ x: 0, y: 0 });
  const offsetRef = useRef<ParallaxState>({ x: 0, y: 0 });

  const handleDeviceOrientation = useCallback((e: DeviceOrientationEvent) => {
    const { beta, gamma } = e;
    if (beta !== null && gamma !== null) {
      const x = Math.max(-1, Math.min(1, gamma / 30));
      const y = Math.max(-1, Math.min(1, (beta - 45) / 30));
      targetRef.current = { x, y };
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const x = (e.clientX / (typeof window !== 'undefined' ? window.innerWidth : 1)) * 2 - 1;
    const y = (e.clientY / (typeof window !== 'undefined' ? window.innerHeight : 1)) * 2 - 1;
    targetRef.current = { x, y };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleDeviceOrientation);
    }
    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;
    const animate = () => {
      offsetRef.current = {
        x: offsetRef.current.x + (targetRef.current.x - offsetRef.current.x) * lerpFactor,
        y: offsetRef.current.y + (targetRef.current.y - offsetRef.current.y) * lerpFactor,
      };
      setOffset({ ...offsetRef.current });
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [handleDeviceOrientation, handleMouseMove, lerpFactor]);

  return offset;
};
