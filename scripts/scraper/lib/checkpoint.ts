import fs from "node:fs";
import path from "node:path";

export type Checkpoint = {
  done: string[];
  failed: { id: string; err: string }[];
};

/** Ensure a directory exists. */
export function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(file: string, data: unknown) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

export function fileExists(file: string) {
  return fs.existsSync(file);
}

/** Checkpoint helper bound to a stage directory. */
export class CheckpointStore {
  private file: string;
  private cp: Checkpoint;
  private doneSet: Set<string>;

  constructor(stageDir: string) {
    ensureDir(stageDir);
    this.file = path.join(stageDir, "checkpoint.json");
    this.cp = readJson<Checkpoint>(this.file, { done: [], failed: [] });
    this.doneSet = new Set(this.cp.done);
  }

  isDone(id: string) {
    return this.doneSet.has(id);
  }

  get failedIds() {
    return this.cp.failed.map((f) => f.id);
  }

  markDone(id: string) {
    if (!this.doneSet.has(id)) {
      this.doneSet.add(id);
      this.cp.done.push(id);
    }
    this.cp.failed = this.cp.failed.filter((f) => f.id !== id);
    this.flush();
  }

  markFailed(id: string, err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    this.cp.failed = this.cp.failed.filter((f) => f.id !== id);
    this.cp.failed.push({ id, err: msg });
    this.flush();
  }

  private flush() {
    writeJson(this.file, this.cp);
  }

  stats() {
    return { done: this.cp.done.length, failed: this.cp.failed.length };
  }
}
