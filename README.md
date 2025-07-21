# Identity Reconciliation API

**Deployed Link:** https://identity-reconciliation-api-uz0u.onrender.com

**POST /api/identify:** https://identity-reconciliation-api-uz0u.onrender.com/api/identify

**Test the API using Swagger UI:** https://identity-reconciliation-api-uz0u.onrender.com/api-docs

A simple backend service to identify and merge user contacts based on email and phone number.

## Features

- Identify and merge contacts using `/api/identify` endpoint
- Handles primary and secondary contact relationships
- Prevents duplicate contacts by linking related identifiers
- OpenAPI (Swagger) documentation available
- Automated testing using Jest

## Tech Stack

- **Node.js** + **Express**
- **TypeScript**
- **Prisma ORM** (PostgreSQL)
- **Jest** (testing)
- **Swagger** (API docs)

## Database Model

`Contact`:

```prisma
model Contact {
  id             Int       @id @default(autoincrement())
  phoneNumber    String?
  email          String?
  linkedId       Int?
  linkPrecedence String
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?
}
```

- `linkPrecedence`: 'primary' or 'secondary'
- `linkedId`: Points to the primary contact if secondary

## Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL database

### Installation

1. **Clone the repo:**
   ```bash
   git clone https://github.com/ssacharya2002/Identity-Reconciliation-API
   cd Identity-Reconciliation-API
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment variables:**
   - Create a `.env` file in the root with:
     ```env
     DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db>
     PORT=3000
     API_BASE_URL=http://localhost:3000/api/
     ```
4. **Set up the database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

### Running the Server

- **Development:**
  ```bash
  npm run dev
  ```
- **Production build:**
  ```bash
  npm run build
  npm start
  ```
### Running the test cases

- **Running Tests**

  ```bash
  npm run test
  ```

## API Usage

### Identify or Merge Contact

- **Endpoint:** `POST /api/identify`
- **Body:**

  ```json
  {
    "email": "mcfly@hillvalley.edu",
    "phoneNumber": "123456"
  }
  ```

  - At least one of `email` or `phoneNumber` is required.

- **Response:**

  ```json
  {
    "contact": {
      "primaryContactId": 1,
      "emails": ["mcfly@hillvalley.edu"],
      "phoneNumbers": ["123456"],
      "secondaryContactIds": []
    }
  }
  ```

- **Error Responses:**
  - Missing both fields:
    ```json
    { "error": "Either email or phoneNumber must be provided." }
    ```
  - Invalid email/phone format:
    ```json
    { "error": "Invalid email format." }
    { "error": "Invalid phoneNumber format. Only digits are allowed." }
    ```

### Example cURL

```bash
curl -X POST http://localhost:3000/api/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "mcfly@hillvalley.edu", "phoneNumber": "123456"}'
```

## API Documentation

- Swagger UI available at: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
