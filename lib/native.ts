// Pont vers la future vraie application Android.
// Dans le navigateur, ce pont n'existe pas : les boutons « Importer mon journal d'appels / mes SMS » restent cachés.
// Dans l'application Android, la partie native (Kotlin) fournit exactement ces fonctions, et l'écran marche sans rien changer.
export interface CallEntry { number: string; name?: string; type: "in" | "out" | "missed" | "rejected"; date: number }
export interface SmsEntry { address: string; body: string; date: number }
export interface BobbyNativeApi {
  getCallLog(limit?: number): Promise<CallEntry[]>;
  getSms(limit?: number): Promise<SmsEntry[]>;
}
export function native(): BobbyNativeApi | null {
  if (typeof window === "undefined") return null; const w = window as any;
  return w.BobbyNative || w.Capacitor?.Plugins?.BobbyNative || null;
}
export const hasNative = () => !!native();
