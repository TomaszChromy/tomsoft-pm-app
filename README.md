# TomSoft PM App - Cyberpunk Edition

> **Technology with soul** - Professional Project Management Application with Cyberpunk Aesthetics

A modern, full-stack project management application built with Next.js and cyberpunk design inspired by your mockup. Features dark theme, neon colors, animated background lines, and futuristic UI elements.

## 🌟 Features

- **🎨 Cyberpunk Design** - Dark theme with neon colors and animated elements
- **📊 Dashboard** - Real-time project metrics and KPIs
- **📁 Project Management** - Complete project lifecycle tracking
- **✅ Task Management** - Kanban board with drag & drop
- **👥 Team Management** - User roles and permissions
- **🔐 Authentication** - Secure login system
- **📱 Responsive Design** - Works on all devices
- **⚡ Animated UI** - Smooth transitions and effects

## 🎨 Design Features

### Cyberpunk Aesthetics
- **Dark Background**: Deep space-like dark theme (#0a0a0f)
- **Neon Colors**: Cyan (#00ffff), Magenta (#ff00ff), Orange (#ff6b35)
- **Animated Lines**: Flowing background lines across the screen
- **Glitch Effects**: Subtle glitch animations on hover
- **Tech Grid**: Subtle grid pattern background
- **Neon Glows**: Text and border glow effects

### Typography
- **Orbitron**: Futuristic headings and accents
- **Rajdhani**: Clean, tech-inspired body text
- **Tahoma**: Fallback for maximum compatibility

### Layout
- **Golden Ratio**: 62/38 layout proportions
- **Fibonacci Spacing**: Mathematical spacing system
- **Card Design**: Glassmorphism-inspired cards
- **Sidebar Navigation**: Fixed sidebar with smooth animations

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm 8+

### Installation

1. **Clone and setup**
   ```bash
   cd tomsoft-pm-app
   pnpm install
   ```

2. **Start development server**
   ```bash
   pnpm dev
   ```

3. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🔧 Development

### Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Quality
pnpm lint             # Lint code
pnpm type-check       # TypeScript checking
```

### Project Structure

```
tomsoft-pm-app/
├── apps/
│   └── web/                 # Next.js frontend
│       ├── src/
│       │   ├── app/         # App router pages
│       │   ├── components/  # React components
│       │   └── lib/         # Utilities
│       ├── tailwind.config.js
│       └── package.json
├── packages/
│   ├── ui/                  # Shared UI components
│   └── db/                  # Database schema
└── package.json
```

## 🎨 Customization

### Colors

The cyberpunk color palette is defined in `tailwind.config.js`:

```javascript
colors: {
  neon: {
    cyan: '#00ffff',
    magenta: '#ff00ff',
    orange: '#ff6b35',
    blue: '#0080ff',
    purple: '#8b5cf6',
    green: '#39ff14',
  },
  dark: {
    bg: '#0a0a0f',
    darker: '#050508',
    card: '#111827',
    border: '#374151',
  },
}
```

### Animations

Custom animations are defined in CSS:

- `lineFlow`: Animated background lines
- `neonPulse`: Pulsing neon text effect
- `glitch`: Glitch effect on hover
- `pulseGlow`: Glowing box shadows

### Components

Key cyberpunk components:

- `.btn-primary`: Neon cyan primary button
- `.btn-secondary`: Outlined neon button
- `.card-cyber`: Glassmorphism card with neon border
- `.input-cyber`: Dark input with neon focus
- `.text-gradient`: Gradient text effect
- `.neon-glow`: Text glow effect

## 📱 Responsive Design

The application is fully responsive with:

- **Mobile**: Collapsible sidebar, touch-friendly controls
- **Tablet**: Optimized layout for medium screens
- **Desktop**: Full sidebar navigation, multi-column layouts

## 🔮 Future Enhancements

- **Backend Integration**: NestJS API with PostgreSQL
- **Real-time Updates**: WebSocket connections
- **Advanced Animations**: More complex particle effects
- **3D Elements**: Three.js integration for 3D UI elements
- **Sound Effects**: Cyberpunk-themed UI sounds
- **Theme Customization**: Multiple cyberpunk color schemes

## 🎯 Demo Features

Current demo includes:

- **Dashboard**: Stats cards with animated counters
- **Project Cards**: Progress bars with gradient fills
- **Activity Feed**: Real-time activity simulation
- **Sidebar Navigation**: Smooth hover animations
- **Responsive Design**: Mobile-friendly interface

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Fonts**: Google Fonts (Orbitron, Rajdhani)
- **Build Tool**: Turbo (monorepo)
- **Package Manager**: pnpm

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **TomSoft Team** - For the vision and cyberpunk design inspiration
- **Cyberpunk 2077** - Visual inspiration for the UI design
- **Blade Runner** - Aesthetic influence for the dark theme

---

**Built with ❤️ by TomSoft - Technology with soul**

For support, email us at support@tomsoft.pl
