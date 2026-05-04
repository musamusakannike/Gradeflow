export function tap(intensity: number = 8) {
  if (typeof window === "undefined") return;
  window.navigator.vibrate?.(intensity);
}
