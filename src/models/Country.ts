export class Country {
  // eslint-disable-next-line no-undef
  [key: string]: any
  code!: string
  name!: string

  constructor({ iso_3166_1: code, english_name: name, ...rest }: Country) {
    Object.assign(this, rest)
    this.code = code
    this.name = name
  }
}
