# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate Icons (Optional for Development)

Open `scripts/generate-icons.html` in your browser and download the generated icons to `public/icons/`

Or skip this step - the app will work without icons (just won't be installable as PWA yet).

### 3. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 📱 Testing on Mobile

### Option 1: Deploy to Netlify (Recommended)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

You'll get a URL like `https://your-app.netlify.app` that you can open on your phone.

### Option 2: Local Network Testing

1. Start dev server: `npm run dev`
2. Find your local IP: `ifconfig` (Mac/Linux) or `ipconfig` (Windows)
3. Open `http://YOUR_IP:5173` on your phone (must be on same WiFi)

---

## 🗺️ Using the App

### First Time Setup

1. **Allow Location Access** - Click "Allow" when prompted for GPS permissions
2. **Enable GPS Tracking** - Toggle the GPS switch in the bottom drawer
3. **View Route Layers** - Toggle different route options (Main Trek, Shortcuts, etc.)
4. **Track Progress** - Milestones auto-mark when you're within 30 meters

### Features

- **📍 GPS Tracking** - Real-time location with accuracy indicator
- **🔋 Battery Saver** - Reduces GPS accuracy to save battery
- **🎯 Auto Center** - Keeps map centered on your location
- **📊 Progress Bar** - Visual progress through milestones
- **💾 Offline Mode** - Works without internet after first load
- **🗺️ Multiple Routes** - Toggle between different path options

### Controls

- **GPS Toggle** - Enable/disable location tracking
- **Battery Saver** - Reduce GPS accuracy for longer battery life
- **Auto Center** - Auto-center map on your position
- **Recenter Button** - Manually recenter map (blue button on right)
- **Layer Toggles** - Show/hide different route layers
- **Milestone List** - Click to jump to specific checkpoints

---

## 🏔️ Vaishno Devi Route

### Milestones (8 Total)

1. **Katra** (875m) - Base camp, starting point
2. **Banganga** (1050m) - 1.5km - Holy river, first checkpoint
3. **Charan Paduka** (1250m) - 3km - Sacred footprints viewpoint
4. **Ardhkuwari** (1450m) - 6km - Halfway point, cave temple
5. **Himkoti** (1650m) - 9km - Scenic mountain views
6. **Sanjichhat** (1850m) - 11.5km - Highest point, helicopter service
7. **Bhawan** (1585m) - 13.5km - Main shrine, holy cave
8. **Bhairon Temple** (1950m) - 16km - Optional trek, ropeway available

### Route Options

- **Main Trek** (Blue) - Traditional 13.5km walking route
- **Shortcut** (Orange) - Steeper 11km route
- **Battery Car** (Green) - Motorable route to Sanjichhat
- **Bhairon Route** (Purple) - 2.5km from Bhawan to Bhairon Temple

---

## 🛠️ Development

### Project Structure

```
public/
├── css/app.css              # Styles
├── js/
│   ├── app.js              # Main app
│   ├── map.js              # Map management
│   ├── gps.js              # GPS tracking
│   ├── layers.js           # Route layers
│   └── storage.js          # Data storage
└── routes/vaishno-devi/
    ├── config.json         # Route config
    ├── route.geojson       # Route paths
    └── milestones.geojson  # Checkpoints
```

### Adding Your Own Route

See `DEVELOPMENT.md` for detailed instructions.

Quick version:

1. Create folder: `public/routes/your-route/`
2. Add `config.json`, `route.geojson`, `milestones.geojson`
3. Update `app.js` line 35: `await this.loadRoute('your-route');`

---

## 📦 Build & Deploy

### Build for Production

```bash
npm run build
```

Output in `dist/` folder.

### Deploy to Netlify

**Automatic (Recommended):**

1. Push to GitHub
2. Connect repo to Netlify
3. Auto-deploys on every push

**Manual:**

```bash
netlify deploy --prod
```

---

## 🐛 Troubleshooting

### GPS Not Working

- ✅ Ensure HTTPS (required for geolocation)
- ✅ Check browser permissions
- ✅ Test on actual device (desktop GPS is limited)

### Map Tiles Not Loading

- ✅ Check internet connection (first load requires internet)
- ✅ Check browser console for errors
- ✅ Tiles are cached after first load for offline use

### App Not Installing as PWA

- ✅ Generate icons using `scripts/generate-icons.html`
- ✅ Place icons in `public/icons/`
- ✅ Rebuild: `npm run build`
- ✅ Must be served over HTTPS

### Build Errors

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📚 Documentation

- **README.md** - Project overview and features
- **DEVELOPMENT.md** - Detailed development guide
- **QUICKSTART.md** - This file

---

## 🎯 Next Steps

### Phase 2 Features (Coming Soon)

- [ ] Photo capture at milestones
- [ ] Rich text notes
- [ ] Multi-route selector
- [ ] Route statistics

### Phase 3 Features (Planned)

- [ ] GPX import/export
- [ ] Elevation profile
- [ ] Weather integration
- [ ] Emergency instructions

---

## 💡 Tips

1. **First Load**: Requires internet to download map tiles
2. **Offline Use**: After first load, works completely offline
3. **Battery Life**: Use battery saver mode for longer treks
4. **Accuracy**: GPS accuracy varies (typically 5-30 meters)
5. **Data Usage**: Tiles are cached, minimal data after first load

---

## 🆘 Support

- **Issues**: Open an issue on GitHub
- **Questions**: Check DEVELOPMENT.md
- **Contributions**: PRs welcome!

---

**Happy Trekking! 🏔️**

