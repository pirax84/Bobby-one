import type { ReactNode } from "react";
import { t } from "../../i18n";
import { actions } from "../../lib/store";
import { LookCtx, useLook, type GameKey } from "./cardlook";
import { CardSettings } from "./CardSettings";

/** Cadre commun des jeux : message d'état, bouton « Rejouer », points gagnés une seule fois. */
export function GameShell({ status, over, onAgain, children, tone, felt, game }: { game?: GameKey; status: string; over?: boolean; onAgain: () => void; children: ReactNode; tone?: "win" | "lose"; felt?: boolean }) {
  const gk: GameKey = game || "rami"; const look = useLook(gk);
  return (
    <LookCtx.Provider value={{ game: gk, look }}>
    <div className="card col" style={{ alignItems: "center", gap: 10 }}>
      <div className={"gstatus" + (over || tone ? "" : " muted")} role="status" aria-live="polite">{status}</div>
      {felt ? <div className="gfelt">{children}</div> : children}
      {over && <button type="button" className="btn" onClick={onAgain}>{t("Rejouer")}</button>}
      {game && <CardSettings game={game} look={look} />}
    </div>
    </LookCtx.Provider>
  );
}
export const win = (n = 3) => actions.addScore(n);
