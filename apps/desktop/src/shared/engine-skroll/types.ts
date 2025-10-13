/** Player-facing label for a choice with an opaque identifier to pass to session.choose. */
export type SessionChoice = {
  /** Identifier that must be passed to {@link Session.choose}. */
  id: string;
  /** Player-facing label for the choice. */
  label: string;
};

/** Minimal interactive session interface for traversing a compiled script. */
export type Session = {
  /** Returns the current beat body as a trimmed string. */
  getText(): string;
  /**
   * Lists the available choices for the current beat.
   * If the beat has ended (reached an `end` statement or has no branches), returns an empty array.
   */
  getChoices(): SessionChoice[];
  /**
   * Progresses the session by selecting a choice identifier returned from {@link getChoices}.
   * Throws if the choice id is unknown or the session has ended.
   */
  choose(choiceId: string): void;
  /** Indicates whether the session has reached a terminal beat. */
  isEnded(): boolean;
};
