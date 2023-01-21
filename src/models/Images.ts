import type { ColorsResult, ImageResult } from "../sources/images"
import type { Resolver } from "../resolvers/utils"

interface Size {
  size: string
}

export class ImageType {
  // eslint-disable-next-line no-undef
  [key: string]: any
  file: string
  static custom: Resolver<ImageType, Size, ImageResult> = (
    { file: id },
    { size },
    { dataSources }
  ) => dataSources.Images.custom({ id, size })

  static original: Resolver<ImageType, {}, ImageResult> = (
    { file: id },
    _,
    { dataSources }
  ) => dataSources.Images.original({ id })

  static colors: Resolver<ImageType, {}, ColorsResult> = (
    { file: id },
    _,
    { dataSources }
  ) => dataSources.Images.colors(id)

  constructor(init: ImageType) {
    // eslint-disable-next-line camelcase
    this.file = init.file_path || init
    if (typeof init === `object`) {
      Object.assign(this, init)
    }
  }
}

export class Backdrop extends ImageType {
  // eslint-disable-next-line no-undef
  [key: string]: any
  imageType: string = `backdrop`
  static custom = ImageType.custom
  static original = ImageType.original
  static colors = ImageType.colors

  static small: Resolver<Backdrop, {}, ImageResult> = (
    { file: id },
    _,
    { dataSources }
  ) => dataSources.Images.w300({ id })

  static medium: Resolver<Backdrop, {}, ImageResult> = (
    { file: id },
    _,
    { dataSources }
  ) => dataSources.Images.w780({ id })

  static large: Resolver<Backdrop, {}, ImageResult> = (
    { file: id },
    _,
    { dataSources }
  ) => dataSources.Images.w1280({ id })
}

export class Logo extends ImageType {
  // eslint-disable-next-line no-undef
  [key: string]: any
  imageType: string = `logo`
  static custom = ImageType.custom
  static original = ImageType.original
  static colors = ImageType.colors

  static icon: Resolver<Logo, {}, ImageResult> = (
    { file: id },
    _,
    { dataSources }
  ) => dataSources.Images.w45({ id })

  static tiny: Resolver<Logo, {}, ImageResult> = (
    { file: id },
    _,
    { dataSources }
  ) => dataSources.Images.w92({ id })

  static small: Resolver<Logo, {}, ImageResult> = (
    { file: id },
    _,
    { dataSources }
  ) => dataSources.Images.w154({ id })

  static medium: Resolver<Logo, {}, ImageResult> = (
    { file: id },
    _,
    { dataSources }
  ) => dataSources.Images.w185({ id })

  static large: Resolver<Logo, {}, ImageResult> = (
    { file: id },
    _,
    { dataSources }
  ) => dataSources.Images.w300({ id })

  static huge: Resolver<Logo, {}, ImageResult> = (
    { file: id },
    _,
    { dataSources }
  ) => dataSources.Images.w500({ id })
}

export class Photo extends ImageType {
  // eslint-disable-next-line no-undef
  [key: string]: any
  imageType: string = `photo`
  static custom = ImageType.custom
  static original = ImageType.original
  static colors = ImageType.colors

  static small: Resolver<Photo, {}, ImageResult> = (
    { file: id },
    _,
    { dataSources }
  ) => dataSources.Images.w45({ id })

  static medium: Resolver<Photo, {}, ImageResult> = (
    { file: id },
    _,
    { dataSources }
  ) => dataSources.Images.w185({ id })

  static large: Resolver<Photo, {}, ImageResult> = (
    { file: id },
    _,
    { dataSources }
  ) => dataSources.Images.h632({ id })
}

export class Poster extends ImageType {
  // eslint-disable-next-line no-undef
  [key: string]: any
  imageType: string = `poster`
  static custom = ImageType.custom
  static original = ImageType.original
  static colors = ImageType.colors

  static thumbnail: Resolver<Poster, {}, ImageResult> = (
    { file: id },
    _,
    { dataSources }
  ) => dataSources.Images.w92({ id })

  static tiny: Resolver<Poster, {}, ImageResult> = (
    { file: id },
    _,
    { dataSources }
  ) => dataSources.Images.w154({ id })

  static small: Resolver<Poster, {}, ImageResult> = (
    { file: id },
    _,
    { dataSources }
  ) => dataSources.Images.w185({ id })

  static medium: Resolver<Poster, {}, ImageResult> = (
    { file: id },
    _,
    { dataSources }
  ) => dataSources.Images.w342({ id })

  static large: Resolver<Poster, {}, ImageResult> = (
    { file: id },
    _,
    { dataSources }
  ) => dataSources.Images.w500({ id })

  static huge: Resolver<Poster, {}, ImageResult> = (
    { file: id },
    _,
    { dataSources }
  ) => dataSources.Images.w780({ id })
}

export class Still extends ImageType {
  // eslint-disable-next-line no-undef
  [key: string]: any
  imageType: string = `still`
  static custom = ImageType.custom
  static original = ImageType.original
  static colors = ImageType.colors

  static small: Resolver<Still, {}, ImageResult> = (
    { file: id },
    _,
    { dataSources }
  ) => dataSources.Images.w92({ id })

  static medium: Resolver<Still, {}, ImageResult> = (
    { file: id },
    _,
    { dataSources }
  ) => dataSources.Images.w185({ id })

  static large: Resolver<Still, {}, ImageResult> = (
    { file: id },
    _,
    { dataSources }
  ) => dataSources.Images.w300({ id })
}
