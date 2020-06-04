// @ts-expect-error
import openWasmModule = require('./wasm-mod.js');

type TreePointer = number & { ctype: 'ptree*' };
type CharPointer = number & { ctype: 'char*' };

class Wrapper {
  public readonly load: (input: string) => TreePointer;
  public readonly unload: (tree: TreePointer) => void;
  public readonly count: (tree: TreePointer, path: string, key: string) => number;
  public readonly get: (tree: TreePointer, path: string, key: string, index: number) => TreePointer;
  public readonly value: (tree: TreePointer) => CharPointer;
  public readonly free: (s: CharPointer) => void;

  constructor(private readonly m: any) {
    this.load = m.cwrap('load', 'number', ['string']);
    this.unload = m.cwrap('unload', 'void', ['number']);
    this.count = m.cwrap('count', 'number', ['number', 'string', 'string']);
    this.get = m.cwrap('get', 'number', ['number', 'string', 'string', 'number']);
    this.value = m.cwrap('value', 'number', ['number']);
    this.free = m.cwrap('free', 'void', ['number']);
  }

  public getString(s: CharPointer): string {
    // eslint-disable-next-line new-cap
    return this.m.UTF8ToString(s);
  }
}

/** Boost property tree node. */
class Tree {
  private constructor(private c: Wrapper, private readonly pointer: TreePointer) {
  }

  /** Load a Boost INFO file. */
  static async create(input: string): Promise<Tree> {
    const c = new Wrapper(await openWasmModule(undefined));
    return new Tree(c, c.load(input));
  }

  /** Release associated resources. */
  public dispose() {
    if (this.c) {
      this.c.unload(this.pointer);
      delete this.c;
    }
  }

  /** Read value at path. */
  public get(path?: string): string|undefined {
    if (!path) {
      return this.value;
    }

    let v: string|undefined;
    this.forEach(path, (subtree, i) => {
      if (i === 0) {
        v = subtree.value;
      }
    });
    return v;
  }

  /** Read value of this node. */
  public get value(): string|undefined {
    const v = this.c.value(this.pointer);
    if (v === 0) {
      return undefined;
    }

    const s = this.c.getString(v);
    this.c.free(v);
    return s;
  }

  /** Visit nodes at given path. */
  forEach(path: string, visitor: (node: Tree, index: number) => void): void {
    const pathComps = path.split('.');
    const key = pathComps.pop()!;
    const parentPath = pathComps.join('.');
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
