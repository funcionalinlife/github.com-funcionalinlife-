export function toCSV(headers, rows) {
  const esc = (v) => {
    const s = String(v ?? '')
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [headers.map(esc).join(';'), ...rows.map((r) => r.map(esc).join(';'))].join('\n')
}

export function downloadCSV(filename, headers, rows) {
  const blob = new Blob(['\ufeff' + toCSV(headers, rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
