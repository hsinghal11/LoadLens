# LoadLens API Endpoints

This document outlines the available API endpoints for the LoadLens application and provides examples of how to test them using `curl` or tools like Postman.

## Base URL
The application runs on `http://localhost:3000` (as defined in `application-dev.properties`).

---

## Authentication Endpoints

### 1. User Registration
Registers a new user in the system.

- **URL:** `/api/v1/user/register`
- **Method:** `POST`
- **Content-Type:** `application/json`

**Request Body Example:**
```json
{
  "name": "John Doe",
  "email": "johndoe@example.com",
  "password": "securepassword123"
}
```

**cURL Command:**
```bash
curl -X POST http://localhost:3000/api/v1/user/register \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "johndoe@example.com", "password": "securepassword123"}'
```

**Expected Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "johndoe@example.com",
    "enabled": true,
    "provider": "LOCAL",
    "createdAt": "2024-03-05T18:00:00Z"
  }
}
```

---

### 2. User Login
Authenticates an existing user and returns a JWT token.

- **URL:** `/api/v1/user/login`
- **Method:** `POST`
- **Content-Type:** `application/json`

**Request Body Example:**
```json
{
  "email": "johndoe@example.com",
  "password": "securepassword123"
}
```

**cURL Command:**
```bash
curl -X POST http://localhost:3000/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{"email": "johndoe@example.com", "password": "securepassword123"}'
```

**Expected Response (202 Accepted):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "johndoe@example.com",
    "enabled": true,
    "provider": "LOCAL",
    "createdAt": "2024-03-05T18:00:00Z"
  }
}
```

---

### 3. Get Current User (Me)
Fetches the details of the currently authenticated user based on the provided JWT token.

- **URL:** `/api/v1/user/me`
- **Method:** `GET`
- **Authorization:** `Bearer <token>`

**cURL Command:**
```bash
curl -X GET http://localhost:3000/api/v1/user/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response (200 OK):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "johndoe@example.com",
  "enabled": true,
  "provider": "LOCAL",
  "createdAt": "2024-03-05T18:00:00Z"
}
```

---

## How to Test

### Using Postman/Insomnia
1. Create a new request.
2. Select the `POST` method.
3. Enter the full URL (e.g., `http://localhost:3000/api/v1/user/register`).
4. Go to the **Body** tab, select **raw**, and then choose **JSON**.
5. Paste the request body example and click **Send**.
6. When testing protected routes (like `/api/v1/user/me`), copy the `token` from the login response and paste it in the **Authorization** tab as a *Bearer Token*.

### Using VS Code extensions
You can install extensions like **Thunder Client** or **REST Client** to easily test these endpoints directly inside your editor.
