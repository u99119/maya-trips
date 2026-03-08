/**
 * Trip Statistics Module
 * Calculates and displays trip statistics comparing actual vs. recommended route
 * Phase 1.6.9
 */

class TripStatistics {
  constructor() {
    this.currentTrip = null;
    this.currentRoute = null;
  }

  /**
   * Update current trip and route data
   */
  update(trip, route) {
    this.currentTrip = trip;
    this.currentRoute = route;
  }

  /**
   * Calculate distance comparison (actual vs. recommended)
   */
  calculateDistanceComparison() {
    if (!this.currentTrip || !this.currentRoute) {
      return { actual: 0, recommended: 0, difference: 0, percentage: 0 };
    }

    const actualDistance = this.currentTrip.stats?.totalDistance || 0;
    const completedSegments = this.currentTrip.completedSegments || [];
    
    // Calculate recommended distance for completed segments
    let recommendedDistance = 0;
    completedSegments.forEach(seg => {
      recommendedDistance += seg.expectedDistance || 0;
    });

    const difference = actualDistance - recommendedDistance;
    const percentage = recommendedDistance > 0 ? (difference / recommendedDistance) * 100 : 0;

    return {
      actual: actualDistance,
      recommended: recommendedDistance,
      difference,
      percentage
    };
  }

  /**
   * Calculate time comparison (actual vs. recommended)
   */
  calculateTimeComparison() {
    if (!this.currentTrip || !this.currentRoute) {
      return { actual: 0, recommended: 0, difference: 0, percentage: 0 };
    }

    const actualTime = this.currentTrip.stats?.totalTime || 0;
    const completedSegments = this.currentTrip.completedSegments || [];
    
    // Calculate recommended time for completed segments
    let recommendedTime = 0;
    completedSegments.forEach(seg => {
      recommendedTime += seg.expectedTime || 0;
    });

    const difference = actualTime - recommendedTime;
    const percentage = recommendedTime > 0 ? (difference / recommendedTime) * 100 : 0;

    return {
      actual: actualTime,
      recommended: recommendedTime,
      difference,
      percentage
    };
  }

  /**
   * Get transport mode breakdown
   */
  getTransportBreakdown() {
    if (!this.currentTrip) {
      return [];
    }

    const breakdown = {};
    const completedSegments = this.currentTrip.completedSegments || [];
    let totalDistance = 0;

    completedSegments.forEach(seg => {
      const mode = seg.transportMode || 'walking';
      const distance = seg.actualDistance || 0;
      
      if (!breakdown[mode]) {
        breakdown[mode] = { distance: 0, count: 0 };
      }
      
      breakdown[mode].distance += distance;
      breakdown[mode].count += 1;
      totalDistance += distance;
    });

    // Convert to array with percentages
    return Object.entries(breakdown).map(([mode, data]) => ({
      mode,
      distance: data.distance,
      count: data.count,
      percentage: totalDistance > 0 ? (data.distance / totalDistance) * 100 : 0
    })).sort((a, b) => b.distance - a.distance);
  }

  /**
   * Analyze route choices at junctions
   */
  analyzeRouteChoices() {
    if (!this.currentTrip || !this.currentRoute) {
      return [];
    }

    const choices = [];
    const completedSegments = this.currentTrip.completedSegments || [];

    completedSegments.forEach(seg => {
      // Find if this was a recommended segment
      const routeSegment = this.currentRoute.segments.find(s => s.id === seg.segmentId);
      const isRecommended = routeSegment?.recommended || false;

      choices.push({
        segmentName: seg.segmentName,
        from: seg.from,
        to: seg.to,
        transportMode: seg.transportMode,
        actualDistance: seg.actualDistance,
        expectedDistance: seg.expectedDistance,
        actualTime: seg.actualTime,
        expectedTime: seg.expectedTime,
        isRecommended,
        deviation: seg.actualDistance - seg.expectedDistance
      });
    });

    return choices;
  }

  /**
   * Calculate efficiency score (0-100)
   */
  calculateEfficiencyScore() {
    if (!this.currentTrip || !this.currentRoute) {
      return { total: 0, routeAdherence: 0, timeEfficiency: 0, distanceEfficiency: 0 };
    }

    const distComp = this.calculateDistanceComparison();
    const timeComp = this.calculateTimeComparison();
    const choices = this.analyzeRouteChoices();

    // Route adherence: % of recommended segments taken
    const recommendedCount = choices.filter(c => c.isRecommended).length;
    const routeAdherence = choices.length > 0 ? (recommendedCount / choices.length) * 100 : 100;

    // Distance efficiency: penalize for going over recommended
    const distanceEfficiency = Math.max(0, 100 - Math.abs(distComp.percentage));

    // Time efficiency: penalize for going over recommended
    const timeEfficiency = Math.max(0, 100 - Math.abs(timeComp.percentage));

    // Total score (weighted average)
    const total = (routeAdherence * 0.4) + (distanceEfficiency * 0.3) + (timeEfficiency * 0.3);

    return {
      total: Math.round(total),
      routeAdherence: Math.round(routeAdherence),
      distanceEfficiency: Math.round(distanceEfficiency),
      timeEfficiency: Math.round(timeEfficiency)
    };
  }

  /**
   * Format distance (meters to km)
   */
  formatDistance(meters) {
    return (meters / 1000).toFixed(1);
  }

  /**
   * Format time (seconds to hours/minutes)
   */
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Format percentage with sign
   */
  formatPercentage(value) {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }

  /**
   * Generate text summary for export
   */
  generateTextSummary() {
    if (!this.currentTrip || !this.currentRoute) {
      return 'No trip data available';
    }

    const distComp = this.calculateDistanceComparison();
    const timeComp = this.calculateTimeComparison();
    const transport = this.getTransportBreakdown();
    const score = this.calculateEfficiencyScore();
    const routeName = this.currentRoute.name || 'Trip';
    const date = new Date().toLocaleDateString();

    let summary = `${routeName.toUpperCase()} - TRIP SUMMARY\n`;
    summary += `Date: ${date}\n`;
    summary += `${'='.repeat(40)}\n\n`;

    summary += `OVERVIEW\n`;
    summary += `Distance: ${this.formatDistance(distComp.actual)} km (Rec: ${this.formatDistance(distComp.recommended)} km)\n`;
    summary += `Time: ${this.formatTime(timeComp.actual)} (Rec: ${this.formatTime(timeComp.recommended)})\n`;
    summary += `Segments: ${this.currentTrip.completedSegments?.length || 0}\n`;
    summary += `Score: ${score.total}/100\n\n`;

    summary += `TRANSPORT BREAKDOWN\n`;
    transport.forEach(t => {
      const icon = this.getTransportIcon(t.mode);
      summary += `${icon} ${t.mode}: ${this.formatDistance(t.distance)} km (${t.percentage.toFixed(0)}%)\n`;
    });

    return summary;
  }

  /**
   * Export as JSON
   */
  exportAsJSON() {
    const data = {
      trip: this.currentTrip,
      route: this.currentRoute,
      statistics: {
        distance: this.calculateDistanceComparison(),
        time: this.calculateTimeComparison(),
        transport: this.getTransportBreakdown(),
        choices: this.analyzeRouteChoices(),
        score: this.calculateEfficiencyScore()
      },
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trip-stats-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Export as CSV
   */
  exportAsCSV() {
    const choices = this.analyzeRouteChoices();

    let csv = 'Segment,From,To,Transport,Actual Dist (m),Expected Dist (m),Actual Time (s),Expected Time (s),Recommended\n';

    choices.forEach(c => {
      csv += `"${c.segmentName}","${c.from}","${c.to}","${c.transportMode}",${c.actualDistance},${c.expectedDistance},${c.actualTime},${c.expectedTime},${c.isRecommended}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trip-segments-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Get transport icon
   */
  getTransportIcon(mode) {
    const icons = {
      'walking': '🚶',
      'driving': '🚗',
      'battery-car': '🚡',
      'ropeway': '🚠',
      'pony': '🐴',
      'palanquin': '🪑',
      'helicopter': '🚁'
    };
    return icons[mode] || '🚶';
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TripStatistics;
}

