// Shared mock data for the Lieferr logistics dashboard.
// Coordinates are centered around the Munich / Bavaria region.

export type Customer = {
  id: string
  name: string
  address: string
  city: string
  demand: number // package units
  window: string // delivery time window
  lat: number
  lng: number
}

export type Vehicle = {
  id: string
  name: string
  type: string
  capacity: number
  driver: string
  status: "active" | "idle" | "maintenance"
  utilization: number
  plate: string
}

export type Depot = {
  id: string
  name: string
  address: string
  city: string
  vehicles: number
  lat: number
  lng: number
}

export type RouteStop = {
  lat: number
  lng: number
  label: string
}

export type OptimizedRoute = {
  id: string
  vehicle: string
  driver: string
  color: string
  stops: number
  distance: number // km
  duration: number // minutes
  load: number // %
  cost: number // EUR
  path: RouteStop[]
}

export const depots: Depot[] = [
  {
    id: "DEP-01",
    name: "Munich Central Hub",
    address: "Landsberger Str. 110",
    city: "München",
    vehicles: 12,
    lat: 48.1421,
    lng: 11.5212,
  },
  {
    id: "DEP-02",
    name: "Garching Distribution",
    address: "Daimlerstr. 4",
    city: "Garching",
    vehicles: 7,
    lat: 48.2489,
    lng: 11.6532,
  },
  {
    id: "DEP-03",
    name: "Süd Fulfillment Center",
    address: "Tegernseer Landstr. 161",
    city: "München",
    vehicles: 9,
    lat: 48.0991,
    lng: 11.5743,
  },
]

export const customers: Customer[] = [
  { id: "C-1001", name: "Bäckerei Hofmann", address: "Sendlinger Str. 24", city: "München", demand: 14, window: "08:00 – 10:00", lat: 48.1351, lng: 11.5680  },
  { id: "C-1002", name: "TechnoMart GmbH", address: "Leopoldstr. 88", city: "München", demand: 32, window: "09:00 – 12:00", lat: 48.1601, lng: 11.5860},
  { id: "C-1003", name: "Café Sonne", address: "Rosenheimer Str. 145", city: "München", demand: 8, window: "07:00 – 09:00", lat: 48.1255, lng: 11.6020 },
  { id: "C-1004", name: "Möbel Wagner", address: "Dachauer Str. 200", city: "München", demand: 45, window: "10:00 – 14:00", lat: 48.1720, lng: 11.5430 },
  { id: "C-1005", name: "Apotheke am Markt", address: "Marienplatz 8", city: "München", demand: 6, window: "08:00 – 11:00", lat: 48.1373, lng: 11.5754 },
  { id: "C-1006", name: "Garching Office Park", address: "Boltzmannstr. 3", city: "Garching", demand: 27, window: "09:00 – 13:00", lat: 48.2650, lng: 11.6710 },
  { id: "C-1007", name: "Sport Huber", address: "Schleißheimer Str. 90", city: "München", demand: 19, window: "11:00 – 15:00", lat: 48.1690, lng: 11.5640 },
  { id: "C-1008", name: "Blumen Lechner", address: "Tegernseer Landstr. 50", city: "München", demand: 11, window: "08:00 – 10:00", lat: 48.1085, lng: 11.5790 },
  { id: "C-1009", name: "Elektro Brandl", address: "Ingolstädter Str. 12", city: "München", demand: 38, window: "10:00 – 16:00", lat: 48.1920, lng: 11.5710 },
  { id: "C-1010", name: "Hotel Bavaria", address: "Bayerstr. 35", city: "München", demand: 22, window: "07:00 – 10:00", lat: 48.1395, lng: 11.5560 },
  { id: "C-1011", name: "Buchhandlung Lesezeit", address: "Schwanthalerstr. 70", city: "München", demand: 9, window: "09:00 – 12:00", lat: 48.1360, lng: 11.5470 },
  { id: "C-1012", name: "Garten Center Süd", address: "Tegernseer Landstr. 280", city: "München", demand: 41, window: "10:00 – 15:00", lat: 48.0920, lng: 11.5810 },
  { id: "C-1013", name: "Kantine Werk 2", address: "Frankfurter Ring 150", city: "München", demand: 28, window: "08:00 – 11:00", lat: 48.1980, lng: 11.5890 },
  { id: "C-1014", name: "Pizzeria Roma", address: "Lindwurmstr. 120", city: "München", demand: 13, window: "11:00 – 14:00", lat: 48.1230, lng: 11.5520 },
]

export const vehicles: Vehicle[] = [
  { id: "V-01", name: "Sprinter 01", type: "Transporter", capacity: 120, driver: "Anna Keller", status: "active", utilization: 87, plate: "M-LF 101" },
  { id: "V-02", name: "Sprinter 02", type: "Transporter", capacity: 120, driver: "Tobias Mayer", status: "active", utilization: 72, plate: "M-LF 102" },
  { id: "V-03", name: "Cargo Van 03", type: "Lieferwagen", capacity: 80, driver: "Sophie Bauer", status: "active", utilization: 94, plate: "M-LF 103" },
  { id: "V-04", name: "Cargo Van 04", type: "Lieferwagen", capacity: 80, driver: "Lukas Fischer", status: "idle", utilization: 0, plate: "M-LF 104" },
  { id: "V-05", name: "Truck 05", type: "LKW 7.5t", capacity: 320, driver: "Markus Wolf", status: "active", utilization: 68, plate: "M-LF 105" },
  { id: "V-06", name: "Truck 06", type: "LKW 7.5t", capacity: 320, driver: "Julia Schmidt", status: "maintenance", utilization: 0, plate: "M-LF 106" },
  { id: "V-07", name: "E-Van 07", type: "E-Transporter", capacity: 90, driver: "David Huber", status: "active", utilization: 81, plate: "M-LF 107" },
  { id: "V-08", name: "E-Van 08", type: "E-Transporter", capacity: 90, driver: "Lena Vogel", status: "active", utilization: 76, plate: "M-LF 108" },
]

export const optimizedRoutes: OptimizedRoute[] = [
  {
    id: "R-1",
    vehicle: "Sprinter 01",
    driver: "Anna Keller",
    color: "#2563eb",
    stops: 6,
    distance: 38.4,
    duration: 142,
    load: 87,
    cost: 64.2,
    path: [
      { lat: 48.1421, lng: 11.5212, label: "Munich Central Hub" },
      { lat: 48.1395, lng: 11.5560, label: "Hotel Bavaria" },
      { lat: 48.1373, lng: 11.5754, label: "Apotheke am Markt" },
      { lat: 48.1351, lng: 11.5680, label: "Bäckerei Hofmann" },
      { lat: 48.1378, lng: 11.5720, label: "Modehaus Weiß" },
      { lat: 48.1255, lng: 11.6020, label: "Café Sonne" },
      { lat: 48.1421, lng: 11.5212, label: "Munich Central Hub" },
    ],
  },
  {
    id: "R-2",
    vehicle: "Cargo Van 03",
    driver: "Sophie Bauer",
    color: "#0891b2",
    stops: 5,
    distance: 31.7,
    duration: 118,
    load: 94,
    cost: 52.8,
    path: [
      { lat: 48.0991, lng: 11.5743, label: "Süd Fulfillment Center" },
      { lat: 48.1085, lng: 11.5790, label: "Blumen Lechner" },
      { lat: 48.0920, lng: 11.5810, label: "Garten Center Süd" },
      { lat: 48.1230, lng: 11.5520, label: "Pizzeria Roma" },
      { lat: 48.1360, lng: 11.5470, label: "Buchhandlung Lesezeit" },
      { lat: 48.0991, lng: 11.5743, label: "Süd Fulfillment Center" },
    ],
  },
  {
    id: "R-3",
    vehicle: "Truck 05",
    driver: "Markus Wolf",
    color: "#0d9488",
    stops: 4,
    distance: 44.9,
    duration: 161,
    load: 68,
    cost: 78.5,
    path: [
      { lat: 48.1421, lng: 11.5212, label: "Munich Central Hub" },
      { lat: 48.1720, lng: 11.5430, label: "Möbel Wagner" },
      { lat: 48.1920, lng: 11.5710, label: "Elektro Brandl" },
      { lat: 48.1980, lng: 11.5890, label: "Kantine Werk 2" },
      { lat: 48.1421, lng: 11.5212, label: "Munich Central Hub" },
    ],
  },
  {
    id: "R-4",
    vehicle: "E-Van 07",
    driver: "David Huber",
    color: "#7c3aed",
    stops: 5,
    distance: 29.3,
    duration: 109,
    load: 81,
    cost: 41.6,
    path: [
      { lat: 48.2489, lng: 11.6532, label: "Garching Distribution" },
      { lat: 48.2510, lng: 11.6480, label: "Garching Klinik" },
      { lat: 48.2650, lng: 11.6710, label: "Garching Office Park" },
      { lat: 48.1690, lng: 11.5640, label: "Sport Huber" },
      { lat: 48.1601, lng: 11.5860, label: "TechnoMart GmbH" },
      { lat: 48.2489, lng: 11.6532, label: "Garching Distribution" },
    ],
  },
]

export const totals = {
  customers: customers.length,
  vehicles: vehicles.length,
  depots: depots.length,
  totalDistance: optimizedRoutes.reduce((s, r) => s + r.distance, 0),
  avgUtilization: Math.round(
    vehicles.filter((v) => v.status === "active").reduce((s, v) => s + v.utilization, 0) /
      vehicles.filter((v) => v.status === "active").length,
  ),
  totalCost: optimizedRoutes.reduce((s, r) => s + r.cost, 0),
  totalStops: optimizedRoutes.reduce((s, r) => s + r.stops, 0),
}

export const distanceTrend = [
  { day: "Mo", distance: 142, cost: 238 },
  { day: "Di", distance: 168, cost: 274 },
  { day: "Mi", distance: 131, cost: 221 },
  { day: "Do", distance: 184, cost: 301 },
  { day: "Fr", distance: 156, cost: 259 },
  { day: "Sa", distance: 98, cost: 167 },
  { day: "So", distance: 64, cost: 112 },
]
