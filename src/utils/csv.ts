export function parseCsv(content: string): string[][] {
  const rows: string[][] = []
  let field = ''
  let inQuotes = false
  let currentRow: string[] = []

  const pushField = () => {
    currentRow.push(field.trim())
    field = ''
  }

  const pushRow = () => {
    rows.push(currentRow)
    currentRow = []
  }

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i]

    if (char === '"') {
      if (inQuotes && content[i + 1] === '"') {
        field += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (!inQuotes && (char === ',' || char === '\n' || char === '\r')) {
      pushField()
      if (char === '\n' || char === '\r') {
        if (char === '\r' && content[i + 1] === '\n') {
          i += 1
        }
        if (currentRow.length) {
          pushRow()
        }
      }
      continue
    }

    field += char
  }

  if (field.length || currentRow.length) {
    pushField()
    pushRow()
  }

  return rows.filter(row => row.some(cell => cell.length))
}
