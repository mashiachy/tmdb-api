import type { DataSourcesContext as Context } from "../apollo/server"
import type { KeyValueCache } from "@apollo/utils.keyvaluecache"
import { Images } from "./images"
import { TMDB } from "./tmdb"

export type {
  Query,
  ByID,
  ByIDList,
  ByPage,
  ByLanguage,
  Timeframe,
  Filter,
  SortBy,
  DiscoverMoviesFilter,
  DiscoverTVFilter,
  DiscoverMoviesSortBy,
  DiscoverTVSortBy
} from "./tmdb"

export interface Sources {
  Images: Images
  TMDB: TMDB
}

export type Cache = KeyValueCache<string>

// it is required for usage in cf worker (error in HTTPCache in @apollo/datasources-rest)
const customFetch = fetch.bind(globalThis)

export const createDataSources = (args: {
  context: Context
  cache: Cache
}) => ({
  Images: new Images(),
  TMDB: new TMDB({ ...args, fetch: customFetch })
})
