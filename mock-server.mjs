import express from 'express'
import cors from 'cors'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_PATH = path.join(__dirname, 'src', 'data', 'poi.json')
const PORT = Number(process.env.MOCK_API_PORT || 4174)

const app = express()
app.use(cors())
app.use(express.json())

let poiCache = []

async function loadPois() {
  if (poiCache.length) {
    return poiCache
  }
  const raw = await readFile(DATA_PATH, 'utf-8')
  poiCache = JSON.parse(raw)
  return poiCache
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRad = value => (value * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function matchesTimeFilter(openHours, filter) {
  if (!openHours || filter === 'all') {
    return true
  }
  const [startStr, endStr] = openHours.split('-')
  if (!startStr || !endStr) {
    return true
  }
  const toHour = value => {
    const [hour, minute = '0'] = value.split(':')
    return Number(hour) + Number(minute) / 60
  }

  const ranges = {
    morning: [6, 12],
    afternoon: [12, 18],
    evening: [18, 24],
  }

  if (!ranges[filter]) {
    return true
  }
  const [rangeStart, rangeEnd] = ranges[filter]
  const start = toHour(startStr)
  const end = toHour(endStr)
  return start < rangeEnd && end > rangeStart
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/pois', async (req, res) => {
  const { category, radius, anchorLat, anchorLng, time } = req.query
  const pois = await loadPois()

  const filtered = pois.filter(poi => {
    if (category && category !== 'all' && poi.category !== category) {
      return false
    }
    if (radius && anchorLat && anchorLng) {
      const distanceKm = calculateDistance(
        Number(anchorLat),
        Number(anchorLng),
        poi.lat,
        poi.lng,
      )
      if (distanceKm * 1000 > Number(radius)) {
        return false
      }
    }
    if (time && time !== 'all' && !matchesTimeFilter(poi.openHours, time)) {
      return false
    }
    return true
  })

  res.json({ items: filtered, total: filtered.length })
})

app.get('/api/pois/:poiId', async (req, res) => {
  const pois = await loadPois()
  const poi = pois.find(item => item.id === req.params.poiId)
  if (!poi) {
    res.status(404).json({ message: 'POI not found' })
    return
  }
  res.json(poi)
})

app.listen(PORT, () => {
  console.log(`Mock API server listening on http://localhost:${PORT}`)
})
