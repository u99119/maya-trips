# Mayank Family Trips

A reusable Progressive Web App (PWA) for family travel navigation with offline support, GPS tracking, and route management.

## Features

### Phase 1: Vaishno Devi Route Mapping ✅

- 📍 **GPS Tracking** - Real-time location tracking with battery saver mode
- 🗺️ **Interactive Map** - Leaflet + OpenStreetMap with offline tile caching
- 📌 **Milestone Markers** - Track progress through 8 key checkpoints
- 🛤️ **Multiple Route Layers** - Main trek, shortcuts, battery car route, Bhairon temple route
- 💾 **Offline Support** - Full PWA with service worker and data caching
- 📱 **Mobile-First Design** - Optimized for Android (iOS support coming)
- 🔋 **Battery Efficient** - Configurable GPS accuracy and update frequency
- 💡 **Auto-Center** - Optional auto-centering on user location
- 📊 **Progress Tracking** - Visual progress bar and milestone completion

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES Modules)
- **Map**: Leaflet.js + OpenStreetMap
- **PWA**: Vite PWA Plugin with Workbox
- **Storage**: LocalStorage + IndexedDB
- **Build**: Vite
- **Hosting**: Netlify

## Project Structure

```
/
├── public/
│   ├── css/
│   │   └── app.css              # Main styles
│   ├── js/
│   │   ├── app.js               # Main application logic
│   │   ├── map.js               # Map management
│   │   ├── gps.js               # GPS tracking
│   │   ├── layers.js            # Route layers management
│   │   └── storage.js           # Data persistence
│   ├── routes/
│   │   └── vaishno-devi/
│   │       ├── config.json      # Route configuration
│   │       ├── route.geojson    # Route paths
│   │       └── milestones.geojson # Milestone markers
│   └── icons/                   # PWA icons
├── index.html                   # Main HTML
├── vite.config.js              # Vite configuration
├── netlify.toml                # Netlify deployment config
└── package.json                # Dependencies

```

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development

The app will be available at `http://localhost:5173`

## Deployment

### Cloudflare Pages (Recommended)

**Unlimited bandwidth, no credit limits!**

See [CLOUDFLARE-DEPLOYMENT.md](CLOUDFLARE-DEPLOYMENT.md) for detailed instructions.

**Quick Deploy:**
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login
wrangler login

# Build and deploy
npm run build
wrangler pages deploy dist --project-name=maya-trips
```

**Important:** Disable auto-deployments in Cloudflare dashboard to avoid unnecessary builds.

### Netlify (Alternative)

1. Connect your repository to Netlify
2. Build settings are configured in `netlify.toml`
3. **Disable auto-deploy** to avoid credit limits
4. Deploy manually when ready

```bash
npm install -g netlify-cli
netlify deploy --prod
```

## Route Configuration

### Adding a New Route

1. Create a new folder in `public/routes/[route-name]/`
2. Add three files:
   - `config.json` - Route metadata and settings
   - `route.geojson` - Route paths (LineString features)
   - `milestones.geojson` - Milestone points (Point features)

3. Update `app.js` to load your route:
```javascript
await this.loadRoute('your-route-name');
```

### GeoJSON Format

**Route (LineString)**:
```json
{
  "type": "Feature",
  "properties": {
    "id": "route-id",
    "name": "Route Name",
    "difficulty": "moderate",
    "distance": 10.5
  },
  "geometry": {
    "type": "LineString",
    "coordinates": [[lng, lat], [lng, lat], ...]
  }
}
```

**Milestone (Point)**:
```json
{
  "type": "Feature",
  "properties": {
    "id": 1,
    "name": "Checkpoint Name",
    "elevation": 1000,
    "type": "checkpoint"
  },
  "geometry": {
    "type": "Point",
    "coordinates": [lng, lat]
  }
}
```

## Documentation

- **[Quick Start Guide](docs/QUICKSTART.md)** - Get started in 3 steps
- **[Development Guide](docs/DEVELOPMENT.md)** - Detailed development documentation
- **[Git Workflow Guide](docs/GIT-WORKFLOW.md)** - Branch strategy and deployment workflow
- **[TODO & Future Plans](docs/TODO.md)** - Roadmap and unanswered questions
- **[Vaishno Devi Info](docs/VAISHNO.DEVI.YATRA.Info.md)** - Complete route information

## Features Roadmap

See [docs/TODO.md](docs/TODO.md) for detailed roadmap.

### Phase 2 (Planned)
- Photo capture and storage
- Enhanced notes with rich text
- Multi-route selector
- Route statistics and analytics

### Phase 3 (Planned)
- GPX import/export
- Elevation profile graph
- Weather integration
- Emergency offline instructions

### Phase 4 (Future)
- Route editing capability
- Custom route creation
- Family shared progress (optional backend)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (Android Chrome, iOS Safari)

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

## Acknowledgments

- OpenStreetMap contributors
- Leaflet.js team
- Shri Mata Vaishno Devi Shrine Board for route information

