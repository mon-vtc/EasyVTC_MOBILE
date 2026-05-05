// auth-callback.ts — Gestion globale des erreurs d'authentification
let onUnauthorizedCallback: (() => void) | null = null;

export function setOnUnauthorized(callback: () => void) {
  onUnauthorizedCallback = callback;
}

export function handleUnauthorized() {
  if (onUnauthorizedCallback) {
    onUnauthorizedCallback();
  }
}