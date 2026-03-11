/**
 * Trip Import UI Module
 * Handles importing user-generated trip JSON
 */

import { tripValidator } from './trip-validator.js';
import storage from './storage.js';

class TripImportUI {
  constructor() {
    this.currentJSON = null;
    this.validationResult = null;
    this.currentTab = 'paste';
  }

  /**
   * Initialize the import UI
   */
  init() {
    this.initEventListeners();
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    // Import button
    const btnImportTrip = document.getElementById('btnImportTrip');
    btnImportTrip?.addEventListener('click', () => this.showImportModal());

    // Modal close
    const importModalClose = document.getElementById('importModalClose');
    const btnCancelImport = document.getElementById('btnCancelImport');
    const importModalOverlay = document.getElementById('importModalOverlay');

    importModalClose?.addEventListener('click', () => this.hideImportModal());
    btnCancelImport?.addEventListener('click', () => this.hideImportModal());
    importModalOverlay?.addEventListener('click', () => this.hideImportModal());

    // Tab switching
    const tabPasteJSON = document.getElementById('tabPasteJSON');
    const tabUploadFile = document.getElementById('tabUploadFile');

    tabPasteJSON?.addEventListener('click', () => this.switchTab('paste'));
    tabUploadFile?.addEventListener('click', () => this.switchTab('upload'));

    // File upload
    const fileUploadArea = document.getElementById('fileUploadArea');
    const jsonFileInput = document.getElementById('jsonFileInput');
    const btnRemoveFile = document.getElementById('btnRemoveFile');

    fileUploadArea?.addEventListener('click', () => jsonFileInput?.click());
    jsonFileInput?.addEventListener('change', (e) => this.handleFileSelect(e));
    btnRemoveFile?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.clearFile();
    });

    // Drag and drop
    fileUploadArea?.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileUploadArea.style.borderColor = 'var(--primary)';
    });

    fileUploadArea?.addEventListener('dragleave', (e) => {
      e.preventDefault();
      fileUploadArea.style.borderColor = 'var(--border-color)';
    });

    fileUploadArea?.addEventListener('drop', (e) => {
      e.preventDefault();
      fileUploadArea.style.borderColor = 'var(--border-color)';
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFile(files[0]);
      }
    });

    // Validate button
    const btnValidateTrip = document.getElementById('btnValidateTrip');
    btnValidateTrip?.addEventListener('click', () => this.validateTrip());

    // Import button
    const btnConfirmImport = document.getElementById('btnConfirmImport');
    btnConfirmImport?.addEventListener('click', () => this.importTrip());
  }

  /**
   * Show import modal
   */
  showImportModal() {
    document.getElementById('importTripModal').style.display = 'flex';
    this.resetModal();
  }

  /**
   * Hide import modal
   */
  hideImportModal() {
    document.getElementById('importTripModal').style.display = 'none';
    this.resetModal();
  }

  /**
   * Reset modal to initial state
   */
  resetModal() {
    this.currentJSON = null;
    this.validationResult = null;
    this.currentTab = 'paste';

    document.getElementById('jsonTextarea').value = '';
    document.getElementById('importTripNameInput').value = '';
    document.getElementById('validationResults').style.display = 'none';
    document.getElementById('tripNameGroup').style.display = 'none';
    document.getElementById('btnValidateTrip').style.display = 'inline-block';
    document.getElementById('btnConfirmImport').style.display = 'none';

    this.clearFile();
    this.switchTab('paste');
  }

  /**
   * Switch between tabs
   */
  switchTab(tab) {
    this.currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.import-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Update tab content
    document.getElementById('pasteJSONContent').style.display = tab === 'paste' ? 'block' : 'none';
    document.getElementById('uploadFileContent').style.display = tab === 'upload' ? 'block' : 'none';

    // Clear validation when switching tabs
    document.getElementById('validationResults').style.display = 'none';
    this.validationResult = null;
  }

  /**
   * Handle file selection
   */
  handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  /**
   * Handle file upload
   */
  async handleFile(file) {
    if (!file.name.endsWith('.json')) {
      this.showError('Please select a JSON file');
      return;
    }

    try {
      const text = await file.text();
      this.currentJSON = JSON.parse(text);

      // Show file selected
      document.getElementById('selectedFileName').textContent = file.name;
      document.querySelector('.file-upload-placeholder').style.display = 'none';
      document.getElementById('fileUploadSelected').style.display = 'flex';
    } catch (error) {
      this.showError('Invalid JSON file: ' + error.message);
    }
  }

  /**
   * Clear file selection
   */
  clearFile() {
    document.getElementById('jsonFileInput').value = '';
    document.querySelector('.file-upload-placeholder').style.display = 'block';
    document.getElementById('fileUploadSelected').style.display = 'none';
    this.currentJSON = null;
  }

  /**
   * Validate the trip JSON
   */
  validateTrip() {
    // Get JSON from current tab
    let jsonText = '';
    if (this.currentTab === 'paste') {
      jsonText = document.getElementById('jsonTextarea').value.trim();
      if (!jsonText) {
        this.showError('Please paste JSON content');
        return;
      }
    } else {
      if (!this.currentJSON) {
        this.showError('Please select a JSON file');
        return;
      }
      jsonText = JSON.stringify(this.currentJSON);
    }

    // Parse JSON
    try {
      this.currentJSON = JSON.parse(jsonText);
    } catch (error) {
      this.showValidationError('Invalid JSON format: ' + error.message);
      return;
    }

    // Validate using TripValidator
    this.validationResult = tripValidator.validate(this.currentJSON);

    // Display results
    this.displayValidationResults();
  }

  /**
   * Display validation results
   */
  displayValidationResults() {
    const resultsDiv = document.getElementById('validationResults');
    const contentDiv = document.getElementById('validationContent');
    const titleEl = document.getElementById('validationTitle');
    const iconEl = document.getElementById('validationIcon');

    resultsDiv.style.display = 'block';

    if (this.validationResult.valid) {
      // Success
      resultsDiv.className = 'validation-results success';
      titleEl.textContent = 'Validation Passed ✓';
      iconEl.innerHTML = '<polyline points="20 6 9 17 4 12"/>';

      contentDiv.innerHTML = `
        <p>Route is valid and ready to import!</p>
        <div class="validation-trip-info">
          <div class="validation-info-item">
            <span class="validation-info-label">Route Name</span>
            <span class="validation-info-value">${this.currentJSON.name || 'Unnamed'}</span>
          </div>
          <div class="validation-info-item">
            <span class="validation-info-label">Region</span>
            <span class="validation-info-value">${this.currentJSON.region || 'Unknown'}</span>
          </div>
          <div class="validation-info-item">
            <span class="validation-info-label">Junctions</span>
            <span class="validation-info-value">${this.currentJSON.junctions?.length || 0}</span>
          </div>
          <div class="validation-info-item">
            <span class="validation-info-label">Segments</span>
            <span class="validation-info-value">${this.currentJSON.segments?.length || 0}</span>
          </div>
        </div>
        ${this.validationResult.warnings.length > 0 ? `
          <div class="validation-summary">
            <strong>Warnings (${this.validationResult.warnings.length}):</strong>
            <ul class="validation-list">
              ${this.validationResult.warnings.map(w => `<li>${w}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      `;

      // Show import button
      document.getElementById('btnValidateTrip').style.display = 'none';
      document.getElementById('btnConfirmImport').style.display = 'inline-block';
      document.getElementById('tripNameGroup').style.display = 'block';

    } else {
      // Errors
      resultsDiv.className = 'validation-results error';
      titleEl.textContent = 'Validation Failed ✗';
      iconEl.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';

      contentDiv.innerHTML = `
        <p>The route JSON has ${this.validationResult.errors.length} error(s) that must be fixed:</p>
        <ul class="validation-list">
          ${this.validationResult.errors.map(e => `<li>${e}</li>`).join('')}
        </ul>
        ${this.validationResult.warnings.length > 0 ? `
          <div class="validation-summary">
            <strong>Warnings (${this.validationResult.warnings.length}):</strong>
            <ul class="validation-list">
              ${this.validationResult.warnings.map(w => `<li>${w}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      `;

      // Hide import button
      document.getElementById('btnConfirmImport').style.display = 'none';
    }
  }

  /**
   * Import the validated route and optionally create a trip
   */
  async importTrip() {
    if (!this.validationResult || !this.validationResult.valid) {
      this.showError('Please validate the route first');
      return;
    }

    try {
      // Save route config to localStorage
      const routeId = this.currentJSON.id;
      await this.saveRouteConfig(routeId, this.currentJSON);
      console.log('✅ Route imported and saved to localStorage:', routeId);

      // Get custom trip name if provided
      const customName = document.getElementById('importTripNameInput').value.trim();

      // If trip name is provided, create a trip instance
      if (customName) {
        const trip = await storage.createTrip(routeId, customName);
        console.log('✅ Trip created from imported route:', trip);

        // Hide modal
        this.hideImportModal();

        // Load the new trip
        if (window.app && typeof window.app.loadTrip === 'function') {
          await window.app.loadTrip(trip.tripId);
        } else {
          window.location.reload();
        }
      } else {
        // Just import the route without creating a trip
        console.log('✅ Route imported successfully (no trip created)');

        // Hide modal
        this.hideImportModal();

        // Show success message and refresh trip selection
        if (window.app && typeof window.app.showTripSelection === 'function') {
          await window.app.showTripSelection();
          // TODO: Show a toast notification "Route imported successfully!"
        } else {
          window.location.reload();
        }
      }

    } catch (error) {
      console.error('Error importing route:', error);
      this.showError('Failed to import route: ' + error.message);
    }
  }

  /**
   * Save route config to storage
   */
  async saveRouteConfig(routeId, config) {
    // Store in localStorage for now (could be IndexedDB in future)
    const key = `route_config_${routeId}`;
    localStorage.setItem(key, JSON.stringify(config));
    console.log('Route config saved:', routeId);
  }

  /**
   * Show error message
   */
  showError(message) {
    const resultsDiv = document.getElementById('validationResults');
    const contentDiv = document.getElementById('validationContent');
    const titleEl = document.getElementById('validationTitle');

    resultsDiv.style.display = 'block';
    resultsDiv.className = 'validation-results error';
    titleEl.textContent = 'Error';

    contentDiv.innerHTML = `<p>${message}</p>`;
  }

  /**
   * Show validation error
   */
  showValidationError(message) {
    this.showError(message);
  }
}

export const tripImportUI = new TripImportUI();

