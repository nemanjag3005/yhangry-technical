# Yhangry Technical Test Solution

## Prerequisites

- Node.js 16.x or later
- Docker (to setup a local containerized database)
- npm

## Installation

1. Install dependencies:

- npm install

2. Set up environment variables:

- cp .env.example .env

3. Initialize the database:

- ./start-database.sh

- npx prisma db push

4. Run the data harvester:

- npx tsx src/scripts/harvest-data.ts

5. Start the development server:

- npm run dev

The application will be available at http://localhost:3000

## Project Structure

### Part 1: Data Harvesting & Schema Design

- Location: /prisma/schema.prisma
- Data harvesting script: src/scripts/harvest-data.ts

#### Features:

- Implements rate limiting (1 request/second)
- Stores data in PostgreSQL using Prisma
- Includes optimized indexes for faster querying

### Part 2: Backend API

- Location: /src/server/api/routers/setMenu.ts

#### Features:

- tRPC router with input validation using Zod
- Filtered and paginated set menu queries
- Aggregated cuisine data

### Part 3: Frontend

- Location: /src/app/\_components/set-menus.tsx

#### Features:

- Responsive design with Tailwind CSS
- Dynamic price calculation
- Cuisine filtering
- Infinite scroll pagination
- Loading states and error handling
- State management of filters and guest number using Redux

## Tech Stack

#### Frontend/Backend:
- Next.js – React framework for building fast, SEO-friendly, full-stack applications with server-side rendering and static site generation.
- tRPC – Type-safe API library that enables automatic TypeScript inference between the client and server without the need for REST.
- Prisma – Type-safe ORM for interacting with databases.
- Database: PostgreSQL
- Styling: Tailwind CSS
- State Management: Redux
