export function formatMxn(cents: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cents / 100)
}

export function formatDate(value: string | null | undefined) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(date)
}

export function toDateInput(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export function dateInputToIso(value: string) {
  if (!value.trim()) return undefined
  return new Date(`${value}T12:00:00.000Z`).toISOString()
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function toCsvRow(values: Array<string | number>) {
  return values.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')
}

export function printHtml(title: string, html: string) {
  const popup = window.open('', '_blank', 'width=900,height=700')
  if (!popup) return
  popup.document.write(`<!doctype html><html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:24px;}h1,h2{margin:0 0 12px;}table{width:100%;border-collapse:collapse;margin-top:12px;}th,td{border:1px solid #ccc;padding:8px;text-align:left;} .muted{color:#666;} .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;} .card{border:1px solid #ddd;border-radius:8px;padding:12px;} @media print{body{padding:0}}</style></head><body>${html}</body></html>`)
  popup.document.close()
  popup.focus()
  popup.print()
}
