export interface RoadSegment {
    id: string
    points: [lat: number, lng: number, elevation: number][]
    roadType: string
}

export interface WorldTile {
    titleId: string
    bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
    roads: RoadSegment[]
    elevationGrid: number[][]
}