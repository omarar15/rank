import type { Metadata } from 'next'
import { ListsDashboard } from '@/components/ListsDashboard'

export const metadata: Metadata = { title: 'My lists — rank' }

export default function ListsPage() {
  return <ListsDashboard />
}
