/**
 * Drawer Module
 * Handles draggable bottom drawer for resizing map view
 */

class DrawerManager {
  constructor() {
    this.drawer = null;
    this.handle = null;
    this.isDragging = false;
    this.startY = 0;
    this.startHeight = 0;
    this.minHeight = 200; // Minimum drawer height
    this.maxHeight = window.innerHeight * 0.8; // Maximum 80% of screen
  }

  /**
   * Initialize drawer with drag functionality
   */
  init() {
    this.drawer = document.getElementById('bottomDrawer');
    this.handle = this.drawer?.querySelector('.drawer-handle');

    if (!this.drawer || !this.handle) {
      console.warn('Drawer or handle not found');
      return;
    }

    // Get initial height from CSS variable
    const computedStyle = getComputedStyle(document.documentElement);
    const drawerHeight = computedStyle.getPropertyValue('--drawer-height');
    this.startHeight = parseInt(drawerHeight) || 400;

    this.setupDragListeners();
    console.log('✅ Drawer initialized with drag support');
  }

  /**
   * Setup drag event listeners
   */
  setupDragListeners() {
    // Mouse events
    this.handle.addEventListener('mousedown', (e) => this.startDrag(e));
    document.addEventListener('mousemove', (e) => this.drag(e));
    document.addEventListener('mouseup', () => this.endDrag());

    // Touch events for mobile
    this.handle.addEventListener('touchstart', (e) => this.startDrag(e), { passive: false });
    document.addEventListener('touchmove', (e) => this.drag(e), { passive: false });
    document.addEventListener('touchend', () => this.endDrag());
  }

  /**
   * Start dragging
   */
  startDrag(e) {
    this.isDragging = true;
    this.startY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    this.startHeight = this.drawer.offsetHeight;
    
    this.handle.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none'; // Prevent text selection while dragging
    
    e.preventDefault();
  }

  /**
   * Handle drag movement
   */
  drag(e) {
    if (!this.isDragging) return;

    const currentY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    const deltaY = this.startY - currentY; // Positive = dragging up, negative = dragging down

    let newHeight = this.startHeight + deltaY;

    // Clamp height between min and max
    newHeight = Math.max(this.minHeight, Math.min(this.maxHeight, newHeight));

    // Update drawer height
    this.drawer.style.height = `${newHeight}px`;
    document.documentElement.style.setProperty('--drawer-height', `${newHeight}px`);

    // Update Leaflet controls position
    this.updateLeafletControlsPosition(newHeight);

    e.preventDefault();
  }

  /**
   * End dragging
   */
  endDrag() {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.handle.style.cursor = 'grab';
    document.body.style.userSelect = '';

    // Save the new height
    const finalHeight = this.drawer.offsetHeight;
    localStorage.setItem('drawerHeight', finalHeight);

    // Ensure controls are positioned correctly
    this.updateLeafletControlsPosition(finalHeight);

    console.log(`Drawer resized to ${finalHeight}px`);
  }

  /**
   * Restore saved drawer height
   */
  restoreSavedHeight() {
    const savedHeight = localStorage.getItem('drawerHeight');
    if (savedHeight) {
      const height = parseInt(savedHeight);
      if (height >= this.minHeight && height <= this.maxHeight) {
        this.drawer.style.height = `${height}px`;
        document.documentElement.style.setProperty('--drawer-height', `${height}px`);
        this.updateLeafletControlsPosition(height);
        console.log(`Restored drawer height: ${height}px`);
      }
    }
  }

  /**
   * Set drawer height programmatically
   */
  setHeight(height) {
    const clampedHeight = Math.max(this.minHeight, Math.min(this.maxHeight, height));
    this.drawer.style.height = `${clampedHeight}px`;
    document.documentElement.style.setProperty('--drawer-height', `${clampedHeight}px`);
    this.updateLeafletControlsPosition(clampedHeight);
  }

  /**
   * Collapse drawer to minimum height
   */
  collapse() {
    this.setHeight(this.minHeight);
  }

  /**
   * Expand drawer to default height
   */
  expand() {
    this.setHeight(400);
  }

  /**
   * Toggle between collapsed and expanded
   */
  toggle() {
    const currentHeight = this.drawer.offsetHeight;
    if (currentHeight <= this.minHeight + 50) {
      this.expand();
    } else {
      this.collapse();
    }
  }

  /**
   * Update Leaflet controls position when drawer height changes
   */
  updateLeafletControlsPosition(drawerHeight) {
    const leafletBottomRight = document.querySelector('.leaflet-bottom.leaflet-right');
    if (leafletBottomRight) {
      leafletBottomRight.style.bottom = `${drawerHeight + 10}px`;
    }
  }
}

// Export singleton instance
export default new DrawerManager();

