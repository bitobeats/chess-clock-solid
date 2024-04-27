import type { PlayerConfig } from "./types/PlayerConfig";
import type { ActivePlayer } from "./types/ActivePlayer";
import type { ChessClockState } from "./types/ChessClockState";

import { SimpleEventTarget } from "vrls-simple-event-target";

import { UnexpectedCallWhileActiveError } from "./errors/UnexpectedCallWhileActiveError";
import { UnexpectedCallWhileNotReadyError } from "./errors/UnexpectedCallWhileNotReadyError";
import { UnexpectedCallWhileNotRunningError } from "./errors/UnexpectedCallWhileNotRunningError";
import { Timer } from "./Timer";
import { CustomWakeLock } from "./CustomWakeLock";

type ChessClockServiceEventMap = {
  statechange: (state: ChessClockState) => void;
  playerconfigchange: (player1Config: Readonly<PlayerConfig>, player2Config: Readonly<PlayerConfig>) => void;
  activeplayerchange: (activePlayer: ActivePlayer) => void;
};
export class ChessClockService extends SimpleEventTarget<ChessClockServiceEventMap> {
  #state: ChessClockState = "ready";
  #activePlayer: ActivePlayer = 1;
  #wakeLock = new CustomWakeLock();

  #playerTimes: [number, number];
  #player1Timer: Timer;
  #player2Timer: Timer;

  constructor(public player1Config: PlayerConfig, public player2Config: PlayerConfig) {
    super(["statechange", "playerconfigchange", "activeplayerchange"]);

    [this.#player1Timer, this.#player2Timer] = [player1Config, player2Config].map(
      (playerConfig) => new Timer(playerConfig)
    );

    this.#playerTimes = [this.#player1Timer.remainingTime, this.#player2Timer.remainingTime];

    [this.#player1Timer, this.#player2Timer].forEach((timer) => {
      timer.addEventListener("finish", () => {
        timer.pause();
        this.#updateState("finished");
      });
    });
  }

  get playerTimes(): readonly [number, number] {
    this.#playerTimes[0] = this.#player1Timer.remainingTime;
    this.#playerTimes[1] = this.#player2Timer.remainingTime;
    return this.#playerTimes;
  }

  get state() {
    return this.#state;
  }

  get activePlayer() {
    return this.#activePlayer;
  }

  startWith(player: ActivePlayer) {
    if (this.#state !== "ready") {
      throw new UnexpectedCallWhileNotReadyError();
    }
    this.#updateState("running");
    this.#activePlayer = player === 1 ? 2 : 1;
    this.switchTo(player);
  }

  switchTo(player: ActivePlayer) {
    if (this.#state !== "running") {
      throw new UnexpectedCallWhileNotRunningError();
    }

    if (player === this.#activePlayer) {
      return;
    }

    this.#activePlayer = player;

    switch (player) {
      case 1: {
        this.#activePlayer = 1;
        this.#player2Timer.pause(true);
        this.#player1Timer.start();

        break;
      }
      case 2: {
        this.#activePlayer = 2;
        this.#player1Timer.pause(true);
        this.#player2Timer.start();

        break;
      }
    }

    this.#wakeLock.requestWakeLock();

    this.dispatchEvent("activeplayerchange", this.#activePlayer);
  }

  suspend() {
    if (this.#state !== "running") {
      throw new UnexpectedCallWhileNotRunningError();
    }

    switch (this.#activePlayer) {
      case 1: {
        this.#player1Timer.pause();
        break;
      }
      case 2: {
        this.#player2Timer.pause();
        break;
      }
    }

    this.#wakeLock.releaseWakeLock();

    this.#updateState("suspended");
  }

  resume() {
    if (this.#state !== "suspended") {
      throw new UnexpectedCallWhileActiveError();
    }

    switch (this.#activePlayer) {
      case 1: {
        this.#player1Timer.start();
        break;
      }
      case 2: {
        this.#player2Timer.start();
        break;
      }
    }

    this.#wakeLock.requestWakeLock();

    this.#updateState("running");
  }

  reset() {
    [this.#player1Timer, this.#player2Timer].forEach((timer) => {
      timer.pause();
      timer.reset();
    });
    this.#wakeLock.releaseWakeLock();
    this.#updateState("ready");
  }

  #updateState(state: ChessClockState) {
    this.#state = state;
    this.dispatchEvent("statechange", state);
  }
}
