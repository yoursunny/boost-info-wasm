import type { Tagged } from "type-fest";

// @ts-expect-error type
import openWasmModule from "./wasm-mod.js";

type TreePointer = Tagged<number, "ptree*">;
type LengthStringPointer = Tagged<number, "uint32+char*">;

const textDecoder = new TextDecoder();

export enum Format {
  INFO = 0,
  XML = 1,
}

class Wrapper {
  public readonly load: (input: string, fmt: Format) => TreePointer;
  public readonly save: (tree: TreePointer, fmt: Format) => LengthStringPointer;
  public readonly dispose: (tree: TreePointer) => void;
  public readonly count: (tree: TreePointer, path: string, key: string) => number;
  public readonly get: (tree: TreePointer, path: string, key: string, index: number) => TreePointer;
  public readonly value: (tree: TreePointer) => LengthStringPointer;
  public readonly free: (s: LengthStringPointer) => void;

  constructor(private readonly m: any) {
    this.load = m.cwrap("load", "number", ["string", "number"]);
    this.save = m.cwrap("save", "number", ["number", "number"]);
    this.dispose = m.cwrap("dispose", "void", ["number"]);
    this.count = m.cwrap("count", "number", ["number", "string", "string"]);
    this.get = m.cwrap("get", "number", ["number", "string", "string", "number"]);
    this.value = m.cwrap("value", "number", ["number"]);
    this.free = m.cwrap("free", "void", ["number"]);
  }

  public getString(ptr: LengthStringPointer, free = true): string | undefined {
    if (ptr === 0) {
      return undefined;
    }
    const len = (this.m.HEAPU32 as Uint32Array).at(ptr / 4) ?? 0;
    const s = textDecoder.decode((this.m.HEAPU8 as Uint8Array).subarray(ptr + 4, ptr + 4 + len));
    if (free) {
      this.free(ptr);
    }
    return s;
  }
}

/** Boost property tree node. */
export class Tree {
  private constructor(private c: Wrapper | undefined, private readonly pointer: TreePointer) {}

  /** Load from string. */
  public static async create(input: string, fmt = Format.INFO): Promise<Tree> {
    const c = new Wrapper(await openWasmModule(undefined));
    return new Tree(c, c.load(input, fmt));
  }

  /** Save to string. */
  public save(fmt = Format.INFO): string | undefined {
    if (!this.c) {
      return undefined;
    }
    return this.c.getString(this.c.save(this.pointer, fmt));
  }

  /** Release associated resources. */
  public dispose(): void {
    if (!this.c) {
      return;
    }
    this.c.dispose(this.pointer);
    delete this.c;
  }

  /** Read value at path. */
  public get(path?: string): string | undefined {
    if (!path) {
      return this.value;
    }

    let v: string | undefined;
    this.forEach(path, (subtree, i) => {
      if (i === 0) {
        v = subtree.value;
      }
    });
    return v;
  }

  /** Read value of this node. */
  public get value(): string | undefined {
    if (!this.c) {
      return undefined;
    }
    return this.c.getString(this.c.value(this.pointer));
  }

  /** Visit nodes at given path. */
  public forEach(path: string, visitor: (node: Tree, index: number) => void): void {
    if (!this.c) {
      return;
    }

    const pathComps = path.split(".");
    const key = pathComps.pop()!;
    const parentPath = pathComps.join(".");
    const count = this.c.count(this.pointer, parentPath, key);
    for (let i = 0; i < count; ++i) {
      const subtree = new Tree(this.c, this.c.get(this.pointer, parentPath, key, i));
      try {
        visitor(subtree, i);
      } finally {
        subtree.dispose();
      }
    }
  }

  /** Visit nodes at given path and collect results. */
  public map<T>(path: string, visitor: (node: Tree, index: number) => T): T[] {
    const results: T[] = [];
    this.forEach(path, (subtree, index) => {
      results.push(visitor(subtree, index));
    });
    return results;
  }
}

export const load = Tree.create;
