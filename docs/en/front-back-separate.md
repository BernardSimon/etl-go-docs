# Frontend-Backend Separated Development

This project supports separated development of the backend API and frontend UI, making it easy to debug each independently and iterate quickly.

## 1. Start the Backend

Modify `config.yaml`:

```yaml
runWeb: false
serverUrl: 0.0.0.0:8080
corsOrigins:
  - http://localhost:5173
```

Then start the backend:

```bash
go build -o etl-go .
./etl-go
```

## 2. Start the Frontend

```bash
cd web
pnpm install
pnpm dev -- --host 0.0.0.0
```

The frontend listens on `http://localhost:5173` by default.

## 3. Debugging Workflow

- Backend API address: `http://127.0.0.1:8080`
- Frontend dev address: `http://127.0.0.1:5173`

If CORS issues occur, make sure `corsOrigins` includes the frontend address.

## 4. Recommended Joint Debugging Checklist

1. After opening the frontend in a browser, test the login endpoint first.
2. Check that all Network requests go to `serverUrl`.
3. Access `/api/v1/components` to confirm backend component metadata is returned correctly.

## 5. Common Issues

### 1. Frontend opens but all API calls return 404

- Cause: Frontend proxy address is misconfigured or the backend is not started.
- Fix: Confirm the frontend API base URL points to `http://127.0.0.1:8080/api/v1`.

### 2. Login request blocked by browser (CORS)

- Cause: `corsOrigins` is missing the current frontend address.
- Fix: Add `http://localhost:5173` or your actual domain.

### 3. Cookie/Token behavior anomalies

- Cause: Cross-origin credential policy is inconsistent with CORS settings.
- Fix: Ensure requests include the `Authorization` header and check the backend's allowed header list.
