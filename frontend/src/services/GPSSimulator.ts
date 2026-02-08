/**
 * GPSSimulator Service
 * Simulates user movement along a predefined path for demonstration purposes.
 */

type Position = [number, number]; // [lat, lng]
type SimulationCallback = (position: Position, index: number) => void;

export class GPSSimulator {
  private currentPosition: Position | null = null;
  private simulationInterval: number | null = null;
  private path: Position[] = [];
  private speedMultiplier: number = 1;
  private currentIndex: number = 0;
  private onUpdate: SimulationCallback | null = null;

  // Average walking speed ~1.4 m/s. 
  // We'll simulate updates every 100ms for smoothness.
  // Real -time: 1 sec = 1 sec.
  // 2x speed: 1 sec = 2 sec of movement.

  constructor() {
    this.currentPosition = null;
  }

  /**
   * Set the initial position of the user
   */
  public setPosition(lat: number, lng: number) {
    this.currentPosition = [lat, lng];
  }

  /**
   * Get current position
   */
  public getPosition(): Position | null {
    return this.currentPosition;
  }

  /**
   * Calculate distance between two points in meters
   */
  public haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Start simulating movement along a path
   * @param path Array of [lat, lng] coordinates
   * @param onUpdate Callback function(pos, index)
   * @param speedMultiplier Speed factor (1 = realtime, 2 = 2x, etc.)
   */
  public startPathSimulation(
    path: Position[],
    onUpdate: SimulationCallback,
    speedMultiplier: number = 1
  ) {
    this.stop(); // Stop any existing simulation
    this.path = path;
    this.onUpdate = onUpdate;
    this.speedMultiplier = speedMultiplier;
    this.currentIndex = 0;

    if (path.length < 2) return;

    // Start slightly simpler: Move point to point every X ms based on speed
    // For smoother animation, we'd interpolate between points.

    // Let's implement interpolation.
    // Assume points are relatively close (from Mapbox geometry).
    // We will step through the path.

    let currentSegmentIndex = 0;
    let progressInSegment = 0; // 0.0 to 1.0

    const updateStep = () => {
      if (currentSegmentIndex >= this.path.length - 1) {
        this.stop(); // Reached end
        return;
      }

      const p1 = this.path[currentSegmentIndex];
      const p2 = this.path[currentSegmentIndex + 1];

      // Distance of this segment
      const dist = this.haversineDistance(p1[0], p1[1], p2[0], p2[1]);

      // Speed in m/s (1.4 base * multiplier)
      // If we update every 50ms (20fps)
      const timeDelta = 0.05; // seconds
      const speed = 1.4 * this.speedMultiplier;
      const distanceStep = speed * timeDelta; // meters to move per frame

      // Fraction of segment to move
      const fractionStep = dist > 0 ? distanceStep / dist : 1;

      progressInSegment += fractionStep;

      // Check if we finished segment
      if (progressInSegment >= 1) {
        progressInSegment = 0;
        currentSegmentIndex++;

        // If we jumped past end
        if (currentSegmentIndex >= this.path.length - 1) {
          this.currentPosition = this.path[this.path.length - 1];
          if (this.onUpdate) this.onUpdate(this.currentPosition, this.path.length - 1);
          this.stop();
          return;
        }
      }

      // Interpolate
      const lat = p1[0] + (p2[0] - p1[0]) * progressInSegment;
      const lng = p1[1] + (p2[1] - p1[1]) * progressInSegment;

      this.currentPosition = [lat, lng];

      if (this.onUpdate) {
        this.onUpdate(this.currentPosition, currentSegmentIndex);
      }

      // Loop
      // @ts-ignore
      this.simulationInterval = setTimeout(updateStep, 50);
    };

    updateStep();
  }

  public stop() {
    if (this.simulationInterval) {
      clearTimeout(this.simulationInterval);
      this.simulationInterval = null;
    }
  }
}

export const gpsSimulator = new GPSSimulator();
