import { useQuery } from '@tanstack/react-query'
import { rpApi } from './api'

export function useRpAssignments() {
  return useQuery({
    queryKey: ['rp-events'],
    queryFn: () => rpApi.getEvents(),
  })
}
