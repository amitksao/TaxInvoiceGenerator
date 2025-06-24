# Tax Invoice Generator Application

## Overview

This is a full-stack web application built for generating professional tax invoices. The system allows users to create invoices for tax-related services including tax return filing, accounting services, and audit services. The application features a modern React frontend with a Node.js/Express backend, using PostgreSQL for data persistence and PDF generation capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API architecture
- **Middleware**: Express middleware for JSON parsing, CORS, and request logging

### Data Layer
- **Database**: PostgreSQL (Replit-managed database with full persistence)
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Neon Database serverless driver for PostgreSQL connectivity
- **Storage**: DatabaseStorage class implementing full CRUD operations

## Key Components

### Database Schema
- **Invoices Table**: 
  - Core invoice data (invoice number, assessment year, charges)
  - Client information fields (name, address, city, state, PIN, email, phone)
  - Decimal fields for monetary values (tax return charges, accounting charges, audit fees)
  - JSON field for additional charges (up to 3 custom charges)
  - Auto-generated timestamps and invoice numbers
- **Clients Table**: 
  - Complete customer information management
  - Name, email, phone, address, city, state, PIN code
  - Created and updated timestamps
  - Full CRUD operations with search functionality
- **Users Table**: Basic user authentication schema (prepared for future auth implementation)

### API Endpoints
**Invoice Management:**
- `POST /api/invoices` - Create new invoice with validation
- `GET /api/invoices` - Retrieve all invoices (with optional search and client filtering)
- `GET /api/invoices/:id` - Retrieve specific invoice by ID

**Client Management:**
- `POST /api/clients` - Create new client
- `GET /api/clients` - Retrieve all clients (with optional search)
- `GET /api/clients/:id` - Retrieve specific client by ID
- `PUT /api/clients/:id` - Update client information
- `DELETE /api/clients/:id` - Delete client

### Frontend Components
- **InvoiceForm**: Form component with validation for invoice creation and client information
  - Integrated client search functionality for populating existing customer details
  - Modal dialog for searching and selecting clients from database
- **InvoicePreview**: Real-time preview of invoice as user fills the form
- **PDF Generation**: Client-side PDF generation using jsPDF library
- **Clients Page**: Complete client management interface with CRUD operations
- **Invoice History**: Comprehensive invoice listing with search and filtering capabilities
- **Navigation**: Multi-page application with invoice generator, history, and client management

### Validation & Types
- Shared TypeScript types between frontend and backend
- Zod schemas for runtime validation
- Form validation with error handling and user feedback

## Data Flow

1. **Invoice Creation**: User fills out the invoice form with service details
2. **Real-time Preview**: Form data is reflected in a live preview component
3. **Validation**: Client-side validation using Zod schemas before submission
4. **API Processing**: Backend validates data and generates unique invoice number
5. **Database Storage**: Invoice data is persisted to PostgreSQL database
6. **PDF Generation**: Client generates and downloads PDF invoice
7. **UI Feedback**: Success/error notifications using toast system

## External Dependencies

### Core Framework Dependencies
- React ecosystem (React, ReactDOM, React Hook Form)
- Express.js for backend API
- Drizzle ORM and PostgreSQL drivers

### UI/UX Libraries
- Radix UI primitives for accessible components
- Tailwind CSS for styling
- Lucide React for icons
- shadcn/ui component system

### Utility Libraries
- TanStack Query for API state management
- jsPDF for client-side PDF generation
- date-fns for date formatting
- Zod for schema validation
- clsx and tailwind-merge for conditional styling

### Development Tools
- TypeScript for type safety
- Vite for development and build tooling
- PostCSS and Autoprefixer for CSS processing

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with TypeScript execution via tsx
- **Database**: PostgreSQL 16 module in Replit
- **Development Server**: Vite dev server with HMR for frontend, tsx for backend
- **Port Configuration**: Backend runs on port 5000, exposed externally on port 80

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Deployment Target**: Autoscale deployment on Replit
- **Static Assets**: Frontend served from backend in production

### Build Process
1. Vite builds client-side React application
2. esbuild bundles server-side TypeScript code
3. Static assets are served by Express in production
4. Database migrations run via Drizzle Kit

## Changelog
- June 24, 2025. Initial setup with in-memory storage
- June 24, 2025. Added PostgreSQL database with full persistence, migrated from MemStorage to DatabaseStorage
- June 24, 2025. Added client database and management system with full CRUD operations, search functionality, and navigation
- June 24, 2025. Implemented client search functionality in invoice form for auto-populating existing customer details
- June 24, 2025. Reorganized form layout with compact client information section and separate fees subsection
- June 24, 2025. Added invoice history page with comprehensive search functionality by client name, invoice number, email, phone, city, state, and assessment year
- June 24, 2025. Updated PDF naming convention to "ClientName_InvoiceNumber_AssessmentYear.pdf" for easy file organization

## User Preferences

Preferred communication style: Simple, everyday language.