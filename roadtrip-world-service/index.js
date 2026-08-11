import express from "express";
import cors from 'cors'
import dotenv from 'dotenv'
import { fetchRoads } from './overpass.js'
import { fetchElevations } from './elevation.js'


dotenv.config()

let roadsCache = null;

const SANTA_MONICA_BBOX = {
    minLat: 34.000,
    maxLat: 34.020,
    minLng: -118.505,
    maxLng: -118.485
}

const app = express()
app.use(cors())

const PORT = process.env.PORT || 4000

app.get('/health', (req, res) => {
    res.json({ status: 'ok' })
})

app.get('/roads', async (req, res) => {
    try {
        const roads = await fetchRoads(SANTA_MONICA_BBOX)
        res.json({ count: roads.length, roads })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to fetch roads' })
    }
})

app.get('/roads', async (req, res) => {
    try {
        if (roadsCache) {
            return res.json({ count: roadsCache.length, roads: roadsCache, cached: true })
        }

        const roads = await fetchRoads(SANTA_MONICA_BBOX)
        roadsCache = roads
        res.json({ count: roads.length, roads, cached: false })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to fetch roads' })
    }
})

async function buildTileWithElevation(roads) {
    const allPoints = roads.flatMap(road => road.points.map(p => [p[0], p[1]]))

    const elevations = await fetchElevations(allPoints)

    let idx = 0;
    const roadsWithElevation = roads.map(road => ({
        ...road,
        points: road.points.map(p => {
            const elevation = elevations[idx];
            idx++;
            return [p[0], p[1], elevation]
        })
    }))
    return roadsWithElevation;
}

app.get('/title', async (req, res) => {
    try {
        let roads = roadsCache
        if (!roads) {
            roads = await fetchRoads(SANTA_MONICA_BBOX)
            roadsCache = roads
        }

        const roadsWithElevation = await buildTileWithElevation(roads)

        res.json({
            titleId: 'sants-monica-pier-v1',
            bounds: {
                minLat: SANTA_MONICA_BBOX.minLat,
                maxLat: SANTA_MONICA_BBOX.maxLat,
                minLng: SANTA_MONICA_BBOX.minLng,
                maxLng: SANTA_MONICA_BBOX.maxLng
            },
            roads: roadsWithElevation
        })
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to build tile' })
    }
})
app.listen(PORT, () => {
    console.log(`world-service running on port ${PORT}`)
})