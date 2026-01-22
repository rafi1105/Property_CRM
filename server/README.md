# Sintec  Real Estate CRM - Backend API

## Overview
Backend API for Sintec  Real Estate CRM system built with Node.js, Express.js, and MongoDB.

## Features
- **Role-Based Authentication**: Super Admin, Admin, Agent, and User roles with JWT
- **Firebase Integration**: Google authentication for regular users
- **Property Management**: CRUD operations with role-based access control
- **Customer Management**: Lead tracking and agent assignment
- **Task Management**: Google Tasks-style task manager with subtasks
- **Agent Management**: Agent profiles with performance metrics
- **Dashboard Analytics**: Role-specific stats and charts

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + Firebase Admin SDK
- **Validation**: express-validator

## Installation

```bash
cd Sintec -server
npm install
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://rafikabir05rk_db_user:WNsFz3XkdbjgxMUC@rk.kroacv1.mongodb.net/real-estate?retryWrites=true&w=majority&appName=rk

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d

# Firebase Configuration (Optional - for Google Auth)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key

# Client URL for CORS
CLIENT_URL=http://localhost:5173
```

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

Server will run on `https://real-estate-iota-livid.vercel.app`

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user (email/password)
- `POST /login` - User login
- `POST /admin/login` - Admin/Agent login (role-based)
- `POST /firebase` - Firebase Google authentication
- `GET /me` - Get current user (Protected)
- `PUT /profile` - Update profile (Protected)
- `PUT /change-password` - Change password (Protected)

### Properties (`/api/properties`)
- `GET /` - Get all published properties (Public)
- `GET /:id` - Get property by ID (Public)
- `GET /my/properties` - Get my assigned properties (Agent+)
- `POST /` - Create property (Admin+)
- `PUT /:id` - Update property (Admin+)
- `DELETE /:id` - Delete property (Super Admin)
- `PATCH /:id/publish` - Publish/unpublish property (Super Admin)
- `PATCH /:id/assign-agent` - Assign agent to property (Admin+)

### Customers (`/api/customers`)
- `GET /` - Get all customers (Agent+)
- `GET /my/customers` - Get my assigned customers (Agent+)
- `GET /:id` - Get customer by ID (Agent+)
- `POST /` - Create customer (Agent+)
- `PUT /:id` - Update customer (Agent+)
- `DELETE /:id` - Delete customer (Admin+)
- `PATCH /:id/assign-agent` - Assign agent to customer (Admin+)
- `POST /:id/notes` - Add note to customer (Agent+)

### Tasks (`/api/tasks`)
- `GET /` - Get all tasks (Agent+)
- `GET /my/tasks` - Get my tasks (Agent+)
- `GET /:id` - Get task by ID (Agent+)
- `POST /` - Create task (Agent+)
- `PUT /:id` - Update task (Agent+)
- `DELETE /:id` - Delete task (Agent+)
- `PATCH /:id/complete` - Mark task as complete (Agent+)
- `POST /:id/subtasks` - Add subtask (Agent+)
- `PATCH /:id/subtasks/:subtaskId/toggle` - Toggle subtask (Agent+)
- `POST /:id/comments` - Add comment (Agent+)

### Agents (`/api/agents`)
- `GET /` - Get all agents (Admin+)
- `GET /:id` - Get agent by ID (Admin+)
- `GET /:id/stats` - Get agent statistics (Admin+)
- `POST /` - Create agent (Admin+)
- `PUT /:id` - Update agent (Admin+)
- `DELETE /:id` - Delete agent (Admin+)

### Dashboard (`/api/dashboard`)
- `GET /stats` - Get dashboard stats (Role-based)
- `GET /super-admin/stats` - Super Admin dashboard stats
- `GET /admin/stats` - Admin dashboard stats
- `GET /agent/stats` - Agent dashboard stats

## Role Hierarchy

### Super Admin
- Full system access
- Can publish properties to frontend
- Manage all users, admins, and agents
- Access all dashboard features

### Admin
- Manage properties (add, edit)
- Manage customers (add, edit, assign to agents)
- Manage tasks (create, assign to agents)
- Add and manage agents
- Cannot delete critical resources

### Agent
- View assigned properties only
- View assigned customers or self-added customers
- Create and manage own tasks
- Mark assigned tasks as done
- Limited dashboard access

### User
- Frontend users only
- Register via email/password or Google
- Browse published properties
- No admin panel access

## Database Models

### User Model
- Authentication and user management
- Role-based access control
- Firebase integration support

### Property Model
- Property listings with details
- Assignment tracking
- Publication status

### Customer Model
- Lead management
- Interest tracking
- Notes and communication history

### Task Model
- Task management with subtasks
- Priority and status tracking
- Comments and updates

### Agent Model
- Agent profiles
- Performance metrics
- Assignment tracking

## Authentication Flow

### Admin/Agent Login
1. POST to `/api/auth/admin/login` with email, password, and role
2. Server validates credentials and role
3. Returns JWT token
4. Include token in Authorization header: `Bearer <token>`

### User Login
1. Email/Password: POST to `/api/auth/login`
2. Google: POST to `/api/auth/firebase` with Firebase ID token
3. Returns JWT token

## Security Features
- Password hashing with bcryptjs
- JWT token authentication
- Role-based middleware
- Input validation
- CORS configuration
- Environment variable protection

## Error Handling
All endpoints return consistent JSON responses:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (development only)"
}
```

## Development Notes

### Creating First Super Admin
Use MongoDB directly or create a seeder script to create the first Super Admin user.

### Testing API
Use Postman, Thunder Client, or any REST client to test endpoints.

### Firebase Setup
1. Create Firebase project
2. Enable Google authentication
3. Download service account key
4. Add credentials to `.env`

## Project Structure
```
Sintec -server/
├── config/
│   └── firebase.config.js      # Firebase Admin SDK config
├── controllers/                 # Route controllers
│   ├── auth.controller.js
│   ├── property.controller.js
│   ├── customer.controller.js
│   ├── task.controller.js
│   ├── agent.controller.js
│   └── dashboard.controller.js
├── middleware/
│   └── auth.middleware.js       # JWT & role-based auth
├── models/                      # Mongoose models
│   ├── User.model.js
│   ├── Property.model.js
│   ├── Customer.model.js
│   ├── Task.model.js
│   └── Agent.model.js
├── routes/                      # API routes
│   ├── auth.routes.js
│   ├── property.routes.js
│   ├── customer.routes.js
│   ├── task.routes.js
│   ├── agent.routes.js
│   └── dashboard.routes.js
├── utils/
│   └── jwt.utils.js             # JWT helpers
├── .env                         # Environment variables
├── .gitignore
├── package.json
└── server.js                    # App entry point
```

## License
ISC
