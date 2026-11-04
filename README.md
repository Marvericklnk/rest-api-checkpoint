# REST API Checkpoint

Commented Express and Mongoose API for creating, reading, updating, and deleting users.

## Setup

Install Node.js 20.19 or newer, then open this folder in VS Code and run:

```bash
npm install
```

Copy `config/.env.example` to `config/.env`. The example uses a local MongoDB database. For Atlas, replace MONGO_URI with your own private connection string and a practice database name. Keep quotes around the URI. `config/.env` is excluded from Git.

```bash
npm start
```

The API starts on port 3000 after connecting to MongoDB.

## Structure

- `config/.env.example` — private configuration template
- `models/User.js` — user schema and exported model
- `server.js` — four routes, JSON parsing, validation, error handling, environment configuration, database connection and server startup
- `postman-collection.json` — importable requests for all four routes

## Routes

| Method | Path | Action | Success status |
| --- | --- | --- | --- |
| GET | /users | Return all users | 200 |
| POST | /users | Create a user | 201 |
| PUT | /users/:id | Edit a user | 200 |
| DELETE | /users/:id | Remove a user | 200 |

POST accepts name and email (required), plus age (optional, nonnegative). PUT accepts any of those fields. Unknown fields are ignored. Invalid IDs or values return 400; missing users return 404; unexpected errors return 500.

## Test with Postman

1. Start MongoDB and the API.
2. Import `postman-collection.json` into Postman.
3. Run the four requests in their numbered order, or use Collection Runner.
4. The POST request saves the created user's ID as `userId`. PUT and DELETE reuse that ID. Each request checks its expected status.
5. GET again after DELETE to confirm the user has been removed.

## Verification status

`npm test` checks the real HTTP routes with mocked Mongoose operations, plus schema validation. These checks do not verify database persistence. Actual MongoDB CRUD and Postman execution are pending a working database connection. No successful database or Postman run is claimed. MongoDB could not start in this workspace during an earlier checkpoint (“Operation not permitted”).
