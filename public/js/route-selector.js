/**
 * Route Selector - UI for selecting routes at junctions
 * Displays modal with available segments when user arrives at a junction
 */

import { junctionDetector } from './junction-detector.js';
import { routeLoaderV2 } from './route-loader-v2.js';
import { segmentTracker } from './segment-tracker.js';

class RouteSelector {
  constructor() {
    this.modal = null;
    this.currentJunction = null;
    this.availableSegments = [];
    this.onSegmentSelected = null;
    this.completedSegments = [];
    this.tripId = null; // Current trip ID for tracking

    this.initializeElements();
    this.attachEventListeners();
  }

  /**
   * Initialize DOM elements
   */
  initializeElements() {
    this.modal = document.getElementById('routeSelectionModal');
    this.overlay = document.getElementById('routeSelectionOverlay');
    this.closeBtn = document.getElementById('routeSelectionClose');
    this.skipBtn = document.getElementById('btnSkipSelection');
    this.junctionNameEl = document.getElementById('junctionName');
    this.junctionSubtitleEl = document.getElementById('junctionSubtitle');
    this.routeOptionsEl = document.getElementById('routeOptions');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close modal handlers
    this.closeBtn?.addEventListener('click', () => this.hide());
    this.overlay?.addEventListener('click', () => this.hide());
    this.skipBtn?.addEventListener('click', () => this.handleSkip());

    // Listen to junction arrival events
    junctionDetector.on('junctionArrival', (data) => {
      this.handleJunctionArrival(data);
    });
  }

  /**
   * Handle junction arrival event
   * @param {Object} data - Junction arrival data
   */
  handleJunctionArrival(data) {
    const { junction, availableSegments } = data;
    
    // Only show modal if there are multiple route options
    if (availableSegments.length > 1) {
      this.show(junction, availableSegments);
    } else if (availableSegments.length === 1) {
      // Auto-select if only one option
      console.log('🔄 Auto-selecting only available segment:', availableSegments[0].segment.name);
      this.selectSegment(availableSegments[0]);
    }
  }

  /**
   * Show route selection modal
   * @param {Object} junction - Junction object
   * @param {Array} segments - Available segments
   */
  show(junction, segments) {
    this.currentJunction = junction;
    this.availableSegments = segments;

    // Update junction info
    this.junctionNameEl.textContent = junction.name;
    
    const facilityCount = junction.facilities?.length || 0;
    const facilityText = facilityCount > 0 
      ? `${facilityCount} facilities available` 
      : 'Choose your route';
    this.junctionSubtitleEl.textContent = facilityText;

    // Render segment cards
    this.renderSegmentCards();

    // Show modal
    this.modal.style.display = 'flex';
    
    console.log(`📍 Route selection modal shown for junction: ${junction.name}`);
  }

  /**
   * Hide route selection modal
   */
  hide() {
    this.modal.style.display = 'none';
    this.currentJunction = null;
    this.availableSegments = [];
    
    console.log('✖️ Route selection modal hidden');
  }

  /**
   * Render segment cards
   */
  renderSegmentCards() {
    if (!this.routeOptionsEl) return;

    // Get recommended segment
    const recommended = junctionDetector.getRecommendedSegment(
      this.currentJunction.id,
      this.completedSegments
    );

    // Clear existing cards
    this.routeOptionsEl.innerHTML = '';

    // Create card for each segment
    this.availableSegments.forEach(segmentData => {
      const card = this.createSegmentCard(
        segmentData,
        recommended?.segment.id === segmentData.segment.id
      );
      this.routeOptionsEl.appendChild(card);
    });
  }

  /**
   * Create segment card element
   * @param {Object} segmentData - Segment data with metadata
   * @param {boolean} isRecommended - Whether this is the recommended segment
   * @returns {HTMLElement} Card element
   */
  createSegmentCard(segmentData, isRecommended = false) {
    const { segment, destination, distance, estimatedTime, transportMode, difficulty, requiresTicket } = segmentData;
    
    const card = document.createElement('div');
    card.className = `segment-card ${isRecommended ? 'recommended' : ''}`;
    card.dataset.segmentId = segment.id;

    // Format distance
    const distanceText = distance >= 1000 
      ? `${(distance / 1000).toFixed(1)} km` 
      : `${distance} m`;

    // Format time
    const timeText = junctionDetector.formatETA(estimatedTime);

    // Transport mode icon
    const transportIcon = this.getTransportIcon(transportMode);

    card.innerHTML = `
      <div class="segment-header">
        <div class="segment-destination">
          <h3>
            ${transportIcon}
            ${destination.name}
          </h3>
        </div>
      </div>

      <div class="segment-details">
        <div class="detail-item">
          <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <div>
            <div class="detail-label">Distance</div>
            <div class="detail-value">${distanceText}</div>
          </div>
        </div>

        <div class="detail-item">
          <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <div>
            <div class="detail-label">Time</div>
            <div class="detail-value">${timeText}</div>
          </div>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 12px;">
        <span class="difficulty-badge ${difficulty || 'moderate'}">
          ${this.getDifficultyIcon(difficulty)}
          ${(difficulty || 'moderate').charAt(0).toUpperCase() + (difficulty || 'moderate').slice(1)}
        </span>
        <span style="font-size: 13px; color: var(--text-secondary);">
          ${this.getTransportLabel(transportMode)}
        </span>
      </div>

      ${requiresTicket ? `
        <div class="ticket-required">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          Ticket required
        </div>
      ` : ''}
    `;

    // Add click handler
    card.addEventListener('click', () => {
      this.selectSegment(segmentData);
    });

    return card;
  }

  /**
   * Get transport mode icon SVG
   * @param {string} mode - Transport mode
   * @returns {string} SVG HTML
   */
  getTransportIcon(mode) {
    const icons = {
      walking: '<svg class="transport-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 3l3.293 3.293-7 7 1.414 1.414 7-7L21 11V3z"/><circle cx="9" cy="9" r="2"/><path d="M3 21l9-9"/></svg>',
      driving: '<svg class="transport-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 17h14v2a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-2z"/><path d="M16 17V5l1.5-1.5A2 2 0 0 1 19 3h0a2 2 0 0 1 2 2v12"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>',
      'battery-car': '<svg class="transport-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="10" rx="2"/><path d="M6 11h4m4 0h4M22 12v0"/><circle cx="7" cy="17" r="1"/><circle cx="17" cy="17" r="1"/></svg>',
      ropeway: '<svg class="transport-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 8l10-5 10 5M12 3v5"/><rect x="8" y="12" width="8" height="8" rx="1"/><path d="M12 8v4"/></svg>',
      helicopter: '<svg class="transport-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10h18M12 2v8m-7 4h14l-2 6H7l-2-6z"/></svg>',
      flying: '<svg class="transport-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 8h4l-1.5 9h-1M12 8v13m-7-9h14l-1.5-4h-11z"/></svg>'
    };
    return icons[mode] || icons.walking;
  }

  /**
   * Get transport mode label
   * @param {string} mode - Transport mode
   * @returns {string} Label
   */
  getTransportLabel(mode) {
    const labels = {
      walking: 'On Foot',
      driving: 'By Vehicle',
      'battery-car': 'Battery Car',
      ropeway: 'Cable Car',
      helicopter: 'Helicopter',
      flying: 'Flight'
    };
    return labels[mode] || mode;
  }

  /**
   * Get difficulty icon
   * @param {string} difficulty - Difficulty level
   * @returns {string} Icon HTML
   */
  getDifficultyIcon(difficulty) {
    if (difficulty === 'easy') {
      return '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>';
    } else if (difficulty === 'hard') {
      return '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/></svg>';
    }
    return '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>';
  }

  /**
   * Handle segment selection
   * @param {Object} segmentData - Selected segment data
   */
  async selectSegment(segmentData) {
    console.log('✅ Segment selected:', segmentData.segment.name);

    // Add to completed segments list
    this.completedSegments.push(segmentData.segment.id);

    // Record junction choice if we have junction info
    if (this.currentJunction && this.tripId) {
      await segmentTracker.recordJunctionChoice(this.tripId, {
        junctionId: this.currentJunction.id,
        junctionName: this.currentJunction.name,
        chosenSegment: segmentData.segment.id,
        availableSegments: this.availableSegments.map(s => s.segment.id)
      });
    }

    // Start segment tracking
    if (this.tripId) {
      await segmentTracker.startSegment(segmentData, this.tripId);
    }

    // Call callback if set
    if (this.onSegmentSelected) {
      this.onSegmentSelected(segmentData);
    }

    // Hide modal
    this.hide();
  }

  /**
   * Handle skip button
   */
  handleSkip() {
    console.log('⏭️ Route selection skipped');
    this.hide();
  }

  /**
   * Set segment selection callback
   * @param {Function} callback - Callback function
   */
  setOnSegmentSelected(callback) {
    this.onSegmentSelected = callback;
  }

  /**
   * Set completed segments
   * @param {Array<string>} segments - Array of completed segment IDs
   */
  setCompletedSegments(segments) {
    this.completedSegments = segments || [];
  }

  /**
   * Set current trip ID
   * @param {string} tripId - Trip ID
   */
  setTripId(tripId) {
    this.tripId = tripId;
  }

  /**
   * Reset selector state
   */
  reset() {
    this.hide();
    this.completedSegments = [];
    this.onSegmentSelected = null;
    this.tripId = null;
    console.log('🔄 Route selector reset');
  }
}

// Export singleton instance
export const routeSelector = new RouteSelector();
