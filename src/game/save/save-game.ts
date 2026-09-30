export const SAVE_VERSION = 5;

export type SaveEnvelope<T> = {
  version: typeof SAVE_VERSION;
  kind: string;
  savedAt: string;
  state: T;
};

export function encodeSave<T>(kind: string, state: T): string {
  const envelope: SaveEnvelope<T> = {
    version: SAVE_VERSION,
    kind,
    savedAt: new Date().toISOString(),
    state,
  };

  return JSON.stringify(envelope);
}

export function decodeSave<T>(raw: string, expectedKind: string): SaveEnvelope<T> {
  const parsed = JSON.parse(raw) as Partial<SaveEnvelope<T>>;

  if (parsed.version !== SAVE_VERSION) {
    throw new Error("Unsupported save version.");
  }
  if (parsed.kind !== expectedKind) {
    throw new Error("Save belongs to a different game stage.");
  }
  if (!parsed.state) {
    throw new Error("Save does not contain game state.");
  }

  return parsed as SaveEnvelope<T>;
}
