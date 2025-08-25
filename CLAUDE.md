# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Elasticsearch management web application built with Vue 3 and Express, providing a comprehensive interface for managing and visualizing Elasticsearch data.

## Service Configuration

### Elasticsearch Configuration
- Service URL: configurable via environment variables
- Authentication: configurable username/password authentication
- Client library: @elastic/elasticsearch

### Port Configuration
- Frontend: Port 9020 (Vite dev server)
- Backend API: Port 9021 (Express server)

## Architecture

### Frontend (Vue 3 + Vite)
- **Framework**: Vue 3 with Composition API
- **UI Library**: Element Plus
- **Router**: Vue Router for SPA navigation
- **Charts**: Chart.js with vue-chartjs
- **Build Tool**: Vite

### Backend (Express + Elasticsearch Client)
- **server/index.js**: Express API server with Elasticsearch client
- **CORS enabled** for frontend communication
- **RESTful endpoints** for all ES operations

### Key Features
1. **Index Management**: Create, delete, view indices
2. **Document Search**: Multiple query types (match, term, range, bool)
3. **Document CRUD**: Create, read, update, delete documents
4. **Statistics**: Visual charts and detailed metrics
5. **Real-time Status**: Connection status monitoring

## Commands

```bash
# Install dependencies
npm install

# Run backend server (port 9021)
npm run server

# Run frontend dev server (port 9020)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
├── src/
│   ├── api/elasticsearch.js    # API client wrapper
│   ├── views/                  # Page components
│   │   ├── Search.vue          # Search interface
│   │   ├── Indices.vue         # Index management
│   │   ├── Documents.vue       # Document CRUD
│   │   └── Stats.vue           # Statistics dashboard
│   ├── router/index.js         # Route definitions
│   ├── App.vue                 # Main app component
│   └── main.js                 # App entry point
├── server/
│   └── index.js                # Express backend API
└── vite.config.js              # Vite configuration with proxy
```

## Development Notes

- API calls are proxied through Vite dev server (configured in vite.config.js)
- All ES operations go through the Express backend for security
- Frontend uses `/api` prefix which is proxied to `localhost:9021`
- Error handling is implemented at both frontend and backend levels