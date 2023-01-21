import { RESTDataSource } from "@apollo/datasource-rest"
import Vibrant from "node-vibrant"
import { memoize, round } from "../utils"

export type Color =
  | "vibrant"
  | "lightVibrant"
  | "darkVibrant"
  | "muted"
  | "lightMuted"
  | "darkMuted"

export type ImageResult = string | null

// eslint-disable-next-line no-use-before-define
export type ColorsResult = ReturnType<Images["extractColor"]> | null

type Custom = (options: { id: string; size: string }) => ImageResult

type GetCustom = (options: { id: string }) => ImageResult

interface ColorPalette {
  vibrant: number[] | null
  lightVibrant: number[] | null
  darkVibrant: number[] | null
  muted: number[] | null
  lightMuted: number[] | null
  darkMuted: number[] | null
}

export class Images extends RESTDataSource {
  baseURL: string = `https://image.tmdb.org/t/p/`
  cachedColor: Images["extractColor"] | undefined
  bucket: string = ``

  initialize(): void {
    this.cachedColor = memoize(
      this.extractColor
    ) as unknown as Images["extractColor"]
  }

  url = (size: string, id: string): string | null =>
    size && id ? `${this.baseURL}${size}${id}` : null

  custom: Custom = ({ id, size }) => this.url(size, id)

  original: GetCustom = ({ id }) => this.custom({ id, size: `original` })

  w45: GetCustom = ({ id }) => this.custom({ id, size: `w45` })

  w92: GetCustom = ({ id }) => this.custom({ id, size: `w92` })

  w154: GetCustom = ({ id }) => this.custom({ id, size: `w154` })

  w185: GetCustom = ({ id }) => this.custom({ id, size: `w185` })

  w300: GetCustom = ({ id }) => this.custom({ id, size: `w300` })

  w342: GetCustom = ({ id }) => this.custom({ id, size: `w342` })

  w500: GetCustom = ({ id }) => this.custom({ id, size: `w500` })

  w780: GetCustom = ({ id }) => this.custom({ id, size: `w780` })

  w1280: GetCustom = ({ id }) => this.custom({ id, size: `w1280` })

  h632: GetCustom = ({ id }) => this.custom({ id, size: `h632` })

  colors = (id: string): ColorsResult => {
    const url = this.url(`original`, id)
    return url ? this.cachedColor?.(url) ?? null : null
  }

  extractColor = async (
    url: Parameters<typeof Vibrant.from>[0]
  ): Promise<ColorPalette> => {
    const builder = Vibrant.from(url)
    const palette = await builder.getPalette()
    return {
      vibrant: palette.Vibrant?.rgb.map(round) ?? null,
      lightVibrant: palette.LightVibrant?.rgb.map(round) ?? null,
      darkVibrant: palette.DarkVibrant?.rgb.map(round) ?? null,
      muted: palette.Muted?.rgb.map(round) ?? null,
      lightMuted: palette.LightMuted?.rgb.map(round) ?? null,
      darkMuted: palette.DarkMuted?.rgb.map(round) ?? null
    }
  }
}
