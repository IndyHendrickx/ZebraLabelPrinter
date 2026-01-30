import { z } from 'zod'
import type { LabelImageOption, ImageSize } from './label-images'

export enum Sizes {
  Normal = "normal",
  Compact = "compact",
}

export enum Templates {
  General = "general",
  Address = "address",
  Christmas = "christmas"
}

export type LabelTypeKey = 'food' | 'storage' | 'reminder' | 'address' | 'christmascard' | 'unknown'

export type FieldConfig = {
  key: string
  label: string
  type?: 'text' | 'textarea' | 'date'
  maxChars?: number
  defaultValue?: string
}

export type LabelConfig = {
  allowSizeChange: boolean
  fixedSize?: Sizes
  maxQty?: number
  fields: readonly FieldConfig[]
  images?: readonly LabelImageOption[]
  template?: Templates
}

export const labelTypeConfig: Record<LabelTypeKey, LabelConfig> = {
  food: {
    allowSizeChange: true, maxQty: 10, fields: [{ key: 'date', label: 'Date', type: 'date' }, { key: 'description', label: 'Description', type: 'textarea', maxChars: 5 }],
    images: [
      {
        key: 'none',
        label: 'No image'
      },
      {
        key: 'meat',
        label: 'Meat',
        isDefault: true,
        availableSizes: ['s', 'm', 'l', 'xl'],
        defaultSize: 's'
      }
    ]
  },
  storage: {
    allowSizeChange: true, maxQty: 10, fields: [{ key: 'date', label: 'Date', type: 'date' }, { key: 'description', label: 'Description', type: 'textarea', maxChars: 90 }],
    images: [
      {
        key: 'none',
        label: 'No image'
      },
      {
        key: 'storage',
        label: 'Box',
        isDefault: true,
        availableSizes: ['s', 'm', 'l', 'xl'],
        defaultSize: 'm'
      }
    ]
  },
  reminder: {
    allowSizeChange: true, maxQty: 10, fields: [{ key: 'date', label: 'Date', type: 'date' }, { key: 'description', label: 'Description', type: 'textarea', maxChars: 90 }],
    images: [
      {
        key: 'none',
        label: 'No image'
      },
      {
        key: 'reminder',
        label: 'Bell',
        isDefault: true,
        availableSizes: ['s', 'm', 'l', 'xl'],
        defaultSize: 'm'
      }
    ]
  },
  unknown: {
    allowSizeChange: true, maxQty: 10, fields: [{ key: 'date', label: 'Date', type: 'date' }, { key: 'description', label: 'Description', type: 'textarea', maxChars: 90 }],
    images: [
      {
        key: 'none',
        label: 'No image'
      },
      {
        key: 'unknown',
        label: 'Question',
        isDefault: true,
        availableSizes: ['s', 'm', 'l', 'xl'],
        defaultSize: 'm'
      }
    ]
  },
  christmascard: {
    template: Templates.Christmas, allowSizeChange: false, fixedSize: Sizes.Normal, maxQty: 5, fields: [{ key: 'description', label: 'Message', type: 'textarea', maxChars: 120, defaultValue: 'MERRY CHRISTMAS AND A HAPPY NEW YEAR! INDY & MARLOTTE' }],
    images: [
      {
        key: 'none',
        label: 'No image'
      },
      {
        key: 'reigndeer',
        label: 'Reigndeer',
        isDefault: true,
        availableSizes: ['s', 'm', 'l', 'xl'],
        defaultSize: 'm'
      }
    ]
  },
  address: {
    template: Templates.Address, allowSizeChange: false, fixedSize: Sizes.Normal, maxQty: 1, fields: [
      { key: 'address.name', label: 'Name', maxChars: 40 },
      { key: 'address.lines', label: 'Address', type: 'textarea', maxChars: 120 },
      { key: 'address.zip', label: 'ZIP', maxChars: 12 },
      { key: 'address.city', label: 'City', maxChars: 40 },
      { key: 'address.country', label: 'Country', maxChars: 40, defaultValue: 'BELGIË' }
    ]
  }
}

export const baseFields = {
  date: z.coerce.date().min(new Date('2026-01-01')).max(new Date('2100-12-31')),
  template: z.nativeEnum(Templates),
  qty: z.number().int().min(1).max(20),
  size: z.nativeEnum(Sizes),
  image: z.object({ key: z.string(), size: z.enum(['s', 'm', 'l', 'xl'] as const) })
}
export const labelSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('food'),
    ...baseFields,
    description: z.string().trim().min(1).max(90)
  }),
  z.object({
    type: z.literal('storage'),
    ...baseFields,
    description: z.string().trim().min(1).max(90)
  }),
  z.object({
    type: z.literal('reminder'),
    ...baseFields,
    description: z.string().trim().min(1).max(90)
  }),
  z.object({
    type: z.literal('unknown'),
    ...baseFields,
    description: z.string().trim().min(1).max(90)
  }),
  z.object({
    type: z.literal('christmascard'),
    ...baseFields,
    template: z.literal(Templates.Christmas),
    size: z.literal(Sizes.Normal),
    description: z.string().trim().min(1).max(120)
  }),
  z.object({
    type: z.literal('address'),
    ...baseFields,
    template: z.literal(Templates.Address),
    size: z.literal(Sizes.Normal),
    address: z.object({
      name: z.string().trim().min(1).max(40),
      lines: z.string().trim().min(1).max(120),
      zip: z.string().trim().min(1).max(12),
      city: z.string().trim().min(1).max(40),
      country: z.string().trim().min(1).max(40)
    })
  })
])

export type LabelForm = z.infer<typeof labelSchema>
