export type ImageSize = 's' | 'm' | 'l' | 'xl'

export type LabelImageOption = {
  key: string
  label: string
  isDefault?: boolean
  availableSizes?: ImageSize[]
  defaultSize?: ImageSize
}