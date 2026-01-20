# KICKSENSE ANALYTICS - Football Analysis Dashboard

A professional, modern football (soccer) analytics dashboard built with React. Features AI-powered analysis modules, real-time team statistics, and glassmorphic UI design.

## Features

### 11 Analytics Modules

1. **Team Overview** - Real-time team performance statistics and recent matches
2. **Upload Video** - Upload and analyze match/training videos
3. **Player Stats** - Individual player performance metrics
4. **Team Cohesion Index** - Measure of team coordination and synchronization
5. **Ideal Formation** - AI-recommended optimal formation analysis
6. **Ideal Substitution** - Smart substitution recommendations
7. **Foul Card Risk** - Player discipline analysis and suspension risk
8. **Player Speed Analytics** - Maximum speed, velocity, and sprint analysis
9. **Passing Networks** - Analyze player connections and passing patterns
10. **Heatmaps** - Field activity and tactical visualization
11. **Visual Prompt** - AI analytics through natural language queries

### Authentication

- Login and Sign Up pages with validation
- Simulated authentication for demo purposes
- Protected dashboard routes

## Design Features

- **Glassmorphic UI** - Modern frosted glass effect containers with blur
- **Color Scheme** - Professional white, dark green (#1a4d2e), and orange (#ff6b35)
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Modern Typography** - Clean, legible fonts with proper hierarchy
- **Smooth Animations** - Fade-in, slide-in, and interactive transitions

## Technology Stack

- **Frontend**: React 18
- **Routing**: React Router DOM
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Styling**: Custom CSS with glassmorphism effects

## Getting Started

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

### Development

Run the development server:
```bash
npm run dev
```

The app will open at `http://localhost:5173`

### Build

Build for production:
```bash
npm run build
```

### Preview

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── Sidebar.jsx
│   └── modules/
│       ├── TeamOverview.jsx
│       ├── PlayerStats.jsx
│       ├── UploadVideo.jsx
│       ├── TeamCohesionIndex.jsx
│       ├── IdealFormation.jsx
│       ├── IdealSubstitution.jsx
│       ├── FoulCardRisk.jsx
│       ├── PlayerSpeedAnalytics.jsx
│       ├── PassingNetworks.jsx
│       ├── Heatmaps.jsx
│       └── VisualPrompt.jsx
├── pages/
│   ├── Login.jsx
│   ├── SignUp.jsx
│   └── Dashboard.jsx
├── styles/
│   ├── global.css
│   ├── auth.css
│   ├── sidebar.css
│   ├── dashboard.css
│   └── modules.css
├── App.jsx
└── main.jsx
```

## Color Palette

- **Primary Green**: #1a4d2e (Dark forest green)
- **Primary Light**: #2d7a4f (Lighter green)
- **Accent Orange**: #ff6b35 (Vibrant orange)
- **Neutral White**: #ffffff
- **Neutral Gray**: Various shades from #f9fafb to #111827

## Key Features

### Authentication Flow
- Login/Signup pages with form validation
- Session persistence using localStorage
- Protected dashboard routes

### Dashboard Layout
- Fixed sidebar with collapsible navigation
- Responsive mobile navigation
- 11 distinct analytical modules
- Smooth page transitions

### Glassmorphic Design
- Backdrop blur effects on all containers
- Semi-transparent backgrounds
- Inset shadows for depth
- Smooth hover animations

### Data Visualization
- Statistics cards with real-time data
- Table components for match data
- Bar charts for speed metrics
- Pie charts for team cohesion
- Interactive heatmaps for field analysis

## Demo Credentials

- Email: demo@kicksense.com
- Password: any (form validates email format only)

## Customization

### Colors
Modify color variables in `/src/styles/global.css`:
```css
:root {
  --primary: #1a4d2e;
  --accent: #ff6b35;
  /* ... */
}
```

### Modules
Each module is a separate component in `/src/components/modules/`. Create new modules by following the existing component structure.

### Sidebar
Edit menu items in `/src/components/Sidebar.jsx`:
```javascript
const menuItems = [
  { id: 1, label: 'Team Overview', path: '/team-overview', icon: Home },
  // ... add more items
]
```

## Performance Optimizations

- Component-based architecture for code splitting
- CSS optimization with minification
- Smooth animations with CSS transitions
- Efficient rendering with React hooks

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License - Feel free to use for commercial and personal projects.

## Support

For issues or questions, please refer to the component documentation or check the module implementations for usage examples.

---

Built with ⚽ for Football Analytics
