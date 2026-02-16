import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { managerApi, type ClubDTO, type CutEventSummary, type EventDTO, type RpDTO, type ScannerDTO } from '@/features/manager/api'

type ClubAggregateDraft = {
  clubId: string
  clubName: string
  clubActive: boolean
  events: number
  activeEvents: number
  generated: number
  scanned: number
  activeRpIds: Set<string>
}

export type DirectorClubAggregate = {
  clubId: string
  clubName: string
  clubActive: boolean
  events: number
  activeEvents: number
  activeRps: number
  generated: number
  scanned: number
  pending: number
  conversion: number
}

export type DirectorOverview = {
  clubsTotal: number
  clubsActive: number
  eventsTotal: number
  eventsActive: number
  rpsTotal: number
  rpsActive: number
  scannersTotal: number
  scannersActive: number
  generatedTotal: number
  scannedTotal: number
  conversion: number
}

export type DirectorAlert = {
  id: string
  level: 'warning' | 'danger' | 'info'
  title: string
  description: string
}

export type DirectorData = {
  overview: DirectorOverview
  byClub: DirectorClubAggregate[]
  topClubs: DirectorClubAggregate[]
  alerts: DirectorAlert[]
  clubs: ClubDTO[]
  events: EventDTO[]
  rps: RpDTO[]
  scanners: ScannerDTO[]
  cutEvents: CutEventSummary[]
}

function createClubDraft(clubId: string, clubName: string, clubActive: boolean): ClubAggregateDraft {
  return {
    clubId,
    clubName,
    clubActive,
    events: 0,
    activeEvents: 0,
    generated: 0,
    scanned: 0,
    activeRpIds: new Set<string>(),
  }
}

function finalizeClubDraft(draft: ClubAggregateDraft): DirectorClubAggregate {
  const pending = Math.max(draft.generated - draft.scanned, 0)
  const conversion = draft.generated > 0 ? Math.round((draft.scanned / draft.generated) * 100) : 0

  return {
    clubId: draft.clubId,
    clubName: draft.clubName,
    clubActive: draft.clubActive,
    events: draft.events,
    activeEvents: draft.activeEvents,
    activeRps: draft.activeRpIds.size,
    generated: draft.generated,
    scanned: draft.scanned,
    pending,
    conversion,
  }
}

export function useDirectorData(): { data: DirectorData | null; isLoading: boolean; error: unknown } {
  const clubsQuery = useQuery({ queryKey: ['director', 'clubs'], queryFn: managerApi.getClubs })
  const eventsQuery = useQuery({ queryKey: ['director', 'events'], queryFn: managerApi.getEvents })
  const rpsQuery = useQuery({ queryKey: ['director', 'rps'], queryFn: managerApi.getRps })
  const scannersQuery = useQuery({ queryKey: ['director', 'scanners'], queryFn: managerApi.getScanners })
  const cutsQuery = useQuery({ queryKey: ['director', 'cuts'], queryFn: () => managerApi.getCuts() })

  const isLoading =
    clubsQuery.isLoading || eventsQuery.isLoading || rpsQuery.isLoading || scannersQuery.isLoading || cutsQuery.isLoading

  const error = clubsQuery.error || eventsQuery.error || rpsQuery.error || scannersQuery.error || cutsQuery.error

  return useMemo(() => {
    if (isLoading || error) {
      return { data: null, isLoading, error }
    }

    const clubs = clubsQuery.data ?? []
    const events = eventsQuery.data ?? []
    const rps = rpsQuery.data ?? []
    const scanners = scannersQuery.data ?? []
    const cutEvents = cutsQuery.data?.events ?? []

    const byClubDraft = new Map<string, ClubAggregateDraft>()

    for (const club of clubs) {
      byClubDraft.set(club.id, createClubDraft(club.id, club.name, club.active))
    }

    const eventById = new Map<string, EventDTO>()
    for (const event of events) {
      eventById.set(event.id, event)

      const clubKey = event.club.id
      const draft = byClubDraft.get(clubKey) ?? createClubDraft(clubKey, event.club.name, event.club.active)
      draft.events += 1
      if (event.active) draft.activeEvents += 1

      const generated = event.assignments.reduce((sum, assignment) => sum + assignment.usedAccesses, 0)
      draft.generated += generated

      for (const assignment of event.assignments) {
        if (assignment.rp.active) {
          draft.activeRpIds.add(assignment.rp.id)
        }
      }

      byClubDraft.set(clubKey, draft)
    }

    for (const cutEvent of cutEvents) {
      const fromEvent = eventById.get(cutEvent.eventId)
      const clubKey = fromEvent?.club.id ?? cutEvent.clubName
      const clubName = fromEvent?.club.name ?? cutEvent.clubName
      const clubActive = fromEvent?.club.active ?? true
      const draft = byClubDraft.get(clubKey) ?? createClubDraft(clubKey, clubName, clubActive)
      draft.scanned += cutEvent.total
      byClubDraft.set(clubKey, draft)
    }

    const byClub = Array.from(byClubDraft.values()).map(finalizeClubDraft).sort((a, b) => b.generated - a.generated)

    const generatedTotal = byClub.reduce((sum, item) => sum + item.generated, 0)
    const scannedTotal = cutsQuery.data?.total ?? byClub.reduce((sum, item) => sum + item.scanned, 0)
    const conversion = generatedTotal > 0 ? Math.round((scannedTotal / generatedTotal) * 100) : 0

    const overview: DirectorOverview = {
      clubsTotal: clubs.length,
      clubsActive: clubs.filter((club) => club.active).length,
      eventsTotal: events.length,
      eventsActive: events.filter((event) => event.active).length,
      rpsTotal: rps.length,
      rpsActive: rps.filter((rp) => rp.active).length,
      scannersTotal: scanners.length,
      scannersActive: scanners.filter((scanner) => scanner.active).length,
      generatedTotal,
      scannedTotal,
      conversion,
    }

    const topClubs = byClub.slice(0, 5)

    const alerts: DirectorAlert[] = []

    for (const club of byClub) {
      if (club.generated >= 50 && club.scanned === 0) {
        alerts.push({
          id: `alert-no-scans-${club.clubId}`,
          level: 'danger',
          title: `Sin escaneos en ${club.clubName}`,
          description: `Tiene ${club.generated} accesos generados y 0 escaneados.`,
        })
      }

      if (club.generated >= 40 && club.conversion < 60) {
        alerts.push({
          id: `alert-low-conversion-${club.clubId}`,
          level: 'warning',
          title: `Conversion baja en ${club.clubName}`,
          description: `Conversion actual: ${club.conversion}% con ${club.generated} generados.`,
        })
      }

      if (club.clubActive && club.activeEvents === 0) {
        alerts.push({
          id: `alert-no-active-events-${club.clubId}`,
          level: 'info',
          title: `${club.clubName} sin eventos activos`,
          description: 'No hay eventos en curso para este club.',
        })
      }
    }

    return {
      data: {
        overview,
        byClub,
        topClubs,
        alerts,
        clubs,
        events,
        rps,
        scanners,
        cutEvents,
      },
      isLoading: false,
      error: null,
    }
  }, [
    isLoading,
    error,
    clubsQuery.data,
    eventsQuery.data,
    rpsQuery.data,
    scannersQuery.data,
    cutsQuery.data,
  ])
}
