import Link from 'next/link'
import type { PublicListData } from '@/lib/firestore-rest'

interface Props {
  data: PublicListData | null
}

export function PublicList({ data }: Props) {
  if (!data) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-stone-400">
        <Link href="/auth" className="absolute top-4 right-4 text-sm font-medium text-stone-500 hover:text-stone-800">
          Sign up / Log in
        </Link>
        List not found.
      </div>
    )
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-4 py-8">
      <Link href="/auth" className="absolute top-4 right-4 text-sm font-medium text-stone-500 hover:text-stone-800">
        Sign up / Log in
      </Link>
      <h1 className="mb-8 text-xl font-semibold tracking-tight">{data.title}</h1>

      {data.rankedItems.length === 0 ? (
        <p className="text-center text-sm text-stone-400">No ranked items yet.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {data.rankedItems.map((item, i) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white px-4 py-3 shadow-sm"
            >
              <span className="w-6 text-right text-sm font-bold text-stone-300">{i + 1}</span>
              <span className="flex-1 text-sm font-medium">{item.name}</span>
            </li>
          ))}
        </ol>
      )}
    </main>
  )
}
