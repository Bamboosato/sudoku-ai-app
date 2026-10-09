import { describe, expect, it } from 'vitest'
import { parseScanResponse, SCAN_PROMPT, SCAN_RESPONSE_SCHEMA } from './scanPrompt'

describe('scanPrompt', () => {
  it('defines valid prompt and JSON schema', () => {
    expect(SCAN_PROMPT).toContain('9x9')
    expect(SCAN_PROMPT).toContain('印刷')
    expect(SCAN_RESPONSE_SCHEMA.required).toEqual(['found', 'grid', 'uncertainCells'])
  })

  it('parses valid scan response with markdown code fence', () => {
    const raw = `\`\`\`json
{
  "found": true,
  "grid": [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9]
  ],
  "uncertainCells": [
    { "row": 0, "col": 4 },
    { "row": 7, "col": 3 }
  ]
}
\`\`\``

    const res = parseScanResponse(raw)
    expect(res).not.toBeNull()
    expect(res?.found).toBe(true)
    expect(res?.grid[0][0]).toBe(5)
    expect(res?.grid[8][8]).toBe(9)
    expect(res?.uncertainCells).toEqual([
      { row: 0, col: 4 },
      { row: 7, col: 3 },
    ])
  })

  it('handles found: false correctly', () => {
    const raw = JSON.stringify({
      found: false,
      grid: [],
      uncertainCells: [],
    })
    const res = parseScanResponse(raw)
    expect(res).not.toBeNull()
    expect(res?.found).toBe(false)
    expect(res?.grid.length).toBe(9)
    expect(res?.grid.every((r) => r.length === 9 && r.every((c) => c === 0))).toBe(true)
    expect(res?.uncertainCells).toEqual([])
  })

  it('rejects invalid or corrupted JSON', () => {
    expect(parseScanResponse('')).toBeNull()
    expect(parseScanResponse('not a json')).toBeNull()
    expect(parseScanResponse('{}')).toBeNull() // missing found
    // Missing rows
    expect(
      parseScanResponse(
        JSON.stringify({
          found: true,
          grid: [[1, 2, 3]],
          uncertainCells: [],
        }),
      ),
    ).toBeNull()
    // Invalid numbers (string or out of range)
    const badRow = [1, 2, 3, 4, 5, 6, 7, 8, '9']
    expect(
      parseScanResponse(
        JSON.stringify({
          found: true,
          grid: new Array(9).fill(badRow),
          uncertainCells: [],
        }),
      ),
    ).toBeNull()
  })
})
