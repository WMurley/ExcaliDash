<img src="logoExcaliDash.png" alt="[Image Description]" width="80" height="88">

# ExcaliDash

A beautiful, self hosted dashboard and organizer for [Excalidraw](https://github.com/excalidraw/excalidraw) with live collaboration.
![](dashboard.png)

[Features](#Features)

[Installation](#Installation)

[Development](#Development)

[Credits](#Credits)

# Features

## Persistent storage for all your drawings

![](dashboardLight.png)

## Real time collaboration

![](collabDemo.gif)

## Search your drawings

![](searchPage.png)

## Drag and drop drawings into collections

![](collectionsPage.png)

## Export/import your drawings and databases for backup

![](settingsPage.png)

# Installation

## Dockerhub (recommended)

[Install Docker](https://docs.docker.com/desktop/)

```bash
# Download docker-compose.prod.yml
curl -OL https://raw.githubusercontent.com/ZimengXiong/ExcaliDash/refs/heads/main/docker-compose.prod.yml

# Pull images
docker compose -f docker-compose.prod.yml pull

# Run container
docker compose -f docker-compose.prod.yml up -d
```

## Docker build

[Install Docker](https://docs.docker.com/desktop/)

```bash
# Clone the repository (recommended)
git clone git@github.com:ZimengXiong/ExcaliDash.git

# or, clone with HTTPS
# git clone https://github.com/ZimengXiong/ExcaliDash.git

docker compose build
docker compose up -d

# Access the frontend at localhost:6767
```

# Development

## Clone the repository

```bash
# Clone the repository (recommended)
git clone git@github.com:ZimengXiong/ExcaliDash.git

# or, clone with HTTPS
# git clone https://github.com/ZimengXiong/ExcaliDash.git
```

## Frontend

```bash
cd ExcaliDash/frontend
npm install

# Copy environment file and customize if needed
cp .env.example .env

npm run dev
```

## Backend

```bash
cd ExcaliDash/backend
npm install

# Copy environment file and customize if needed
cp .env.example .env

# Generate Prisma client and setup database
npx prisma generate
npx prisma db push

npm run dev
```

## Structure

```
ExcaliDash/
├── backend/                 # Node.js + Express + Prisma
│   ├── src/
│   │   └── index.ts        # Main server file
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── dev.db         # SQLite database
│   └── package.json
├── frontend/               # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   └── api/           # API client
│   └── package.json
└── README.md
```

# Credits

- Example designs from:
  - https://github.com/Prakash-sa/system-design-ultimatum/tree/main
  - https://github.com/kitsteam/excalidraw-examples/tree/main
- [Excalidraw](https://github.com/ZimengXiong/ExcaliDash)
