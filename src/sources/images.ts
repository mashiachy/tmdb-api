export type ImageResult = string | null

type Custom = (options: { id: string; size: string }) => ImageResult

type GetCustom = (options: { id: string }) => ImageResult

export class Images {
  baseURL: string = `https://image.tmdb.org/t/p/`

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
}
