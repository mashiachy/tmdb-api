import type { KeyValueCache } from "@apollo/utils.keyvaluecache"

const defaultStore = new Map()

export const cache = async <V = any>(
  key: string,
  value: V,
  store: KeyValueCache<V> | Map<string, V> = defaultStore
) => {
  if (store.get(key)) {
    return store.get(key)
  }
  await store.set(key, typeof value === `function` ? value() : value)
  return store.get(key)
}

export const memoize =
  <F extends (...args: any[]) => any, C extends KeyValueCache<ReturnType<F>>>(
    fn: F,
    store: C | Map<string, ReturnType<F>> = new Map()
  ) =>
  async (...args: any[]) =>
    // eslint-disable-next-line
    cache<() => ReturnType<F>>(
      JSON.stringify(args),
      () => fn(...args),
      store
    ) || null
