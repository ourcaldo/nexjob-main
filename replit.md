# Nexjob - Job Portal Platform

This is a Next.js-based job portal application that provides a comprehensive platform for job seekers and employers in Indonesia.

## Project Overview

Nexjob is a job search platform that integrates with WordPress CMS for job listings and uses Supabase as the database backend. The application features:

- **Job Listings**: Browse and search job opportunities
- **WordPress Integration**: Job data sourced from WordPress CMS
- **Supabase Database**: User management, bookmarks, and application tracking
- **Rich Text Editor**: TipTap editor for job descriptions and content
- **AWS S3 Storage**: File and image storage
- **Admin Panel**: Manage advertisements, settings, and content
- **SEO Optimized**: Dynamic meta tags and sitemaps

## Technology Stack

### Frontend
- **Next.js 14**: React framework with SSR/SSG capabilities
- **React 18**: UI library
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **TipTap**: Rich text editor

### Backend & Database
- **Supabase**: PostgreSQL database with real-time capabilities
- **WordPress API**: External CMS for job listings
- **AWS S3**: Object storage for files and images

### Development
- **ESLint**: Code linting
- **TypeScript**: Static type checking
- **Formidable**: File upload handling

## Environment Variables

Create a `.env.local` file based on `.env.example`:

```bash
# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# WordPress API
NEXT_PUBLIC_WP_API_URL=https://your-cms-domain.com/wp-json/wp/v2
NEXT_PUBLIC_WP_FILTERS_API_URL=https://your-cms-domain.com/wp-json/nex/v1/filters-data
NEXT_PUBLIC_WP_AUTH_TOKEN=your_wordpress_token

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=your_google_analytics_id
NEXT_PUBLIC_GTM_ID=your_google_tag_manager_id

# Development
PORT=5000

# API Security
API_TOKEN=your_secure_api_token

# Supabase Storage
NEXT_PUBLIC_SUPABASE_STORAGE_KEY=your_storage_key
```

## Getting Started

### Installation

Dependencies are already installed via the packager. If you need to reinstall:

```bash
npm install
```

### Development

The development server runs automatically via the Replit workflow on port 5000:

```bash
npm run dev
```

Visit `http://localhost:5000` or use the Replit webview.

### Building for Production

```bash
npm run build
npm run start
```

## Project Structure

```
├── pages/               # Next.js pages and API routes
│   ├── api/            # API endpoints
│   ├── _app.tsx        # App wrapper
│   └── _document.tsx   # HTML document
├── src/
│   ├── components/     # React components
│   ├── lib/           # Utility libraries
│   ├── services/      # API services
│   └── types/         # TypeScript type definitions
├── styles/            # Global styles
│   └── globals.css    # Global CSS
├── supabase/          # Supabase migrations and config
│   └── migrations/    # Database migrations
├── attached_assets/   # Static assets
├── public/            # Public static files
└── next.config.js     # Next.js configuration
```

## Key Features

### For Job Seekers
- Browse and search job listings
- Filter by location, category, salary, etc.
- Bookmark favorite jobs
- Apply to jobs directly
- Track application status

### For Employers
- Post job listings
- Manage job postings
- Review applications

### Admin Features
- Advertisement management (banner, popup, sidebar ads)
- SEO settings configuration
- User management
- Analytics tracking
- Content moderation

## Database Schema

The application uses Supabase PostgreSQL with the following main tables:
- `user_bookmarks`: Saved jobs per user
- `advertisement_settings`: Ad configuration
- `settings`: Site-wide settings
- And more (see `supabase/migrations/` for full schema)

## API Routes

- `/api/bookmarks/*`: User bookmark management
- `/api/public/settings`: Public settings
- `/api/admin/*`: Admin panel endpoints
- `/api/advertisements/*`: Ad serving

## Deployment

The project is configured for deployment on Replit with autoscale. The `.replit` file contains the deployment configuration.

To deploy:
1. Ensure all environment variables are set in Replit Secrets
2. Click the "Deploy" button in Replit
3. The app will build and deploy automatically

## Notes

- The project uses both WordPress CMS (for job listings) and Supabase (for user data)
- Advertisement system supports banner, popup, and sidebar ads
- SEO is managed through database settings
- The app supports both development and production analytics tracking

## Repository

Original repository: https://github.com/ourcaldo/nexjobjs
