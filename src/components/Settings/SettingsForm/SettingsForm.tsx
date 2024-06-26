import type { VoidComponent } from "solid-js";
import type { Player } from "../../../libs/chess-clock-service/types/Player";

import { GlobalSettings } from "../GlobalSettings/GlobalSettings";
import { PlayerSettings } from "../PlayerSettings/PlayerSettings";

import styles from "./SettingsForm.module.scss";

export const SettingsForm: VoidComponent = () => {
  const players: Player[] = [1, 2];

  return (
    <form class={styles.form} autocomplete="off">
      <div class={styles.playerSettingsContainer}>
        {players.map((player) => (
          <PlayerSettings player={player} />
        ))}
      </div>

      <GlobalSettings />
    </form>
  );
};
