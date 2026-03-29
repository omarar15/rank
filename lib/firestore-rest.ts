import { cache } from 'react'

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseValue(value: any): any {
  if ('stringValue' in value) return value.stringValue
  if ('integerValue' in value) return parseInt(value.integerValue, 10)
  if ('booleanValue' in value) return value.booleanValue
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(parseValue)
  if ('mapValue' in value) return parseFields(value.mapValue.fields ?? {})
  if ('timestampValue' in value) return value.timestampValue
  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseFields(fields: Record<string, any>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(fields)) {
    result[key] = parseValue(value)
  }
  return result
}

function extractId(name: string) {
  return name.split('/').pop()!
}

export interface PublicListData {
  title: string
  rankedItems: { id: string; name: string }[]
}

export const fetchListByShareToken = cache(async (shareToken: string): Promise<PublicListData | null> => {
  const queryRes = await fetch(`${BASE}:runQuery?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'lists' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'shareToken' },
            op: 'EQUAL',
            value: { stringValue: shareToken },
          },
        },
        limit: 1,
      },
    }),
    next: { revalidate: 60 },
  })

  const queryData = await queryRes.json()
  const listDoc = queryData[0]?.document
  if (!listDoc) return null

  const listId = extractId(listDoc.name)
  const listFields = parseFields(listDoc.fields)
  const rankedItemIds = (listFields.rankedItems as string[]) ?? []

  const itemsRes = await fetch(`${BASE}/lists/${listId}/items?key=${API_KEY}`, {
    next: { revalidate: 60 },
  })
  const itemsData = await itemsRes.json()

  const nameMap: Record<string, string> = {}
  for (const itemDoc of itemsData.documents ?? []) {
    const itemId = extractId(itemDoc.name)
    nameMap[itemId] = parseFields(itemDoc.fields).name as string
  }

  const rankedItems = rankedItemIds
    .map((id) => ({ id, name: nameMap[id] ?? '' }))
    .filter((item) => item.name)

  return { title: listFields.title as string, rankedItems }
})
