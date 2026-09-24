# MAYURA REGALIA - Jewellery E-Commerce MVP

MAYURA REGALIA is a React.js + Express.js + MySQL jewellery e-commerce MVP with a separate admin panel.

## Project Structure

```text
MAYURA-REGALIA/
├── frontend/                 # React storefront + admin UI
│   ├── public/products/      # Jewellery images
│   └── src/
│       ├── admin/            # Admin login + dashboard
│       ├── components/       # Storefront components
│       ├── pages/            # Storefront pages
│       ├── services/         # API/auth/product services
│       └── ...
└── backend/                  # Express API
    ├── config/              # MySQL connection
    ├── controllers/         # Auth/product logic
    ├── middleware/          # JWT admin protection
    ├── models/              # MySQL queries
    ├── routes/              # REST routes
    └── utils/               # Seed helpers
```

## Run the project

### 1. Backend

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and set your MySQL credentials.

```bash
npm start
```

The backend creates the `mayura_regalia` database/tables and seeds the initial catalogue if required.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm start
```

The storefront runs on `http://localhost:3000` and the API runs on `http://localhost:5000`.

## Admin Panel

Open:

`http://localhost:3000/admin/login`

The credentials come from `backend/.env`:

```env
ADMIN_EMAIL=admin@mayuraregalia.com
ADMIN_PASSWORD=Admin@123
```

After login, the admin dashboard can add, edit and delete products. These changes are saved in MySQL and immediately become available to the React storefront through `/api/products`.

## Deploy to Railway

This repository deploys as one Railway service: Railway builds the React app,
then Express serves both the API and the built storefront. The included
`railway.json` supplies the required build command, start command, and health
check.

1. Push this repository to GitHub and create a new Railway project from it.
2. In the Railway service variables, set `NODE_ENV=production`, a long random
   `JWT_SECRET`, `ADMIN_EMAIL`, and a strong `ADMIN_PASSWORD`.
3. Add a Railway MySQL service. In the web service, set `DB_HOST`, `DB_PORT`,
   `DB_USER`, `DB_PASSWORD`, and `DB_NAME` from that MySQL service's reference
   variables, and set `DB_SSL=false`.
4. Deploy, generate a public domain in Railway Networking, then set
   `FRONTEND_URL` to that exact `https://...` domain and redeploy.

Do not add `.env`, database passwords, JWT secrets, payment keys, or SSL
certificates to Git.

## Database

The backend uses MySQL database `mayura_regalia` and automatically creates:

- `admins`
- `products`

Do not commit `.env` to source control. Change the default admin password and JWT secret before deployment.
