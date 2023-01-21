import { ApolloError, AuthenticationError, ForbiddenError } from "./errors"
import type {
  DataSourceConfig,
  AugmentedRequest as Request
} from "@apollo/datasource-rest"
import type { FetcherResponse as Response } from "@apollo/utils.fetcher"
import { RESTDataSource } from "@apollo/datasource-rest"
import { default as groupBy } from "lodash/groupBy"
import type { GraphQLResolveInfo } from "graphql"
import type {
  SortBy,
  DiscoverMoviesSortBy,
  DiscoverTVSortBy
} from "./buildSort"
import { buildSort } from "./buildSort"
import type {
  ByID,
  BySeason,
  ByEpisode,
  RawImage,
  Query,
  ByPage,
  ByLanguage,
  Timeframe,
  Filter,
  Model,
  APIRequest
} from "./types"
import type { DiscoverMoviesFilter } from "./buildMovieFilter"
import { buildMovieFilter } from "./buildMovieFilter"
import type { DiscoverTVFilter } from "./buildTVFilter"
import { buildTVFilter } from "./buildTVFilter"
import { logArgs } from "../../utils"
import type { DataSourcesContext as Context } from "../../apollo/server"

export class TMDB extends RESTDataSource {
  baseURL = `https://api.themoviedb.org/3/`
  context: Context

  constructor(config: DataSourceConfig & { context: Context }) {
    super(config)
    this.context = config.context
  }

  extractTTL<T extends Record<string, unknown> = Record<string, unknown>>(
    info: GraphQLResolveInfo | null,
    params: T = {} as T
  ): { params: T } & {
    cacheOptions: { ttl: number }
  } {
    return Object.assign(
      { params },
      {
        cacheOptions: { ttl: (<any>info)?.cacheControl?.cacheHint?.maxAge ?? 0 }
      }
    )
  }

  debug<T>(message?: T): void {
    this.context.logger.debug(message)
  }

  info<T>(message?: T): void {
    this.context.logger.info(message)
  }

  warn<T>(message?: T): void {
    this.context.logger.warn(message)
  }

  error<T>(message?: T): void {
    this.context.logger.error(message)
  }

  async didReceiveResponse<TResult = unknown>(
    response: Response
  ): Promise<TResult> {
    if (response.ok) {
      return this.parseBody(response) as unknown as Promise<TResult>
    }
    throw await this.errorFromResponse({ response })
  }

  willSendRequest(_path: string, request: Request): void {
    const v4apiKey = this.context.v4apiKey
    const v3apiKey = this.context.v3apiKey
    if (v4apiKey) {
      this.debug(`Sending request using v4 API Key`)
      request.headers[`Authorization`] = `Bearer ${v4apiKey}`
    } else if (v3apiKey) {
      this.debug(`Sending request using v3 API Key`)
      request.params.append(`api_key`, v3apiKey)
    } else {
      // eslint-disable-next-line no-console
      throw new AuthenticationError(
        `Environment Variable MOVIE_DB_API_V3_KEY or MOVIE_DB_API_V4_KEY is missing! Please visit https://developers.themoviedb.org/3/getting-started/authentication to learn how to get an API key.`
      )
    }
    this.debug({ message: `Request options:`, meta: request })
  }

  didEncounterError(err: Error): void {
    // eslint-disable-next-line no-console
    //this.context.report.error(`Failed to send request:`, err.stack)
    throw err
  }

  async errorFromResponse({
    response
  }: {
    response: Response
  }): Promise<ApolloError> {
    const endpoint = response.url
      .substring(0, response.url.indexOf(`?`))
      .replace(this.baseURL, ``)
    const body = (await this.parseBody(response)) as Record<string, unknown>
    const message = `${response.status} ${response.statusText}: ${String(
      body.status_message
    )}`
    const err =
      response.status === 401
        ? new AuthenticationError(message)
        : response.status === 403
        ? new ForbiddenError(message)
        : new ApolloError(message)

    Object.assign(err.extensions, {
      response: {
        url: response.url,
        status: response.status,
        statusText: response.statusText,
        body
      }
    })

    this.error(
      `Request to resource "${endpoint}" resulted in:\n\n${String(err.stack)}\n`
    )
    return err
  }

  getCrew = (rawCrewMembers: { id: string; job: string }[]): Model<"crew">[] =>
    Object.values<Model<"crew">>(
      rawCrewMembers.reduce((hash, { id, job, ...rest }) => {
        if (hash[id]) {
          hash[id].job.push(job)
        } else {
          hash[id] = { id, job: [job], ...rest }
        }
        return hash
      }, Object.create(null))
    ).map((member) => this.context.models.crew(member))

  mapToModel = async <R extends Promise<any[]>, M extends (args: any) => any>(
    req: R,
    model: M
  ): Promise<ReturnType<M>[]> => {
    const results = await req
    return results.map((result) => model(result))
  }

  mapResults = async <
    T extends keyof TMDB["context"]["models"] = "movie" | "tv" | "person"
  >(
    type: "movie" | "tv" | "person",
    path: string,
    params: Record<string, any>,
    info: GraphQLResolveInfo | null
  ): Promise<ReturnType<TMDB["context"]["models"][T]>[]> => {
    const { results: ids }: { results: { id: string }[] } = await this.get(
      path,
      this.extractTTL(info, params)
    )
    // console.log({ids})
    const results = await Promise.all(
      ids.map<ReturnType<TMDB["context"]["models"][T]>>(
        ({ id }) =>
          this[type]({ id, ...params }, info) as unknown as ReturnType<
            TMDB["context"]["models"][T]
          >
      )
    )
    return results
  }

  // --- Account ---

  // Get Details `/account`

  // Get Created Lists `/account/${account_id}/lists`

  // Get Favorite Movies `/account/${account_id}/favorite/movies`

  // Get Favorite TV Shows `/account/${account_id}/favorite/tv`

  // Get Rated Movies `/account/${account_id}/rated/movies`

  // Get Rated TV Shows `/account/${account_id}/rated/tv`

  // Get Rated TV Episodes `/account/${account_id}/rated/tv/episodes`

  // Get Movie Watchlist `/account/${account_id}/watchlist/movies`

  // Get TV Show Watchlist `/account/${account_id}/watchlist/tv`

  // Mark as Favorite `/account/${account_id}/favorite`

  // Add to Watchlist `/account/${account_id}/watchlist`

  // --- Authentication ---

  // Create Guest Session `/authentication/guest_session/new`

  // Create Request Token `/authentication/token/new`

  // Create Session `/authentication/session/new`

  // Create Session with Login `/authentication/token/validate_with_login`

  // Create Session from 4v Token `/authentication/session/convert/4`

  // Delete Session `/authentication/session`

  // --- Certification ---

  //  Get Movie Certifications `/certification/movie/list`

  // Get TV Certifications `/certification/tv/list`

  // --- Collections ---

  // Get Details `/collection/${collection_id}`
  collection: APIRequest<ByID & ByLanguage, Model<"collection">> = logArgs(
    async ({ id, ...params }, info) =>
      this.context.models.collection(
        await this.get(`collection/${id}`, this.extractTTL(info, params))
      )
  )

  // Get Images `/collection/${collection_id}/images`
  collectionImages: APIRequest<
    ByID & ByLanguage,
    { [key: string]: Model<"backdrop" | "poster">[] }
  > = async ({ id, ...params }, info) => {
    const { backdrops, posters } = await this.get(
      `collection/${id}/images`,
      this.extractTTL(info, params)
    )
    return {
      backdrops:
        backdrops?.map(({ file_path: path }: RawImage) =>
          this.context.models.backdrop(path as unknown as Model<"backdrop">)
        ) || [],
      posters:
        posters?.map(({ file_path: path }: RawImage) =>
          this.context.models.poster(path as unknown as Model<"poster">)
        ) || []
    }
  }

  // Get Translations `/collection/${collection_id}/translations`

  // --- Companies ---

  // Get Details `/company/${company_id}`
  company: APIRequest<ByID, Model<"company">> = async (
    { id, ...params },
    info
  ) =>
    this.context.models.company(
      await this.get(`company/${id}`, this.extractTTL(info, params))
    )

  // Get Alternative Names `/company/${company_id}/alternative_names`
  // companyAlternativeNames

  // Get Images `/company/${company_id}/images`
  companyImages: APIRequest<ByID, Model<"logo">[]> = async (
    { id, ...params },
    info
  ) => {
    const { logos } = await this.get(
      `company/${id}/images`,
      this.extractTTL(info, params)
    )
    return (
      logos?.map(({ file_path: path }: RawImage) =>
        this.context.models.logo(path as unknown as Model<"logo">)
      ) || []
    )
  }

  // --- Configuration ---

  // Get API Configuration `/configuration`
  // configuration

  // Get Countries `/configuration/countries`
  countries: APIRequest<{}, Model<"country">[]> = async ({ ...params }, info) =>
    this.mapToModel(
      this.get(`/configuration/countries`, this.extractTTL(info, params)),
      this.context.models.country
    )

  // Get Jobs `/configuration/jobs`
  jobs: APIRequest<{}, Model<"job">[]> = async ({ ...params }, info) => {
    const results: { department: string; jobs: string[] }[] = await this.get(
      `/configuration/jobs`,
      this.extractTTL(info, params)
    )
    return results
      .map(({ department, jobs }) =>
        jobs.map((name) => this.context.models.job({ department, name }))
      )
      .flat()
  }

  // Get Languages `/configuration/languages`
  languages: APIRequest<{}, Model<"language">[]> = async (
    { ...params },
    info
  ) =>
    this.mapToModel(
      this.get(`/configuration/languages`, this.extractTTL(info, params)),
      this.context.models.language
    )

  // Get Primary Translations `/configuration/primary_translations`
  // translations

  // Get Timezones `/configuration/timezones`
  timezones: APIRequest<{}, Model<"timezone">[]> = async (
    { ...params },
    info
  ) => {
    // eslint-disable-next-line camelcase
    const results: { iso_3166_1: string; zones: string[] }[] = await this.get(
      `/configuration/timezones`,
      this.extractTTL(info, params)
    )
    return results
      .map(({ iso_3166_1: code, zones }) =>
        zones.map((zone) => this.context.models.timezone({ code, zone }))
      )
      .flat()
  }

  // --- Credits ---

  // Get Details `/credit/${credit_id}`
  credit: APIRequest<ByID, Model<"credit">> = async ({ id, ...params }, info) =>
    this.context.models.credit(
      await this.get(`/credit/${id}`, this.extractTTL(info, params))
    )

  // --- Discover ---

  discoverMovies: APIRequest<
    Filter<DiscoverMoviesFilter> &
      SortBy<DiscoverMoviesSortBy> &
      ByPage &
      ByLanguage,
    Model<"movie">[]
  > = async ({ filter = {}, sortBy = {}, page, ...params }, info) =>
    this.mapResults<"movie">(
      `movie`,
      `discover/movie`,
      { ...buildMovieFilter(filter), ...buildSort(sortBy), page, ...params },
      info
    )

  discoverTV: APIRequest<
    Filter<DiscoverTVFilter> & SortBy<DiscoverTVSortBy> & ByPage & ByLanguage,
    Model<"tv">[]
  > = async ({ filter = {}, sortBy = {}, page, ...params }, info) =>
    this.mapResults<"tv">(
      `tv`,
      `discover/tv`,
      { ...buildTVFilter(filter), ...buildSort(sortBy), page, ...params },
      info
    )

  // --- Find ---

  // Find by ID `/find/${external_id}`

  // --- Genres ---

  // Get Movie List `/genre/movie/list`
  movieGenres: APIRequest<ByLanguage, Model<"genre">[]> = async (
    { ...params },
    info
  ) => {
    const { genres }: { genres: Model<"genre">[] } = await this.get(
      `/genre/movie/list`,
      this.extractTTL(info, params)
    )
    return genres.map((genre) => this.context.models.genre(genre))
  }

  // Get TV List `/genre/tv/list`
  tvGenres: APIRequest<ByLanguage, Model<"genre">[]> = async (
    { ...params },
    info
  ) => {
    const { genres }: { genres: Model<"genre">[] } = await this.get(
      `/genre/tv/list`,
      this.extractTTL(info, params)
    )
    return genres.map((genre) => this.context.models.genre(genre))
  }

  // --- Guest Sessions ---

  // Get Rated Movies `/guest_session/${guest_session_id}/rated/movies`

  // Get Rated TV Shows `/guest_session/${guest_session_id}/rated/tv`

  // Get Rated TV Episodes `/guest_session/${guest_session_id}/rated/tv/episodes`

  // --- Keywords ---

  // Get Details `/keyword/${keyword_id}`

  // Get Movies `/keyword/${keyword_id}/movies`

  // --- Lists ---

  // --- Movies ---

  // Get Details `/movie/${movie_id}`
  movie: APIRequest<ByID & ByLanguage, Model<"movie">> = async (
    { id, ...params },
    info
  ) =>
    this.context.models.movie(
      await this.get(
        `movie/${id}`,
        this.extractTTL(info, {
          append_to_response: `credits,reviews,images,keywords,videos,external_ids`,
          ...params
        })
      )
    )

  // Get Account States `/movie/${movie_id}/account_states`
  // movieAccountStates

  // Get Alternative Titles `/movie/${movie_id}/alternative_titles`
  // movieAlternativeTitles

  // Get Changes `/movie/${movie_id}/changes`
  // movieChanges

  // Get Credits `/movie/${movie_id}/credits`
  movieCredits: APIRequest<
    ByID,
    { cast: Model<"cast">[]; crew: Model<"crew">[] }
  > = async ({ id, ...params }, info) => {
    const { cast, crew } = await this.get(
      `movie/${id}/credits`,
      this.extractTTL(info, params)
    )
    return {
      cast: (cast as Model<"cast">[]).map((member) =>
        this.context.models.cast(member)
      ),
      crew: this.getCrew(crew)
    }
  }

  // Get External IDs `/movie/${movie_id}/external_ids`
  movieSocialMedia: APIRequest<ByID, Model<"socialMedia">> = async (
    { id, ...params },
    info
  ) =>
    this.context.models.socialMedia(
      await this.get(`movie/${id}/external_ids`, this.extractTTL(info, params))
    )

  // Get Images `/movie/${movie_id}/images`
  movieImages: APIRequest<
    ByID & ByLanguage,
    { [key: string]: Model<"backdrop" | "poster">[] }
  > = async ({ id, ...params }, info) => {
    const { backdrops, posters } = await this.get(
      `movie/${id}/images`,
      this.extractTTL(info, params)
    )
    return {
      backdrops:
        backdrops?.map(({ file_path: path }: RawImage) =>
          this.context.models.backdrop(path as unknown as Model<"backdrop">)
        ) || [],
      posters:
        posters?.map(({ file_path: path }: RawImage) =>
          this.context.models.poster(path as unknown as Model<"poster">)
        ) || []
    }
  }

  // Get Keywords `/movie/${movie_id}/keywords`
  movieKeywords: APIRequest<ByID, Model<"keyword">[]> = async (
    { id, ...params },
    info
  ) =>
    this.mapToModel(
      this.get(`movie/${id}/keywords`, this.extractTTL(info, params)),
      this.context.models.keyword
    )

  // Get Release Dates `/movie/${movie_id}/release_dates`
  // movieReleaseDates

  // Get Videos `/movie/${movie_id}/videos`
  movieVideos: APIRequest<ByID & ByLanguage, Model<"video">[]> = async (
    { id, ...params },
    info
  ) =>
    this.mapToModel(
      this.get(`movie/${id}/videos`, this.extractTTL(info, params)),
      this.context.models.video
    )

  // Get Translations `/movie/${movie_id}/translations`
  // movieTranslations

  // Get Recommendations `/movie/${movie_id}/recommendations`
  recommendedMovies: APIRequest<ByID & ByPage & ByLanguage, Model<"movie">[]> =
    async ({ id, ...params }, info) =>
      this.mapResults<"movie">(
        `movie`,
        `movie/${id}/recommendations`,
        { ...params },
        info
      )

  // Get Similar Movies `/movie/${movie_id}/similar`
  similarMovies: APIRequest<ByID & ByPage & ByLanguage, Model<"movie">[]> =
    async ({ id, ...params }, info) =>
      this.mapResults<"movie">(
        `movie`,
        `movie/${id}/similar`,
        { ...params },
        info
      )

  // Get Reviews `/movie/${movie_id}/reviews`
  movieReviews: APIRequest<ByID & ByPage & ByLanguage, Model<"review">[]> =
    async ({ id, ...params }, info) => {
      const { results }: { results: Model<"review">[] } = await this.get(
        `movie/${id}/reviews`,
        this.extractTTL(info, params)
      )
      return results.map((result) => this.context.models.review(result))
    }

  // Get Lists `/movie/${movie_id}/lists`
  // movieLists

  // Get Latest `/movie/latest`
  latestMovie: APIRequest<ByLanguage, Model<"movie">> = async (
    { ...params } = {},
    info = null
  ) =>
    this.context.models.movie(
      await this.get(
        `movie/latest`,
        this.extractTTL(info, {
          append_to_response: `credits,images,keywords,videos,external_ids`,
          ...params
        })
      )
    )

  // Get Now Playing `/movie/now_playing`
  nowPlaying: APIRequest<ByPage & ByLanguage, Model<"movie">[]> = async (
    { ...params } = {},
    info = null
  ) =>
    this.mapResults<"movie">(`movie`, `movie/now_playing`, { ...params }, info)

  // Get Popular `/movie/popular`
  popularMovies: APIRequest<ByPage & ByLanguage, Model<"movie">[]> = async (
    { ...params } = {},
    info = null
  ) => this.mapResults<"movie">(`movie`, `movie/popular`, { ...params }, info)

  // Get Top Rated `/movie/top_rated`
  topRatedMovies: APIRequest<ByPage & ByLanguage, Model<"movie">[]> = async (
    { ...params } = {},
    info = null
  ) => this.mapResults<"movie">(`movie`, `movie/top_rated`, { ...params }, info)

  // Get Upcoming `/movie/upcoming`
  upcomingMovies: APIRequest<ByPage & ByLanguage, Model<"movie">[]> = async (
    { ...params } = {},
    info = null
  ) => this.mapResults<"movie">(`movie`, `movie/upcoming`, { ...params }, info)

  // Rate Movie `/movie/${movie_id}/rating`
  // rateMovie

  // Delete Rating `/movie/${movie_id}/rating`
  // unrateMovie

  // --- Networks ---

  // Get Details `/network/${network_id}`
  network: APIRequest<ByID, Model<"network">> = async (
    { id, ...params },
    info
  ) =>
    this.context.models.network(
      await this.get(`network/${id}`, this.extractTTL(info, params))
    )

  // Get Alternative Names `/network/${network_id}/alternative_names`
  // networkAlternativeNames

  // Get Images `/network/${network_id}/images`
  networkImages: APIRequest<ByID, Model<"logo">> = async (
    { id, ...params },
    info = null
  ) => {
    const { logos } = await this.get(
      `network/${id}/images`,
      this.extractTTL(info, params)
    )
    return (
      logos?.map(({ file_path: path }: RawImage) =>
        this.context.models.logo(path as unknown as Model<"logo">)
      ) || []
    )
  }

  // --- Trending ---

  // Get Trending `/trending/${media_type}/${time_window}`
  trending: APIRequest<Timeframe & ByPage, Model<"movie" | "person" | "tv">[]> =
    async ({ timeframe, ...params }, info) => {
      const { results } = await this.get(
        `trending/all/${timeframe.toLowerCase()}`,
        this.extractTTL(info, params)
      )
      const grouped = groupBy<Model<"movie" | "tv" | "person">>(
        results,
        `media_type`
      )
      const [movies = [], people = [], shows = []] = await Promise.all([
        Promise.all(
          grouped.movie.map(async ({ id }) => this.movie({ id }, info))
        ),
        Promise.all(
          grouped.undefined.map(async ({ id }) => this.person({ id }, info))
        ),
        Promise.all(grouped.tv.map(async ({ id }) => this.tv({ id }, info)))
      ])
      return [
        ...movies.map((m) =>
          this.context.models.movie({ ...m, media_type: `movie` })
        ),
        ...people.map((p) => this.context.models.person(p)),
        ...shows.map((s) => this.context.models.tv({ ...s, media_type: `tv` }))
      ]
    }

  trendingMovies: APIRequest<Timeframe & ByPage, Model<"movie">[]> = async (
    { timeframe, ...params },
    info = null
  ) =>
    this.mapResults<"movie">(
      `movie`,
      `trending/movie/${timeframe.toLowerCase()}`,
      { ...params },
      info
    )

  trendingTVShows: APIRequest<Timeframe & ByPage, Model<"tv">[]> = async (
    { timeframe, ...params },
    info = null
  ) =>
    this.mapResults<"tv">(
      `tv`,
      `trending/tv/${timeframe.toLowerCase()}`,
      { ...params },
      info
    )

  trendingPeople: APIRequest<Timeframe & ByPage, Model<"person">[]> = async (
    { timeframe, ...params },
    info = null
  ) =>
    this.mapResults<"person">(
      `person`,
      `trending/person/${timeframe.toLowerCase()}`,
      { ...params },
      info
    )

  // --- People ---

  // Get Details `/person/${person_id}`
  person: APIRequest<ByID & ByLanguage, Model<"person">> = async (
    { id, ...params },
    info = null
  ) =>
    this.context.models.person(
      await this.get(
        `person/${id}`,
        this.extractTTL(info, {
          append_to_response: `combined_credits,images,tagged_images,external_ids`,
          ...params
        })
      )
    )

  // Get Changes `/person/${person_id}/changes`
  // personChanges

  // Get Movie Credits `/person/${person_id}/movie_credits`
  // personMovies

  // Get TV Credits `/person/${person_id}/tv_credits`
  // personTVShows

  // Get Combined Credits `/person/${person_id}/combined_credits`
  personCredits: APIRequest<
    ByID & ByLanguage,
    { cast: Model<"cast">[]; crew: Model<"crew">[] }
  > = async ({ id, ...params }, info) => {
    const { cast, crew } = await this.get(
      `person/${id}/combined_credits`,
      this.extractTTL(info, params)
    )
    return {
      cast: (cast as Model<"cast">[]).map((member) =>
        this.context.models.cast(member)
      ),
      crew: this.getCrew(crew)
    }
  }

  // Get External IDs `/person/${person_id}/external_ids`
  personSocialMedia: APIRequest<ByID & ByLanguage, Model<"socialMedia">> =
    async ({ id, ...params }, info = null) =>
      this.context.models.socialMedia(
        await this.get(
          `person/${id}/external_ids`,
          this.extractTTL(info, params)
        )
      )

  // Get Images `/person/${person_id}/images`
  personImages: APIRequest<ByID, Model<"photo">[]> = async (
    { id, ...params },
    info
  ) => {
    const { profiles } = await this.get(
      `person/${id}/images`,
      this.extractTTL(info, params)
    )
    return (
      profiles?.map(({ file_path: path }: RawImage) =>
        this.context.models.photo(path as unknown as Model<"photo">)
      ) || []
    )
  }

  // Get Tagged Images `/person/${person_id}/tagged_images`
  // personTaggedImages

  // Get Translations `/person/${person_id}/translations`
  // personTranslations

  // Get Latest `/person/latest`
  latestPerson: APIRequest<ByLanguage, Model<"person">> = async (
    { ...params },
    info = null
  ) =>
    this.context.models.person(
      await this.get(
        `person/latest`,
        this.extractTTL(info, {
          append_to_response: `combined_credits,images,external_ids`,
          ...params
        })
      )
    )

  // Get Popular `/person/popular`
  popularPeople: APIRequest<ByPage & ByLanguage, Model<"person">[]> = async (
    { ...params } = {},
    info = null
  ) =>
    this.mapResults<"person">(`person`, `person/popular`, { ...params }, info)

  // --- Reviews ---

  // Get Details `/review/${review_id}`
  review: APIRequest<ByID, Model<"review">> = async (
    { id, ...params },
    info = null
  ) =>
    this.context.models.review(
      await this.get(`review/${id}`, this.extractTTL(info, params))
    )

  // --- Search ---

  // Search Companies `/search/company`
  // searchCompanies

  // Search Collections `/search/collection`
  // searchCollections

  // Search Keywords `/search/keyword`
  // searchKeywords

  // Search Movies `/search/movie`
  searchMovies: APIRequest<Query & ByPage & ByLanguage, Model<"movie">[]> =
    async ({ ...params }, info = null) =>
      this.mapResults<"movie">(`movie`, `search/movie`, { ...params }, info)

  // Multi Search `/search/multi`
  search: APIRequest<
    Query & ByPage & ByLanguage,
    Model<"movie" | "person" | "tv">[]
  > = async ({ ...params }, info = null) => {
    const { results } = await this.get(
      `search/multi`,
      this.extractTTL(info, params)
    )
    const grouped = groupBy<Model<"movie" | "person" | "tv">>(
      results,
      `media_type`
    )
    const [movies = [], people = [], shows = []] = await Promise.all([
      Promise.all(
        grouped.movie.map(async ({ id }) => this.movie({ id }, info))
      ),
      Promise.all(
        grouped.undefined.map(async ({ id }) => this.person({ id }, info))
      ),
      Promise.all(grouped.tv.map(async ({ id }) => this.tv({ id }, info)))
    ])
    return [
      ...movies.map((m) =>
        this.context.models.movie({ ...m, media_type: `movie` })
      ),
      ...people.map((p) => this.context.models.person(p)),
      ...shows.map((s) => this.context.models.tv({ ...s, media_type: `tv` }))
    ]
  }

  // Search People `/search/person`
  searchPeople: APIRequest<Query & ByPage & ByLanguage, Model<"person">[]> =
    async ({ ...params }, info = null) =>
      this.mapResults<"person">(`person`, `search/person`, { ...params }, info)

  // Search TV Shows `/search/tv`
  searchTVShows: APIRequest<Query & ByPage & ByLanguage, Model<"tv">[]> =
    async ({ ...params }, info = null) =>
      this.mapResults<"tv">(`tv`, `search/tv`, { ...params }, info)

  // --- TV ---

  // Get Details `/tv/${tv_id}`
  tv: APIRequest<ByID & ByLanguage, Model<"tv">> = async (
    { id, ...params },
    info
  ) =>
    this.context.models.tv(
      await this.get(
        `tv/${id}`,
        this.extractTTL(info, {
          append_to_response: `credits,reviews,images,keywords,videos,external_ids,recommendations,similar`,
          ...params
        })
      )
    )

  // Get Account States `/tv/${tv_id}/account_states`
  // tvAccountStates

  // Get Alternative Titles `/tv/${tv_id}/alternative_titles`
  // tvAlternativeTitles

  // Get Changes `/tv/${tv_id}/changes`
  // tvChanges

  // Get Content Ratings `/tv/${tv_id}/content_ratings`
  // tvContentRatings

  // Get Credits `/tv/${tv_id}/credits`
  tvCredits: APIRequest<
    ByID & ByLanguage,
    { cast: Model<"cast">[]; crew: Model<"crew">[] }
  > = async ({ id, ...params }, info = null) => {
    const { cast, crew } = await this.get(
      `tv/${id}/credits`,
      this.extractTTL(info, params)
    )
    return {
      cast: (cast as Model<"cast">[]).map((member) =>
        this.context.models.cast(member)
      ),
      crew: this.getCrew(crew)
    }
  }

  // Get External IDs `/tv/${tv_id}/external_ids`
  tvSocialMedia: APIRequest<ByID & ByLanguage, Model<"socialMedia">> = async (
    { id, ...params },
    info = null
  ) =>
    this.context.models.socialMedia(
      await this.get(`tv/${id}/external_ids`, this.extractTTL(info, params))
    )

  // Get Images `/tv/${tv_id}/images`
  tvImages: APIRequest<
    ByID & ByLanguage,
    { [key: string]: Model<"backdrop" | "poster">[] }
  > = async ({ id, ...params }, info = null) => {
    const { backdrops, posters } = await this.get(
      `tv/${id}/images`,
      this.extractTTL(info, params)
    )
    return {
      backdrops:
        backdrops?.map(({ file_path: path }: RawImage) =>
          this.context.models.backdrop(path as unknown as Model<"backdrop">)
        ) || [],
      posters:
        posters?.map(({ file_path: path }: RawImage) =>
          this.context.models.poster(path as unknown as Model<"poster">)
        ) || []
    }
  }

  // Get Keywords `/tv/${tv_id}/keywords`
  tvKeywords: APIRequest<ByID, Model<"keyword">[]> = async (
    { id, ...params },
    info = null
  ) =>
    this.mapToModel(
      this.get(`tv/${id}/keywords`, this.extractTTL(info, params)),
      this.context.models.keyword
    )

  // Get Recommendations `/tv/${tv_id}/recommendations`
  recommendedShows: APIRequest<ByID & ByLanguage, Model<"tv">[]> = async (
    { id, ...params },
    info = null
  ) =>
    this.mapResults<"tv">(`tv`, `tv/${id}/recommendations`, { ...params }, info)

  // Get Reviews `/tv/${tv_id}/reviews`
  tvReviews: APIRequest<ByID & ByPage & ByLanguage, Model<"review">[]> = async (
    { id, ...params },
    info = null
  ) => {
    const { results }: { results: Model<"review">[] } = await this.get(
      `tv/${id}/reviews`,
      this.extractTTL(info, params)
    )
    return results.map((result) => this.context.models.review(result))
  }

  // Get Screened Theatrically `/tv/${tv_id}/screened_theatrically`
  // tvScreenedTheatrically

  // Get Similar TV Shows `/tv/${tv_id}/similar`
  similarShows: APIRequest<ByID & ByLanguage, Model<"tv">[]> = async (
    { id, ...params },
    info = null
  ) => this.mapResults<"tv">(`tv`, `tv/${id}/similar`, { ...params }, info)

  // Get Translations `/tv/${tv_id}/translations`
  // tvTranslations

  // Get Videos `/tv/${tv_id}/videos`
  tvVideos: APIRequest<ByID & ByLanguage, Model<"video">[]> = async (
    { id, ...params },
    info = null
  ) =>
    this.mapToModel(
      this.get(`tv/${id}/videos`, this.extractTTL(info, params)),
      this.context.models.video
    )

  // Get Latest `/tv/latest`
  latestTV: APIRequest<ByLanguage, Model<"tv">> = async (
    { ...params },
    info = null
  ) =>
    this.context.models.tv(
      await this.get(
        `tv/latest`,
        this.extractTTL(info, {
          append_to_response: `credits,images,keywords,videos,external_ids,recommendations,similar`,
          ...params
        })
      )
    )

  //Get TV Airing Today `/tv/airing_today`
  airingToday: APIRequest<ByPage & ByLanguage, Model<"tv">[]> = async (
    { ...params } = {},
    info = null
  ) => this.mapResults<"tv">(`tv`, `tv/airing_today`, { ...params }, info)

  // Get TV On The Air `/tv/on_the_air`
  airingThisWeek: APIRequest<ByPage & ByLanguage, Model<"tv">[]> = async (
    { ...params } = {},
    info = null
  ) => this.mapResults<"tv">(`tv`, `tv/on_the_air`, { ...params }, info)

  // Get Popular `/tv/popular`
  popularTV: APIRequest<ByPage & ByLanguage, Model<"tv">[]> = async (
    { ...params } = {},
    info = null
  ) => this.mapResults<"tv">(`tv`, `tv/popular`, { ...params }, info)

  // Get Top Rated `/tv/top_rated`
  topRatedTV: APIRequest<ByPage & ByLanguage, Model<"tv">[]> = async (
    { ...params } = {},
    info = null
  ) => this.mapResults<"tv">(`tv`, `tv/top_rated`, { ...params }, info)

  // Rate TV Show `/tv/${tv_id}/rating`
  // rateTVShow

  // Delete Rating `/tv/${tv_id}/rating`
  // unrateTVShow

  // --- Seasons ---

  // Get Details `/tv/${tv_id}/season/${season_number}`
  season: APIRequest<BySeason & ByLanguage, Model<"season">> = async (
    { show, season, ...params },
    info = null
  ) => {
    const [series, result] = await Promise.all([
      this.tv({ id: show }, info),
      this.get(
        `tv/${show}/season/${season}`,
        this.extractTTL(info, {
          ...params,
          append_to_response: `credits,external_ids,images,videos`
        })
      )
    ])
    return this.context.models.season({ ...result, series })
  }

  // Get Changes `/tv/season/${season_id}/changes`
  // seasonChanges

  // Get Account States `/tv/${tv_id}/season/${season_number}/account_states`
  // seasonAccountStates

  // Get Credits `/tv/${tv_id}/season/${season_number}/credits`
  seasonCredits: APIRequest<
    BySeason & ByLanguage,
    { cast: Model<"cast">[]; crew: Model<"crew">[] }
  > = async ({ show, season, ...params }, info = null) => {
    const { cast, crew } = await this.get(
      `tv/${show}/season/${season}/credits`,
      this.extractTTL(info, params)
    )
    return {
      cast: (cast as Model<"cast">[]).map((member) =>
        this.context.models.cast(member)
      ),
      crew: this.getCrew(crew)
    }
  }

  // Get External IDs `/tv/${tv_id}/season/${season_number}/external_ids`
  // seasonSocialMedia

  // Get Images `/tv/${tv_id}/season/${season_number}/images`
  seasonImages: APIRequest<BySeason & ByLanguage, Model<"poster">[]> = async (
    { show, season, ...params },
    info = null
  ) => {
    const { posters } = await this.get(
      `tv/${show}/season/${season}/images`,
      this.extractTTL(info, params)
    )
    return (
      posters?.map(({ file_path: path }: RawImage) =>
        this.context.models.poster(path as unknown as Model<"poster">)
      ) || []
    )
  }

  // Get Videos `/tv/${tv_id}/season/${season_number}/videos`
  seasonVideos: APIRequest<BySeason & ByLanguage, Model<"video">[]> = async (
    { show, season, ...params },
    info = null
  ) =>
    this.mapToModel(
      this.get(
        `tv/${show}/season/${season}/videos`,
        this.extractTTL(info, params)
      ),
      this.context.models.video
    )

  // --- Episodes ---

  // Get Details `/tv/${tv_id}/season/${season_number}/episode/${episode_number}`
  episode: APIRequest<ByEpisode & ByLanguage, Model<"episode">> = async (
    { show, season, episode, ...params },
    info = null
  ) => {
    const [seriesResult, seasonResult, episodeResult] = await Promise.all([
      this.tv({ id: show }, info),
      this.season({ show, season }, info),
      this.get(
        `tv/${show}/season/${season}/episode/${episode}`,
        this.extractTTL(info, {
          ...params,
          append_to_response: `credits,external_ids,images,videos`
        })
      )
    ])
    return this.context.models.episode({
      ...episodeResult,
      season: seasonResult,
      series: seriesResult
    })
  }

  // Get Changes `/tv/episode/${episode_id}/changes`
  // episodeChanges

  // Get Account States `/tv/${tv_id}/season/${season_number}/episode/${episode_number}/account_states`
  // episodeAccountStates

  // Get Credits `/tv/${tv_id}/season/${season_number}/episode/${episode_number}/credits`
  episodeCredits: APIRequest<
    ByEpisode,
    { cast: Model<"cast">[]; crew: Model<"crew">[]; guest: Model<"cast">[] }
  > = async ({ show, season, episode, ...params }, info = null) => {
    const {
      cast,
      crew,
      guest_stars: guest
    } = await this.get(
      `tv/${show}/season/${season}/episode/${episode}/credits`,
      this.extractTTL(info, params)
    )
    return {
      cast: (cast as Model<"cast">[]).map((member) =>
        this.context.models.cast(member)
      ),
      crew: this.getCrew(crew),
      guest: (guest as Model<"cast">[]).map((member) =>
        this.context.models.cast(member)
      )
    }
  }

  // Get External IDs `/tv/${tv_id}/season/${season_number}/episode/${episode_number}/external_ids`
  // episodeSocialMedia

  // Get Images `/tv/${tv_id}/season/${season_number}/episode/${episode_number}/images`
  episodeImages: APIRequest<ByEpisode, Model<"poster">[]> = async (
    { show, season, episode, ...params },
    info = null
  ) => {
    const { stills } = await this.get(
      `tv/${show}/season/${season}/episode/${episode}/images`,
      this.extractTTL(info, params)
    )
    return (
      stills?.map(({ file_path: path }: RawImage) =>
        this.context.models.still(path as unknown as Model<"still">)
      ) || []
    )
  }

  // Get Translations `/tv/${tv_id}/season/${season_number}/episode/${episode_number}/translations`
  // episodeTranslations

  // Get Videos `/tv/${tv_id}/season/${season_number}/episode/${episode_number}/videos`
  episodeVideos: APIRequest<ByEpisode & ByLanguage, Model<"video">[]> = async (
    { show, season, episode, ...params },
    info = null
  ) =>
    this.mapToModel(
      this.get(
        `tv/${show}/season/${season}/episode/${episode}/videos`,
        this.extractTTL(info, params)
      ),
      this.context.models.video
    )

  // Rate TV Episode `/tv/${tv_id}/season/${season_number}/episode/${episode_number}/rating`
  // rateEpisode

  // Delete Rating `/tv/${tv_id}/season/${season_number}/episode/${episode_number}/rating`
  // unrateEpisode

  // --- Episode Groups ---

  // Get Details `/tv/episode_group/${id}`
  // episodeGroup
}
