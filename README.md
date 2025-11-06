# TomSoft PM - System Zarządzania Projektami

> **Profesjonalny system zarządzania projektami** - Nowoczesna aplikacja webowa stworzona przez Tomasza Chromy

Zaawansowany, pełnofunkcjonalny system zarządzania projektami zbudowany w Next.js 16 z React 18, TypeScript, Prisma i PostgreSQL. Aplikacja oferuje kompletne rozwiązanie dla zespołów programistycznych i firm potrzebujących efektywnego narzędzia do zarządzania projektami, zadaniami i zespołami.

## 📸 Screenshoty

![Dashboard](./screenshots/dashboard.png)
*Główny dashboard z metrykami projektów*

![Projekty](./screenshots/projects.png)
*Zarządzanie projektami*

![Kanban](./screenshots/tasks-kanban.png)
*Tablica Kanban z zadaniami*

## 👨‍💻 Autor

**Tomasz Chromy**
- 📧 Email: tomasz.chromy@outlook.com
- 🐙 GitHub: https://github.com/tomaszchroma
- 💼 LinkedIn: https://linkedin.com/in/tomasz-chromy

**Copyright © 2024 Tomasz Chromy. Wszelkie prawa zastrzeżone.**

## 🌟 Główne Funkcje

### 🔐 Bezpieczeństwo i Autentykacja
- **Bezpieczne logowanie** z hashowaniem haseł (bcrypt 12 rounds)
- **Dwuskładnikowa autentykacja (2FA)** z Google Authenticator
- **Role-based access control** - Admin, PM, Developer, Client
- **JWT tokens** z automatycznym odświeżaniem
- **Rate limiting** - ochrona przed atakami brute force

### 📊 Dashboard i Analityka
- **Interaktywny dashboard** z kluczowymi metrykami w czasie rzeczywistym
- **Wykresy postępu projektów** z wizualizacją danych
- **Statystyki zespołu** i analiza wydajności
- **Raporty** z możliwością eksportu do PDF/Excel
- **Analiza budżetu** i śledzenie kosztów

### 📁 Zarządzanie Projektami
- **Pełny cykl życia projektu** od planowania do zakończenia
- **Statusy projektów** - Planowany, Aktywny, Wstrzymany, Zakończony
- **Zarządzanie zespołami** projektowymi z rolami
- **Śledzenie deadline'ów** i budżetów
- **Historia zmian** i audyt działań

### ✅ Zarządzanie Zadaniami
- **Tablica Kanban** z funkcją drag & drop
- **Priorytety zadań** - Niski, Średni, Wysoki, Krytyczny
- **Przypisywanie zadań** do członków zespołu
- **Komentarze i załączniki** do zadań
- **Śledzenie czasu** pracy z timerem

### 👥 Zarządzanie Zespołem
- **Profile użytkowników** z avatarami i statystykami
- **System uprawnień** na poziomie projektu i systemu
- **Zarządzanie rolami** i dostępem do funkcji
- **Historia aktywności** i logi użytkowników

### 🔔 System Powiadomień
- **Real-time notifications** przez Socket.io
- **Email notifications** dla ważnych wydarzeń
- **Push notifications** (PWA)
- **Konfiguracja preferencji** powiadomień

### 📱 Progressive Web App (PWA)
- **Instalacja na urządzeniach** mobilnych i desktop
- **Offline functionality** - podstawowe funkcje bez internetu
- **Service Worker** dla cache'owania zasobów
- **Responsive design** - pełna funkcjonalność na wszystkich urządzeniach

### 🔗 Integracje
- **Slack** - powiadomienia o projektach i zadaniach
- **GitHub** - synchronizacja z repozytoriami kodu
- **Google Calendar** - integracja z kalendarzem
- **Zapier** - automatyzacja workflow
- **Webhooks** - integracja z zewnętrznymi systemami

## 🛠️ Technologie

### Frontend
- **Next.js 16** - React framework z App Router i Turbopack
- **React 18** - najnowsza wersja z Concurrent Features
- **TypeScript** - statyczne typowanie dla lepszej jakości kodu
- **Tailwind CSS** - utility-first CSS framework
- **React Query v3** - zarządzanie stanem serwera i cache'owanie
- **Socket.io Client** - komunikacja w czasie rzeczywistym
- **Lucide React** - nowoczesne ikony SVG

### Backend
- **Next.js API Routes** - serverless functions
- **Prisma ORM** - type-safe database access layer
- **PostgreSQL** - relacyjna baza danych
- **JWT** - JSON Web Tokens dla autentykacji
- **bcryptjs** - bezpieczne hashowanie haseł
- **Socket.io** - WebSocket server dla real-time
- **Zod** - walidacja schematów danych

### Bezpieczeństwo
- **Input validation** z biblioteką Zod
- **SQL injection protection** dzięki Prisma ORM
- **XSS protection** - sanityzacja danych wejściowych
- **CORS configuration** - kontrola dostępu cross-origin
- **Rate limiting** - ochrona przed spam'em i atakami
- **Security headers** - dodatkowe nagłówki bezpieczeństwa

### Performance i Optymalizacja
- **Code splitting** - ładowanie komponentów na żądanie
- **Image optimization** - automatyczna optymalizacja obrazów
- **Caching strategies** - inteligentne cache'owanie danych
- **Database indexing** - optymalizacja zapytań SQL
- **Lazy loading** - opóźnione ładowanie komponentów

## 📋 Wymagania Systemowe

### Minimalne
- **Node.js**: 18.0+
- **PostgreSQL**: 14.0+
- **RAM**: 2GB
- **Dysk**: 1GB wolnego miejsca
- **Przeglądarka**: Chrome 90+, Firefox 88+, Safari 14+

### Zalecane
- **Node.js**: 20.0+
- **PostgreSQL**: 15.0+
- **RAM**: 4GB+
- **Dysk**: 5GB+ (z logami i cache)
- **Przeglądarka**: Najnowsze wersje

## 🚀 Instalacja

### 1. Sklonuj repozytorium
```bash
git clone https://github.com/tomaszchroma/tomsoft-pm-app.git
cd tomsoft-pm-app
```

### 2. Zainstaluj zależności
```bash
npm install
# lub
yarn install
```

### 3. Skonfiguruj zmienne środowiskowe
```bash
cp .env.example .env.local
```

Wypełnij `.env.local`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/tomsoft_pm"
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3002"
BCRYPT_ROUNDS=12
```

### 4. Skonfiguruj bazę danych
```bash
# Wygeneruj Prisma Client
npx prisma generate

# Zsynchronizuj schemat z bazą danych
npx prisma db push

# Zasilij bazę danymi testowymi
npx prisma db seed
```

### 5. Uruchom aplikację
```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem: **http://localhost:3002**

## 👤 Konta Testowe

Po uruchomieniu `npx prisma db seed` dostępne będą następujące konta:

| Rola | Email | Hasło | Opis |
|------|-------|-------|------|
| 🔴 **Admin** | admin@tomsoft.pl | password123 | Pełne uprawnienia systemu |
| 🟠 **Project Manager** | pm@tomsoft.pl | password123 | Zarządzanie projektami |
| 🟡 **Developer** | dev@tomsoft.pl | password123 | Praca nad zadaniami |
| 🟡 **Developer** | maria@tomsoft.pl | password123 | Drugi developer |
| 🟢 **Client** | client@example.com | password123 | Klient zewnętrzny |

## 📚 Dokumentacja

### Kompletna dokumentacja znajduje się w folderze `/docs`:

- 📖 **[Przegląd aplikacji](./docs/overview.md)** - Szczegółowy opis funkcji
- 🚀 **[Instrukcja obsługi](./docs/user-guide.md)** - Kompletny przewodnik użytkownika
- ⚙️ **[Konfiguracja](./docs/configuration.md)** - Ustawienia i konfiguracja
- 🔧 **[API Documentation](./docs/api-documentation.md)** - Dokumentacja API
- 🆘 **[Rozwiązywanie problemów](./docs/troubleshooting.md)** - Pomoc techniczna
- ⚖️ **[Prawa autorskie](./docs/copyright.md)** - Licencja i prawa autorskie

### Szybki dostęp:
- **Dashboard**: Główny panel po zalogowaniu
- **Projekty**: `/projects` - Zarządzanie projektami
- **Zadania**: `/tasks` - Tablica Kanban
- **Zespół**: `/team` - Zarządzanie użytkownikami
- **Analityka**: `/analytics` - Raporty i statystyki

## 🔧 Development

### Dostępne skrypty

```bash
# Development
npm run dev           # Uruchom serwer deweloperski
npm run build         # Zbuduj aplikację
npm run start         # Uruchom w trybie produkcyjnym

# Quality & Testing
npm run lint          # Sprawdź kod z ESLint
npm run type-check    # Sprawdź typy TypeScript

# Database
npx prisma studio     # Otwórz Prisma Studio
npx prisma generate   # Wygeneruj Prisma Client
npx prisma db push    # Zsynchronizuj schemat z bazą
npx prisma db seed    # Zasilij bazę danymi testowymi
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

## 📁 Struktura Projektu

```
tomsoft-pm-app/
├── docs/                    # Dokumentacja
│   ├── overview.md         # Przegląd aplikacji
│   ├── user-guide.md       # Instrukcja obsługi
│   └── copyright.md        # Prawa autorskie
├── screenshots/            # Screenshoty aplikacji
├── prisma/                 # Schema bazy danych i seedy
│   ├── schema.prisma      # Definicja modeli
│   └── seed.ts            # Dane testowe
├── public/                 # Pliki statyczne
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/          # API endpoints
│   │   ├── dashboard/    # Dashboard użytkownika
│   │   ├── projects/     # Zarządzanie projektami
│   │   ├── tasks/        # Zarządzanie zadaniami
│   │   └── team/         # Zarządzanie zespołem
│   ├── components/        # Komponenty React
│   ├── contexts/          # React Context providers
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities i konfiguracja
│   └── types/            # TypeScript type definitions
├── .env.example          # Przykład zmiennych środowiskowych
├── package.json          # Zależności i skrypty
└── README.md            # Ten plik
```

## 🚀 Roadmap

### Wersja 2.0 (Q1 2025)
- [ ] Zaawansowane raporty z AI
- [ ] Integracja z Microsoft Teams
- [ ] Mobile app (React Native)
- [ ] Advanced project templates

### Wersja 2.1 (Q2 2025)
- [ ] Time tracking z automatycznym wykrywaniem
- [ ] Gantt charts
- [ ] Resource management
- [ ] Multi-language support

## 🤝 Wkład w Projekt

1. Fork projektu
2. Utwórz branch dla nowej funkcji (`git checkout -b feature/AmazingFeature`)
3. Commit zmian (`git commit -m 'Add some AmazingFeature'`)
4. Push do brancha (`git push origin feature/AmazingFeature`)
5. Otwórz Pull Request

## 📞 Kontakt i Wsparcie

**Tomasz Chromy**
- 📧 Email: tomasz.chromy@outlook.com
- 🐙 GitHub: https://github.com/tomaszchroma
- 💼 LinkedIn: https://linkedin.com/in/tomasz-chromy

W przypadku problemów lub pytań:
- Utwórz [Issue na GitHub](https://github.com/tomaszchroma/tomsoft-pm-app/issues)
- Wyślij email z opisem problemu
- Sprawdź [dokumentację](./docs/) w poszukiwaniu rozwiązania

## ⚖️ Licencja i Prawa Autorskie

**Copyright © 2024 Tomasz Chromy. Wszelkie prawa zastrzeżone.**

Ten projekt jest własnością intelektualną Tomasza Chromy. Szczegółowe informacje o prawach autorskich i licencji znajdują się w pliku [docs/copyright.md](./docs/copyright.md).

### Dozwolone:
- ✅ Przeglądanie kodu źródłowego
- ✅ Uczenie się z kodu
- ✅ Tworzenie forków do celów edukacyjnych

### Zabronione bez pisemnej zgody:
- ❌ Komercyjne wykorzystanie
- ❌ Redystrybucja kodu
- ❌ Używanie nazwy "TomSoft"

---

**Zbudowane z ❤️ przez Tomasza Chromy**

*TomSoft PM - Profesjonalny system zarządzania projektami*
