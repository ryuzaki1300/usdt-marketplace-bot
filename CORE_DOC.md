# USDT Marketplace Core - Public API Documentation

This document provides comprehensive API documentation for third-party developers building applications on top of the USDT Marketplace Core REST API.

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [API Endpoints](#api-endpoints)
4. [Data Transfer Objects (DTOs)](#data-transfer-objects-dtos)
5. [Error Handling](#error-handling)
6. [Common Workflows](#common-workflows)
7. [Response Formats](#response-formats)
8. [Integration Guidelines](#integration-guidelines)

---

## Overview

The USDT Marketplace Core API is a RESTful API for managing a peer-to-peer USDT trading marketplace. The system supports:

- **User Management**: User registration, KYC verification, role-based access control
- **Order Management**: Creating buy/sell orders for USDT
- **Offer System**: Users can make offers on orders
- **Deal Management**: Converting accepted offers into deals with admin oversight
- **Telegram Integration**: Metadata tracking for Telegram bot integration

### Base URL

All API endpoints are relative to the base URL. Default port: 3000

Example: `http://localhost:3000`

---

## Authentication & Authorization

### Required Headers

All API requests require the following header:

- **`x-api-key`** (Required): API key for authentication
  - Must be included in every request
  - Contact API administrator to obtain your API key

### Optional Headers

For user-specific operations, include:

- **`x-telegram-user-id`** (Optional): Telegram user ID for user authentication
  - Used to identify the authenticated user
  - Automatically creates user account if it doesn't exist
  - Required for endpoints that modify user-specific data

- **`x-telegram-chat-id`** (Optional): Telegram chat ID for context
  - Used for Telegram bot integration
  - Provides additional context for operations

### Authorization Levels

**User Roles** (hierarchical):
- `user`: Basic access, can submit KYC, view own profile, create orders/offers
- `admin`: Can manage users, review KYC, block users, approve/complete deals
- `super_admin`: Full access, can delete users, create admins

**KYC Status**:
- `none`: No KYC submitted
- `pending`: KYC submitted, awaiting admin review
- `approved`: KYC approved, user can trade
- `rejected`: KYC rejected

**User Status**:
- `active`: User can access the system
- `blocked`: User is blocked from accessing the system

### Important Notes

- **KYC Requirement**: Trading operations (create order, create offer, create deal) require KYC approval (`kyc_status === 'approved'`)
- **Role Hierarchy**: `super_admin` > `admin` > `user`. Higher roles inherit permissions of lower roles.
- **Auto User Creation**: If a `telegram_user_id` is provided and the user doesn't exist, a new user account is automatically created with role `user` and status `active`.

---

## API Endpoints

### User Endpoints (`/users`)

#### Public Endpoints

| Method | Endpoint | Description | Headers Required |
|--------|----------|-------------|------------------|
| POST | `/users` | Create a new user | `x-api-key` |
| GET | `/users/telegram/:telegram_user_id` | Get user by Telegram ID | `x-api-key` |

#### Authenticated User Endpoints

| Method | Endpoint | Description | Headers Required | KYC Required |
|--------|----------|-------------|------------------|--------------|
| GET | `/users/me/profile` | Get current user profile | `x-api-key`, `x-telegram-user-id` | No |
| POST | `/users/me/kyc/submit` | Submit KYC application | `x-api-key`, `x-telegram-user-id` | No |

#### Admin Endpoints

| Method | Endpoint | Description | Headers Required | Role Required |
|--------|----------|-------------|------------------|---------------|
| GET | `/users` | Get all users (paginated) | `x-api-key`, `x-telegram-user-id` | admin, super_admin |
| GET | `/users/:id` | Get user by ID | `x-api-key`, `x-telegram-user-id` | admin, super_admin |
| PATCH | `/users/:id` | Update user | `x-api-key`, `x-telegram-user-id` | admin, super_admin |
| GET | `/users/kyc/pending` | Get pending KYC requests | `x-api-key`, `x-telegram-user-id` | admin, super_admin |
| GET | `/users/blocked` | Get blocked users | `x-api-key`, `x-telegram-user-id` | admin, super_admin |
| POST | `/users/:id/block` | Block a user | `x-api-key`, `x-telegram-user-id` | admin, super_admin |
| POST | `/users/:id/kyc/review` | Review KYC application | `x-api-key`, `x-telegram-user-id` | admin, super_admin |

**Query Parameters for GET `/users`**:
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Items per page (default: 10, min: 1, max: 100)
- `admins_only` (optional): If `true` or `1`, returns only users with `admin` or `super_admin` role (default: `false`)

#### Super Admin Endpoints

| Method | Endpoint | Description | Headers Required | Role Required |
|--------|----------|-------------|------------------|---------------|
| DELETE | `/users/:id` | Delete user | `x-api-key`, `x-telegram-user-id` | super_admin |
| POST | `/users/:id/admin/create` | Create an admin | `x-api-key`, `x-telegram-user-id` | super_admin |

### Order Endpoints (`/orders`)

| Method | Endpoint | Description | Headers Required | KYC Required |
|--------|----------|-------------|------------------|--------------|
| POST | `/orders` | Create a new order | `x-api-key`, `x-telegram-user-id` | Yes |
| GET | `/orders` | Get all orders (paginated, filterable) | `x-api-key` | No |
| GET | `/orders/open` | Get all open orders | `x-api-key` | No |
| GET | `/orders/maker/:maker_id` | Get orders by maker | `x-api-key` | No |
| GET | `/orders/:id` | Get order by ID | `x-api-key` | No |
| PATCH | `/orders/:id` | Update order | `x-api-key` | No |
| DELETE | `/orders/:id` | Delete order | `x-api-key` | No |
| POST | `/orders/:id/cancel` | Cancel order | `x-api-key` | No |

**Query Parameters for GET `/orders`**:
- `status` (optional): Filter by status - `open`, `matched`, `canceled`
- `side` (optional): Filter by side - `buy`, `sell`
- `maker_id` (optional): Filter by maker user ID
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Items per page (default: 10, min: 1, max: 100)

**Query Parameters for GET `/orders/open`**:
- `side` (optional): Filter by side - `buy`, `sell`

### Order Offer Endpoints (`/order-offers`)

| Method | Endpoint | Description | Headers Required | KYC Required |
|--------|----------|-------------|------------------|--------------|
| POST | `/order-offers` | Create a new offer | `x-api-key`, `x-telegram-user-id` | Yes |
| GET | `/order-offers` | Get all offers (paginated, filterable) | `x-api-key` | No |
| GET | `/order-offers/order/:order_id/pending` | Get pending offers for order | `x-api-key` | No |
| GET | `/order-offers/taker/me` | Get my pending offers | `x-api-key`, `x-telegram-user-id` | No |
| GET | `/order-offers/:id` | Get offer by ID | `x-api-key` | No |
| PATCH | `/order-offers/:id` | Update offer | `x-api-key` | No |
| DELETE | `/order-offers/:id` | Delete offer | `x-api-key` | No |
| POST | `/order-offers/:id/reject` | Reject offer (maker action) | `x-api-key`, `x-telegram-user-id` | No |
| POST | `/order-offers/:id/cancel` | Cancel offer (taker action) | `x-api-key`, `x-telegram-user-id` | No |

**Query Parameters for GET `/order-offers`**:
- `order_id` (optional): Filter by order ID
- `taker_id` (optional): Filter by taker user ID
- `status` (optional): Filter by status - `pending_maker_decision`, `accepted_by_maker`, `rejected_by_maker`, `canceled_by_taker`
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Items per page (default: 10, min: 1, max: 100)

### Deal Endpoints (`/deals`)

| Method | Endpoint | Description | Headers Required | KYC Required | Role Required |
|--------|----------|-------------|------------------|--------------|---------------|
| POST | `/deals` | Create a new deal from accepted offer | `x-api-key`, `x-telegram-user-id` | Yes | No |
| GET | `/deals` | Get all deals (paginated, filterable) | `x-api-key` | No | No |
| GET | `/deals/pending` | Get pending deals | `x-api-key` | No | No |
| GET | `/deals/user/:user_id` | Get deals by user | `x-api-key` | No | No |
| GET | `/deals/:id` | Get deal by ID | `x-api-key` | No | No |
| PATCH | `/deals/:id` | Update deal | `x-api-key` | No | No |
| DELETE | `/deals/:id` | Delete deal | `x-api-key` | No | No |
| POST | `/deals/:id/approve` | Approve deal | `x-api-key`, `x-telegram-user-id` | No | admin, super_admin |
| POST | `/deals/:id/complete` | Complete deal | `x-api-key`, `x-telegram-user-id` | No | admin, super_admin |
| POST | `/deals/:id/cancel` | Cancel deal | `x-api-key`, `x-telegram-user-id` | No | admin, super_admin |

**Query Parameters for GET `/deals`**:
- `order_id` (optional): Filter by order ID
- `maker_id` (optional): Filter by maker user ID
- `taker_id` (optional): Filter by taker user ID
- `status` (optional): Filter by status - `pending_admin`, `in_progress`, `completed`, `cancelled`
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Items per page (default: 10, min: 1, max: 100)

### Order Telegram Meta Endpoints (`/order-telegram-meta`)

| Method | Endpoint | Description | Headers Required |
|--------|----------|-------------|------------------|
| POST | `/order-telegram-meta` | Create telegram metadata for order | `x-api-key` |
| GET | `/order-telegram-meta` | Get all metadata (paginated) | `x-api-key` |
| GET | `/order-telegram-meta/order/:order_id` | Get metadata by order ID | `x-api-key` |
| GET | `/order-telegram-meta/:id` | Get metadata by ID | `x-api-key` |
| PATCH | `/order-telegram-meta/:id` | Update metadata | `x-api-key` |
| PATCH | `/order-telegram-meta/order/:order_id` | Update metadata by order ID | `x-api-key` |
| DELETE | `/order-telegram-meta/:id` | Delete metadata | `x-api-key` |

**Query Parameters for GET `/order-telegram-meta`**:
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Items per page (default: 10, min: 1, max: 100)

---

## Data Transfer Objects (DTOs)

### Common DTOs

#### PaginatedResponseDto<T>

All paginated endpoints return this format:

```typescript
{
  data: T[];           // Array of items for current page
  page: number;        // Current page number (1-based)
  limit: number;       // Number of items per page
  total: number;       // Total number of items
  totalPages: number;  // Total number of pages
  hasNext: boolean;    // Whether there is a next page
  hasPrev: boolean;    // Whether there is a previous page
}
```

### User DTOs

#### CreateUserDto

Request body for creating a new user:

```typescript
{
  telegram_user_id: number;        // Required, unique Telegram user ID
  telegram_username?: string;      // Optional, max 100 characters
  full_name?: string;              // Optional, max 150 characters
  phone_number?: string;           // Optional, max 50 characters
  status?: 'active' | 'blocked';   // Optional, default: 'active'
}
```

**Response**: Returns the created User object with `id`, `role: 'user'`, `kyc_status: 'none'`, and timestamps.

#### UpdateUserDto

Request body for updating a user (admin only):

```typescript
{
  telegram_username?: string;                    // Optional, max 100 characters
  full_name?: string;                            // Optional, max 150 characters
  phone_number?: string;                         // Optional, max 50 characters
  kyc_status?: 'none' | 'pending' | 'approved' | 'rejected';
  kyc_submitted_at?: string;                     // ISO 8601 date string
  kyc_reviewed_at?: string;                      // ISO 8601 date string
  kyc_reviewed_by?: number;                      // User ID of reviewer
  status?: 'active' | 'blocked';
}
```

#### SubmitKycDto

Request body for submitting KYC application:

```typescript
{
  full_name?: string;     // Optional, max 150 characters
  phone_number?: string;  // Optional, max 50 characters
}
```

**Note**: Sets `kyc_status` to `'pending'` and `kyc_submitted_at` to current timestamp.

#### ReviewKycDto

Request body for reviewing KYC application (admin only):

```typescript
{
  status: 'approved' | 'rejected';  // Required
}
```

**Note**: Sets `kyc_status`, `kyc_reviewed_at`, and `kyc_reviewed_by` automatically.

### Trading DTOs

#### CreateOrderDto

Request body for creating a new order:

```typescript
{
  side: 'buy' | 'sell';           // Required
  amount_usdt: number;            // Required, minimum: 0
  price_per_unit: number;         // Required, minimum: 0
  total_price?: number;           // Optional, auto-calculated if not provided
  network?: string;               // Optional (e.g., 'TRC20', 'ERC20')
  description?: string;           // Optional
}
```

**Note**: 
- Creates order with `status: 'open'`
- `maker_id` is automatically set from authenticated user
- `total_price` is calculated as `amount_usdt * price_per_unit` if not provided
- Requires KYC approval

#### UpdateOrderDto

Request body for updating an order:

```typescript
{
  amount_usdt?: number;           // Optional, minimum: 0
  price_per_unit?: number;        // Optional, minimum: 0
  total_price?: number;           // Optional, auto-recalculated if amount/price changes
  network?: string;               // Optional
  description?: string;           // Optional
  status?: 'open' | 'matched' | 'canceled';
}
```

**Note**: Only non-status fields can be updated when `order.status === 'open'`. `total_price` is recalculated if `amount_usdt` or `price_per_unit` changes.

#### CreateOrderOfferDto

Request body for creating an offer on an order:

```typescript
{
  order_id: number;               // Required
  price_per_unit: number;         // Required, minimum: 0
  total_price?: number;           // Optional, auto-calculated
  comment?: string;               // Optional
}
```

**Note**:
- Creates offer with `status: 'pending_maker_decision'`
- `taker_id` is automatically set from authenticated user
- Order must exist and have `status: 'open'`
- `total_price` is calculated as `order.amount_usdt * price_per_unit` if not provided
- Requires KYC approval

#### UpdateOrderOfferDto

Request body for updating an offer:

```typescript
{
  price_per_unit?: number;        // Optional, minimum: 0
  total_price?: number;           // Optional, auto-recalculated if price changes
  comment?: string;               // Optional
  status?: 'pending_maker_decision' | 'accepted_by_maker' | 'rejected_by_maker' | 'canceled_by_taker';
}
```

**Note**: Only non-status fields can be updated when `offer.status === 'pending_maker_decision'`. `total_price` is recalculated if `price_per_unit` changes.

#### CreateDealDto

Request body for creating a deal from an accepted offer:

```typescript
{
  order_id: number;               // Required
  offer_id: number;               // Required
}
```

**Note**:
- Creates deal with `status: 'pending_admin'`
- Order `maker_id` must match authenticated user
- Offer must exist, be accepted, and belong to the order
- Automatically sets `order.status` to `'matched'` and `offer.status` to `'accepted_by_maker'`
- Requires KYC approval

#### UpdateDealDto

Request body for updating a deal:

```typescript
{
  amount_usdt?: number;           // Optional, minimum: 0
  price_per_unit?: number;        // Optional, minimum: 0
  total_price?: number;           // Optional, auto-recalculated
  status?: 'pending_admin' | 'in_progress' | 'completed';
}
```

**Note**: Cannot update deals with `status: 'completed'`. `total_price` is recalculated if `amount_usdt` or `price_per_unit` changes.

#### CreateOrderTelegramMetaDto

Request body for creating Telegram metadata for an order:

```typescript
{
  order_id: number;               // Required, must be unique
  chat_id: number;                // Required
  message_id?: number;            // Optional
  inline_message_id?: string;     // Optional
}
```

**Note**: Order must exist. Only one metadata record per order is allowed.

#### UpdateOrderTelegramMetaDto

Request body for updating Telegram metadata:

```typescript
{
  chat_id?: number;               // Optional
  message_id?: number;            // Optional
  inline_message_id?: string;     // Optional
}
```

**Note**: `last_update_at` is automatically updated.

---

## Error Handling

### Error Response Format

All API errors follow a consistent, user-friendly format that can be directly displayed to end users in most cases:

```typescript
{
  statusCode: number;        // HTTP status code (400, 401, 404, 409, etc.)
  message: string;           // Human-readable error message (ready for display)
  error: string;             // Error type name
  type: string;              // Programmatic error type (for conditional handling)
  details?: string;          // Additional error details (if available)
}
```

### Important Note on Error Messages

**All error messages are designed to be user-friendly and can be directly displayed to end users in most cases.** The API provides clear, descriptive error messages that explain what went wrong and, when applicable, what the user can do to resolve the issue.

### HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `204 No Content`: Request successful, no content to return
- `400 Bad Request`: Invalid request data or parameters
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Business logic conflict (e.g., resource already exists, invalid state)
- `422 Unprocessable Entity`: Validation failed
- `500 Internal Server Error`: Server error

### Error Types

The `type` field in error responses can be used for programmatic error handling:

- `API_KEY_MISSING`: API key header not provided
- `API_KEY_INVALID`: API key is invalid
- `AUTHENTICATION_REQUIRED`: User authentication required
- `KYC_VERIFICATION_REQUIRED`: KYC approval required for this operation
- `ROLE_REQUIRED`: Insufficient role permissions
- `USER_ACCOUNT_BLOCKED`: User account is blocked
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Business logic conflict
- `VALIDATION_FAILED`: Input validation failed
- `BAD_REQUEST`: Invalid request data

### Common Error Scenarios

#### User Errors

- **User not found**: Returns 404 with message indicating user ID not found
- **User already exists**: Returns 409 when trying to create user with existing `telegram_user_id`
- **Cannot block super admin**: Returns 409 when attempting to block a super admin
- **User already blocked**: Returns 409 when trying to block an already blocked user

#### Order Errors

- **Order not found**: Returns 404 with message indicating order ID not found
- **Cannot update when not open**: Returns 409 when trying to update order that is not in `'open'` status
- **Cannot cancel matched order**: Returns 409 when trying to cancel an order that is already matched

#### Offer Errors

- **Offer not found**: Returns 404 with message indicating offer ID not found
- **Cannot create for non-open order**: Returns 409 when trying to create offer for order that is not `'open'`
- **Maker/Taker ID mismatch**: Returns 400 when authenticated user doesn't match expected maker/taker

#### Deal Errors

- **Deal not found**: Returns 404 with message indicating deal ID not found
- **Cannot update completed deal**: Returns 409 when trying to update a completed deal
- **Can only approve pending**: Returns 409 when trying to approve deal that is not `'pending_admin'`
- **Can only complete in-progress**: Returns 409 when trying to complete deal that is not `'in_progress'`

#### Authentication Errors

- **API key missing**: Returns 401 with clear message about missing `x-api-key` header
- **API key invalid**: Returns 401 with message about invalid API key
- **KYC verification required**: Returns 401 with message explaining KYC approval is needed
- **Insufficient permissions**: Returns 403 with message about required roles

### Error Handling Best Practices

1. **Display Error Messages**: The `message` field is user-friendly and can be displayed directly to users
2. **Use Error Types**: Use the `type` field for conditional logic in your application
3. **Check Status Codes**: Use HTTP status codes for general error categorization
4. **Handle Validation Errors**: Validation errors include details about which fields failed validation
5. **Retry Logic**: For 500 errors, implement retry logic with exponential backoff

---

## Response Formats

### Success Responses

#### Single Resource Response

```typescript
{
  id: number;
  // ... resource-specific fields
  created_at: string;  // ISO 8601 date string
  updated_at: string;  // ISO 8601 date string
}
```

#### Paginated Response

```typescript
{
  data: T[];           // Array of resources
  page: number;        // Current page (1-based)
  limit: number;       // Items per page
  total: number;       // Total items
  totalPages: number;  // Total pages
  hasNext: boolean;    // Has next page
  hasPrev: boolean;    // Has previous page
}
```

### Data Types

- **IDs**: All IDs are returned as numbers (BigInt values are automatically serialized)
- **Dates**: All dates are returned as ISO 8601 strings (e.g., `"2025-01-27T12:00:00.000Z"`)
- **Decimals**: Decimal values (amounts, prices) are returned as numbers

---

## Common Workflows

### User Registration and KYC Flow

1. **Create User Account**:
   ```
   POST /users
   Headers: x-api-key
   Body: { telegram_user_id: 123456789, ... }
   ```
   - User is created with `role: 'user'`, `kyc_status: 'none'`, `status: 'active'`

2. **Submit KYC Application**:
   ```
   POST /users/me/kyc/submit
   Headers: x-api-key, x-telegram-user-id
   Body: { full_name: "John Doe", phone_number: "+1234567890" }
   ```
   - Sets `kyc_status` to `'pending'`
   - Sets `kyc_submitted_at` to current timestamp

3. **Check KYC Status**:
   ```
   GET /users/me/profile
   Headers: x-api-key, x-telegram-user-id
   ```
   - Returns user profile with current `kyc_status`

4. **Admin Reviews KYC** (Admin only):
   ```
   POST /users/:id/kyc/review
   Headers: x-api-key, x-telegram-user-id
   Body: { status: 'approved' }
   ```
   - Sets `kyc_status` to `'approved'` or `'rejected'`
   - Sets `kyc_reviewed_at` and `kyc_reviewed_by` automatically

### Order Creation and Trading Flow

1. **Create Order** (KYC required):
   ```
   POST /orders
   Headers: x-api-key, x-telegram-user-id
   Body: { side: 'sell', amount_usdt: 1000, price_per_unit: 55000, ... }
   ```
   - Order created with `status: 'open'`
   - `maker_id` set from authenticated user

2. **View Open Orders**:
   ```
   GET /orders/open?side=sell
   Headers: x-api-key
   ```

3. **Make Offer on Order** (KYC required):
   ```
   POST /order-offers
   Headers: x-api-key, x-telegram-user-id
   Body: { order_id: 1, price_per_unit: 54500, comment: "Can negotiate" }
   ```
   - Offer created with `status: 'pending_maker_decision'`
   - `taker_id` set from authenticated user

4. **Maker Reviews Offers**:
   ```
   GET /order-offers/order/1/pending
   Headers: x-api-key
   ```

5. **Maker Accepts Offer** (Creates Deal):
   ```
   POST /deals
   Headers: x-api-key, x-telegram-user-id
   Body: { order_id: 1, offer_id: 1 }
   ```
   - Deal created with `status: 'pending_admin'`
   - Order `status` set to `'matched'`
   - Offer `status` set to `'accepted_by_maker'`

6. **Maker Rejects Offer**:
   ```
   POST /order-offers/1/reject
   Headers: x-api-key, x-telegram-user-id
   ```
   - Offer `status` set to `'rejected_by_maker'`

7. **Admin Approves Deal** (Admin only):
   ```
   POST /deals/1/approve
   Headers: x-api-key, x-telegram-user-id
   ```
   - Deal `status` set to `'in_progress'`

8. **Admin Completes Deal** (Admin only):
   ```
   POST /deals/1/complete
   Headers: x-api-key, x-telegram-user-id
   ```
   - Deal `status` set to `'completed'`

### Order Cancellation Flow

1. **Cancel Order**:
   ```
   POST /orders/1/cancel
   Headers: x-api-key
   ```
   - Only works if `order.status === 'open'`
   - Sets `order.status` to `'canceled'`

2. **Cancel Offer** (Taker only):
   ```
   POST /order-offers/1/cancel
   Headers: x-api-key, x-telegram-user-id
   ```
   - Only works if `offer.status === 'pending_maker_decision'`
   - Sets `offer.status` to `'canceled_by_taker'`

3. **Cancel Deal** (Admin only):
   ```
   POST /deals/1/cancel
   Headers: x-api-key, x-telegram-user-id
   ```
   - Only works if `deal.status !== 'completed'` and `!== 'cancelled'`
   - Sets `deal.status` to `'cancelled'`

---

## Integration Guidelines

### Pagination

All list endpoints support pagination:

- Use `page` query parameter for page number (1-based, default: 1)
- Use `limit` query parameter for items per page (default: 10, max: 100)
- Response includes `hasNext` and `hasPrev` for navigation
- Response includes `total` and `totalPages` for display

**Example**:
```
GET /orders?page=2&limit=20
```

### Filtering

Many endpoints support filtering via query parameters:

- Check endpoint documentation for available filters
- Multiple filters can be combined
- Filters are case-sensitive for enum values

**Example**:
```
GET /orders?status=open&side=sell&page=1&limit=10
```

### Status Transitions

Entities have strict status transition rules:

**Order Status Flow**:
- `open` → `matched` (when deal is created)
- `open` → `canceled` (when canceled)

**Offer Status Flow**:
- `pending_maker_decision` → `accepted_by_maker` (when deal is created)
- `pending_maker_decision` → `rejected_by_maker` (when rejected)
- `pending_maker_decision` → `canceled_by_taker` (when canceled)

**Deal Status Flow**:
- `pending_admin` → `in_progress` (when approved by admin)
- `in_progress` → `completed` (when completed by admin)
- Any status → `cancelled` (when canceled by admin, except `completed`)

### Rate Limiting

Currently, no rate limiting is implemented. However, implement reasonable request rates in your application to avoid overwhelming the server.

### Best Practices

1. **Always Include API Key**: Include `x-api-key` header in every request
2. **Handle Errors Gracefully**: Display user-friendly error messages to end users
3. **Check KYC Status**: Verify user has `kyc_status: 'approved'` before allowing trading operations
4. **Validate Input**: Validate data on client side before sending requests
5. **Use Pagination**: Always use pagination for list endpoints to avoid large responses
6. **Cache When Appropriate**: Cache user profile and order data when appropriate
7. **Handle Network Errors**: Implement retry logic for network failures
8. **Log Errors**: Log errors for debugging while displaying user-friendly messages

### Testing

When `NODE_ENV !== 'production'`, Swagger documentation is available at:

- URL: `http://localhost:3000/api-docs`
- Interactive API testing interface
- Complete endpoint documentation

### Support

For API support, error reporting, or feature requests, contact the API administrator.

---

## Version

API Version: 1.0

Last Updated: 2025-01-27

