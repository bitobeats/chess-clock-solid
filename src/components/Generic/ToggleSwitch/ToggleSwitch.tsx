import type { JSX, VoidComponent } from "solid-js";

import styles from "./ToggleSwitch.module.scss";

type ToggleSwitchProps = {
  onChange: JSX.EventHandlerUnion<HTMLInputElement, Event>;
  checked: boolean;
  name: string;
  id: string;
};

export const ToggleSwitch: VoidComponent<ToggleSwitchProps> = (props) => {
  return (
    <label class={styles.switch}>
      <input type="checkbox" onChange={props.onChange} checked={props.checked} name={props.name} id={props.id} />
      <span class={styles.slider}></span>
    </label>
  );
};
