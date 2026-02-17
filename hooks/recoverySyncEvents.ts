export type SyncSource = 'plan' | 'journals' | 'texts';
export type SyncListener = (source: SyncSource) => void;

const listeners = new Set<SyncListener>();

export function notifyDataChanged(source: SyncSource) {
  for (const listener of listeners) {
    try {
      listener(source);
    } catch {
      // Listener errors must not break write flow.
    }
  }
}

export function subscribeSync(listener: SyncListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
