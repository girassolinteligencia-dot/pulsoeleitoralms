import { useEffect } from 'react';

/**
 * Hook for generating asynchronous idle physics for plasma fragments via CSS Custom Properties.
 */
export const useFragmentoFisica = (targetRef: React.RefObject<HTMLDivElement>) => {
  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    // Random amplitudes and durations for organic feel according to spec
    const amplitudeX = Math.random() * 7 + 5;     // 5px a 12px
    const amplitudeY = Math.random() * 8 + 8;     // 8px a 16px
    const durationX = Math.random() * 3500 + 3500; // 3500ms a 7000ms
    const durationY = Math.random() * 4000 + 4000; // 4000ms a 8000ms
    const faseX = Math.random() * 360;
    const faseY = Math.random() * 360;

    // Set custom properties for CSS animation
    element.style.setProperty('--amp-x', `${amplitudeX}px`);
    element.style.setProperty('--amp-y', `${amplitudeY}px`);
    element.style.setProperty('--dur-x', `${durationX}ms`);
    element.style.setProperty('--dur-y', `${durationY}ms`);
    element.style.setProperty('--fase-x', `${faseX}deg`);
    element.style.setProperty('--fase-y', `${faseY}deg`);

    // The animation itself should be defined in CSS (globals.css or fragmento.module.css)
  }, [targetRef]);
};
