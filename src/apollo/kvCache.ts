import type {
  KeyValueCacheSetOptions,
  KeyValueCache
} from "@apollo/utils.keyvaluecache"
import type {
  KVNamespacePutOptions,
  KVNamespace
} from "@cloudflare/workers-types"

export class KVCache implements KeyValueCache {
  kv: KVNamespace
  constructor(kv: KVNamespace) {
    this.kv = kv
  }
  async get(key: string) {
    const value = await this.kv.get(key)
    return value === null ? undefined : value
  }

  set(key: string, value: string, options?: KeyValueCacheSetOptions) {
    const opts: KVNamespacePutOptions = {}

    if (options) {
      opts.expirationTtl =
        Number(options.ttl) < 60 ? Number(options.ttl) : undefined
    }

    return this.kv.put(key, value, opts)
  }

  delete(key: string) {
    return this.kv.delete(key)
  }
}
