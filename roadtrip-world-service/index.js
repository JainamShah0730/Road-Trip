import express from "express";
import cors from 'cors'
import dotenv from 'dotenv'
import { fetchRoads } from './overpass.js'
import { fetchElevations } from './elevation.js'
import fs from 'fs'
import { fetchWaterFeatures } from './overpass.js'


dotenv.config()


const SANTA_MONICA_BBOX = {
    minLat: 33.998,
    maxLat: 34.020,
    minLng: -118.510,
    maxLng: -118.490
}

const CACHE_FILE = './roads-cache.json'
const WATER_CACHE_FILE = './water-cache.json'
const ELEVATION_CACHE_FILE = './elevation-cache.json'

function loadElevationCache() {
    if (fs.existsSync(ELEVATION_CACHE_FILE)) {
        return new Map(Object.entries(JSON.parse(fs.readFileSync(ELEVATION_CACHE_FILE, 'utf-8'))))

    }
    return new Map();
}

function saveElevationCache(cache) {
    fs.writeFileSync(ELEVATION_CACHE_FILE, JSON.stringify(Object.fromEntries(cache)))
}

const elevationCache = loadElevationCache();

function loadCacheFromDisk() {
    if (fs.existsSync(CACHE_FILE)) {
        return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
    }
    return null
}

function saveCacheToDisk(roads) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(roads))
}

function loadWaterCacheFromDisk() {
    if (fs.existsSync(WATER_CACHE_FILE)) {
        return JSON.parse(fs.readFileSync(WATER_CACHE_FILE, 'utf-8'))
    }
    return null
}

function saveWaterCacheToDisk(water) {
    fs.writeFileSync(WATER_CACHE_FILE, JSON.stringify(water))
}

let waterCache = loadWaterCacheFromDisk()

let roadsCache = loadCacheFromDisk()


const app = express()
app.use(cors())

const PORT = process.env.PORT || 4000

app.get('/health', (req, res) => {
    res.json({ status: 'ok' })
})

app.get('/roads', async (req, res) => {
    try {
        if (roadsCache) {
            return res.json({ count: roadsCache.length, roads: roadsCache, cached: true })
        }

        const roads = await fetchRoads(SANTA_MONICA_BBOX)
        roadsCache = roads
        saveCacheToDisk(roads)
        res.json({ count: roads.length, roads, cached: false })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to fetch roads' })
    }
})

app.get('/water', async (req, res) => {
    try {
        if (waterCache) {
            return res.json({ count: waterCache.length, features: waterCache, cached: true })
        }

        const features = await fetchWaterFeatures(SANTA_MONICA_BBOX)
        waterCache = features
        saveWaterCacheToDisk(features)
        res.json({ count: features.length, features, cached: false })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to fetch water features' })
    }
})


async function buildTileWithElevation(roads) {
    if (process.env.SKIP_ELEVATION === 'true') {
        console.log('SKIP_ELEVATION enabled — using flat elevation for dev speed');
        return roads.map(road => ({
            ...road,
            points: road.points.map(p => [p[0], p[1], 0])
        }));
    }

    const pointKey = (lat, lng) => `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    const uniquePoints = new Map();

    for (const road of roads) {
        for (const p of road.points) {
            const key = pointKey(p[0], p[1])
            if (!elevationCache.has(key) && !uniquePoints.has(key)) {
                uniquePoints.set(key, [p[0], p[1]])
            }
        }
    }

    console.log(`${uniquePoints.size} unique points need elevation (already cached: ${elevationCache.size})`);

    if (uniquePoints.size > 0) {
        const pointsArray = Array.from(uniquePoints.values())
        const elevation = await fetchElevations(pointsArray)

        pointsArray.forEach((p, i) => {
            elevationCache.set(pointKey(p[0], p[1]), elevation[i])
        })

        saveElevationCache(elevationCache)
    }

    const roadsWithElevation = roads.map(road => ({
        ...road,
        points: road.points.map(p => {
            const key = pointKey(p[0], p[1])
            const elevation = elevationCache.get(key) ?? 0;
            return [p[0], p[1], elevation]
        })
    }))

    return roadsWithElevation;

}

app.get('/tile', async (req, res) => {
    try {
        let roads = roadsCache
        if (!roads) {
            roads = await fetchRoads(SANTA_MONICA_BBOX)
            roadsCache = roads
        }

        const roadsWithElevation = await buildTileWithElevation(roads)

        res.json({
            tileId: 'santa-monica-pier-v1',
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