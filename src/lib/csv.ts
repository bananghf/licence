/** Escape a cell for CSV and join rows into a downloadable blob. */
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const raw = cell == null ? '' : String(cell)
          if (/[",\n\r;]/.test(raw)) {
            return `"${raw.replace(/"/g, '""')}"`
          }
          return raw
        })
        .join(';'),
    )
    .join('\n')
}

export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const bom = '\uFEFF'
  const blob = new Blob([bom + toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
