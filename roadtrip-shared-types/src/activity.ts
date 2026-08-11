export interface ActivityTrigger {
    activityType: 'fishing';
    zoneId: string
    position: [lat: number, lng: number]
}

export interface ActivityResult {
    activityType: 'fishing'
    playerId: string
    score: number;
}