# KICKSENSE ANALYTICS - Installation & Setup Guide

## Quick Start

### Prerequisites
- Node.js 16 or higher
- npm or yarn package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation Steps

1. **Navigate to project directory**
```bash
cd kicksense-analytics
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Open in browser**
The app will automatically open at `http://localhost:5173`

---

## Project Structure

### Entry Points
- `index.html` - HTML template
- `src/main.jsx` - React entry point
- `src/App.jsx` - Main application component
- `vite.config.js` - Vite configuration

### Key Directories

#### /src/pages
- `Login.jsx` - Authentication login page
- `SignUp.jsx` - User registration page
- `Dashboard.jsx` - Main dashboard layout

#### /src/components
- `Sidebar.jsx` - Navigation sidebar with 11 modules
- `modules/` - 11 analytics modules:
  - `TeamOverview.jsx`
  - `PlayerStats.jsx`
  - `UploadVideo.jsx`
  - `TeamCohesionIndex.jsx`
  - `IdealFormation.jsx`
  - `IdealSubstitution.jsx`
  - `FoulCardRisk.jsx`
  - `PlayerSpeedAnalytics.jsx`
  - `PassingNetworks.jsx`
  - `Heatmaps.jsx`
  - `VisualPrompt.jsx`

#### /src/styles
- `global.css` - Global styles and glassmorphic classes
- `auth.css` - Authentication pages styling
- `sidebar.css` - Sidebar component styling
- `dashboard.css` - Dashboard layout styling
- `modules.css` - Analytics modules styling

#### /public
- `football-stadium.jpg` - Stadium image
- `football-player.jpg` - Player action image
- `football-formation.jpg` - Formation diagram

---

## Available Scripts

### Development
```bash
npm run dev
```
Runs the app in development mode with hot module reloading.

### Build
```bash
npm run build
```
Creates a production build in the `dist` directory.

### Preview
```bash
npm run preview
```
Preview the production build locally before deployment.

---

## Configuration

### Vite Configuration
Edit `vite.config.js` to customize:
- Port number
- Build output directory
- Environment variables
- Plugin settings

### Package Dependencies
Key packages in `package.json`:
- `react` - UI library
- `react-dom` - React DOM renderer
- `react-router-dom` - Client-side routing
- `recharts` - Chart library
- `lucide-react` - Icon library

---

## Authentication

### Login Credentials (Demo)
- **Email**: Any valid email format (e.g., demo@example.com)
- **Password**: Any string with 6+ characters
- **Session**: Stored in localStorage as `kicksense-auth`

### Session Management
- Automatic login state persistence
- Protected dashboard routes
- Logout clears authentication state
- Redirect to login for unauthenticated access

---

## Customization Guide

### Changing Colors

Edit `/src/styles/global.css` color variables:
```css
:root {
  --primary: #1a4d2e;           /* Dark green */
  --primary-light: #2d7a4f;     /* Light green */
  --accent: #ff6b35;             /* Orange */
  --white: #ffffff;
  --gray-50: #f9fafb;            /* Light gray */
  --gray-900: #111827;           /* Dark gray */
}
```

### Adding New Modules

1. Create new file in `/src/components/modules/NewModule.jsx`
2. Add to Dashboard routes in `/src/pages/Dashboard.jsx`
3. Add menu item in `/src/components/Sidebar.jsx`
4. Import icon from lucide-react

Example:
```javascript
// src/components/modules/NewModule.jsx
export default function NewModule() {
  return (
    <div className="module-container">
      <div className="page-header">
        <h1>Module Title</h1>
        <p>Module description</p>
      </div>
      {/* Module content */}
    </div>
  )
}
```

### Modifying Sidebar

Edit `/src/components/Sidebar.jsx`:
```javascript
const menuItems = [
  { id: 1, label: 'Module Name', path: '/module-path', icon: IconName },
  // Add more items...
]
```

---

## Deployment

### Vercel Deployment
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Vercel automatically builds and deploys
4. Set environment variables if needed

### Manual Deployment
1. Build the project: `npm run build`
2. Upload `dist` folder to hosting provider
3. Configure server for SPA routing
4. Point domain to deployment

### Netlify Deployment
1. Connect GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy

---

## Troubleshooting

### Port Already in Use
```bash
# Use different port
npm run dev -- --port 3000
```

### Module Import Errors
- Ensure all imports have correct file paths
- Check that components are exported correctly
- Verify CSS files are imported in components

### Styling Issues
- Clear browser cache (Ctrl+Shift+Delete)
- Hard reload (Ctrl+Shift+R)
- Check if CSS files are linked properly

### Routing Issues
- Verify routes match path in Sidebar
- Check Dashboard.jsx has Route for new module
- Ensure BrowserRouter wraps all routes

### Performance Issues
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist`
- Check browser DevTools Performance tab

---

## Browser Support

| Browser | Support | Version |
|---------|---------|---------|
| Chrome  | ✅ Full | Latest  |
| Firefox | ✅ Full | Latest  |
| Safari  | ✅ Full | Latest  |
| Edge    | ✅ Full | Latest  |
| IE 11   | ❌ No   | -       |

---

## Performance Tips

1. **Optimize Images**
   - Use compressed images
   - Consider WebP format
   - Use responsive image sizes

2. **Code Splitting**
   - Implement lazy loading for modules
   - Use React.lazy() for code splitting

3. **Caching**
   - Enable browser caching headers
   - Use service workers for offline support

4. **Bundle Size**
   - Analyze with `npm run build -- --analyze`
   - Tree-shake unused code
   - Use production build

---

## Development Workflow

### Best Practices
1. Create feature branches for new modules
2. Test on multiple devices and browsers
3. Keep styles organized in separate files
4. Use consistent naming conventions
5. Document complex components

### Code Style
- 2-space indentation
- Semicolons at end of statements
- Single quotes for strings
- CamelCase for components
- kebab-case for CSS classes

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/module-name

# Make changes and commit
git add .
git commit -m "Add new module: [name]"

# Push to remote
git push origin feature/module-name

# Create Pull Request
# Review, merge to main
```

---

## Environment Variables

Create `.env` file in project root (optional):
```
VITE_API_URL=http://localhost:3000
VITE_ENV=development
```

Access in code:
```javascript
const apiUrl = import.meta.env.VITE_API_URL
```

---

## Building for Production

### Pre-deployment Checklist
- [ ] All modules functional
- [ ] Responsive design tested
- [ ] Authentication working
- [ ] No console errors
- [ ] Images optimized
- [ ] SEO meta tags added
- [ ] Performance tested
- [ ] Accessibility checked

### Production Build
```bash
npm run build
```

Output: `dist/` folder ready for deployment

---

## Support & Resources

### Documentation
- README.md - Project overview
- FEATURES.md - Complete feature list
- This file (INSTALLATION.md) - Setup guide

### External Resources
- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [React Router Docs](https://reactrouter.com)
- [Recharts Documentation](https://recharts.org)
- [Lucide React Icons](https://lucide.dev)

### Common Commands Reference
```bash
npm run dev           # Start development
npm run build         # Build for production
npm run preview       # Preview production build
npm install           # Install dependencies
npm update            # Update packages
npm list              # List installed packages
```

---

## License & Terms

MIT License - Free for personal and commercial use

---

**KICKSENSE ANALYTICS v1.0**
**Professional Football Analysis Dashboard**
**Last Updated: January 2024**
