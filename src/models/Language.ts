export class Language {
  // eslint-disable-next-line no-undef
  [key: string]: any
  code: string
  name!: string

  constructor({ iso_639_1: code, english_name: name, ...rest }: Language) {
    Object.assign(this, rest)
    this.code = code
    this.name = name
  }
}
