/**
 * Progress UI Module
 * Updates the bottom drawer with current trip progress information
 */

import { routeLoaderV2 } from './route-loader-v2.js';
import { segmentTracker } from './segment-tracker.js';

class ProgressUI {
  constructor() {
    this.currentTrip = null;
    this.routeV2 = null;
  }

  /**
   * Initialize with trip and route data
   */
  init(trip, routeV2) {
    this.currentTrip = trip;
    this.routeV2 = routeV2;
    this.updateAll();
  }

  /**
   * Update all progress UI elements
   */
  updateAll() {
    this.updateCurrentLocation();
    this.updateSegmentProgress();
    this.updateTripProgress();
    this.updateNextDestination();
    this.updateCompletedSegments();
    this.updateAvailableRoutes(); // Phase 1.6.8 enhancement
  }

  /**
   * Update current location (junction or segment)
   */
  updateCurrentLocation() {
    const locationValue = document.getElementById('currentLocationValue');
    if (!locationValue) return;

    // Remove all state classes
    locationValue.classList.remove('not-started', 'at-junction', 'on-segment');

    if (!this.currentTrip) {
      locationValue.textContent = 'Not started';
      locationValue.classList.add('not-started');
      return;
    }

    // Check if on a segment
    if (this.currentTrip.currentSegment) {
      const segment = this.routeV2?.segments.find(s => s.id === this.currentTrip.currentSegment);
      if (segment) {
        locationValue.textContent = `📍 ${segment.name}`;
        locationValue.classList.add('on-segment');
        return;
      }
    }

    // Check if at a junction
    if (this.currentTrip.currentJunction) {
      const junction = this.routeV2?.junctions.find(j => j.id === this.currentTrip.currentJunction);
      if (junction) {
        locationValue.textContent = `🔀 ${junction.name}`;
        locationValue.classList.add('at-junction');
        return;
      }
    }

    locationValue.textContent = 'Not started';
    locationValue.classList.add('not-started');
  }

  /**
   * Update current segment progress
   */
  updateSegmentProgress() {
    const container = document.getElementById('segmentProgressContainer');
    const percentEl = document.getElementById('segmentProgressPercent');
    const fillEl = document.getElementById('segmentProgressFill');
    const detailsEl = document.getElementById('segmentProgressDetails');

    if (!container || !this.currentTrip || !this.currentTrip.currentSegment) {
      if (container) container.style.display = 'none';
      return;
    }

    // Show container
    container.style.display = 'block';

    // Get segment data
    const segment = this.routeV2?.segments.find(s => s.id === this.currentTrip.currentSegment);
    if (!segment) {
      container.style.display = 'none';
      return;
    }

    // Get progress from segment tracker
    const progress = segmentTracker.getProgress();
    const progressPercent = progress?.progress || 0;

    // Update UI
    if (percentEl) percentEl.textContent = `${Math.round(progressPercent)}%`;
    if (fillEl) fillEl.style.width = `${progressPercent}%`;

    if (detailsEl) {
      const distanceRemaining = progress?.distanceToEnd || segment.distance;
      const timeRemaining = progress?.estimatedTimeRemaining || segment.estimatedTime;

      detailsEl.innerHTML = `
        <span class="detail-item">${(distanceRemaining / 1000).toFixed(2)} km remaining</span>
        <span class="detail-item">${Math.round(timeRemaining / 60)} min</span>
      `;
    }
  }

  /**
   * Update overall trip progress
   */
  updateTripProgress() {
    const percentEl = document.getElementById('tripProgressPercent');
    const fillEl = document.getElementById('tripProgressFill');
    const statsEl = document.getElementById('completedSegmentsCount');

    if (!this.currentTrip || !this.routeV2) {
      if (percentEl) percentEl.textContent = '0%';
      if (fillEl) fillEl.style.width = '0%';
      if (statsEl) statsEl.textContent = '0 segments completed';
      return;
    }

    const totalSegments = this.routeV2.segments.length;
    const completedCount = this.currentTrip.completedSegments?.length || 0;
    const progressPercent = totalSegments > 0 ? (completedCount / totalSegments) * 100 : 0;

    if (percentEl) percentEl.textContent = `${Math.round(progressPercent)}%`;
    if (fillEl) fillEl.style.width = `${progressPercent}%`;
    if (statsEl) statsEl.textContent = `${completedCount} / ${totalSegments} segments completed`;
  }

  /**
   * Update next destination
   */
  updateNextDestination() {
    const nextValue = document.getElementById('nextMilestoneValue');
    if (!nextValue || !this.currentTrip || !this.routeV2) {
      if (nextValue) nextValue.textContent = '--';
      return;
    }

    // If on a segment, next is the destination junction
    if (this.currentTrip.currentSegment) {
      const segment = this.routeV2.segments.find(s => s.id === this.currentTrip.currentSegment);
      if (segment) {
        const destJunction = this.routeV2.junctions.find(j => j.id === segment.to);
        if (destJunction) {
          nextValue.textContent = destJunction.name;
          return;
        }
      }
    }

    // If at a junction, show available next junctions
    if (this.currentTrip.currentJunction) {
      const outgoingSegments = this.routeV2.segments.filter(s => s.from === this.currentTrip.currentJunction);
      if (outgoingSegments.length > 0) {
        const nextJunctions = outgoingSegments.map(s => {
          const junction = this.routeV2.junctions.find(j => j.id === s.to);
          return junction?.name;
        }).filter(Boolean);

        if (nextJunctions.length === 1) {
          nextValue.textContent = nextJunctions[0];
        } else if (nextJunctions.length > 1) {
          nextValue.textContent = nextJunctions.join(' / ');
        } else {
          nextValue.textContent = 'Journey Complete! 🎉';
        }
        return;
      }
    }

    nextValue.textContent = '--';
  }

  /**
   * Update completed segments list
   */
  updateCompletedSegments() {
    const container = document.getElementById('completedSegmentsContainer');
    const list = document.getElementById('completedSegmentsList');

    if (!container || !list || !this.currentTrip) return;

    const completedSegments = this.currentTrip.completedSegments || [];

    if (completedSegments.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    list.innerHTML = '';

    completedSegments.forEach(segmentData => {
      const item = document.createElement('div');
      item.className = 'completed-segment-item';

      const actualDist = (segmentData.actualDistance / 1000).toFixed(2);
      const actualTime = Math.round(segmentData.actualTime / 60);

      item.innerHTML = `
        <span class="checkmark">✅</span>
        <span class="segment-name">${segmentData.segmentName}</span>
        <span class="segment-stats">${actualDist} km · ${actualTime} min</span>
      `;

      list.appendChild(item);
    });
  }

  /**
   * Update available routes at current junction (Phase 1.6.8 enhancement)
   */
  updateAvailableRoutes() {
    const container = document.getElementById('availableRoutesContainer');
    const list = document.getElementById('availableRoutesList');

    if (!container || !list || !this.currentTrip || !this.routeV2) {
      if (container) container.style.display = 'none';
      return;
    }

    // Only show if at a junction
    if (!this.currentTrip.currentJunction) {
      container.style.display = 'none';
      return;
    }

    // Get available outgoing segments from current junction
    const outgoingSegments = this.routeV2.segments.filter(
      s => s.from === this.currentTrip.currentJunction
    );

    if (outgoingSegments.length === 0) {
      container.style.display = 'none';
      return;
    }

    // Show container and populate list
    container.style.display = 'block';
    list.innerHTML = '';

    // Get recommended segment (if any)
    const recommendedPath = this.routeV2.recommendedPaths?.[0];
    const recommendedSegmentId = recommendedPath?.segments?.[0]; // Simplified - would need better logic

    outgoingSegments.forEach(segment => {
      const item = document.createElement('div');
      item.className = 'available-route-item';

      const isRecommended = segment.id === recommendedSegmentId;
      if (isRecommended) {
        item.classList.add('recommended');
      }

      const distanceKm = (segment.distance / 1000).toFixed(1);
      const timeMin = Math.round(segment.estimatedTime / 60);
      const icon = this.getTransportIcon(segment.transportMode);

      item.innerHTML = `
        <span class="route-icon">${icon}</span>
        <span class="route-name">${segment.name}</span>
        <span class="route-details">${distanceKm}km • ${timeMin}min</span>
        ${isRecommended ? '<span class="recommended-badge">Recommended</span>' : ''}
      `;

      list.appendChild(item);
    });
  }

  /**
   * Get transport mode icon
   */
  getTransportIcon(mode) {
    const icons = {
      'walking': '🚶',
      'driving': '🚗',
      'flying': '✈️',
      'battery-car': '🚡',
      'ropeway': '🚠',
      'helicopter': '🚁'
    };
    return icons[mode] || '🚶';
  }
}

export const progressUI = new ProgressUI();

