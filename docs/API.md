# 📚 API Documentation - Smart Pest Doctor

Complete REST API documentation for Smart Pest Doctor backend.

**Base URL:** `http://localhost:4000` (development) or `https://your-api.railway.app` (production)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Disease Detection](#disease-detection)
3. [Treatment Recommendations](#treatment-recommendations)
4. [Expert System](#expert-system)
5. [Shop & Orders](#shop--orders)
6. [Timeline](#timeline)
7. [Weather & Alerts](#weather--alerts)
8. [Feedback](#feedback)
9. [Error Handling](#error-handling)

---

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

### Send OTP

Send OTP to phone number for authentication.

**Endpoint:** `POST /api/auth/send-otp`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "phone": "+919876543210"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otp": "123456"  // Only in development mode
}
```

**Errors:**
- `400` - Invalid phone format
- `429` - Too many requests (rate limited)
- `500` - Server error

---

### Verify OTP

Verify OTP and receive JWT token.

**Endpoint:** `POST /api/auth/verify-otp`

**Request Body:**
```json
{
  "phone": "+919876543210",
  "otp": "123456",
  "name": "Farmer Name"  // Optional, for new users
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Farmer Name",
    "phone": "+919876543210",
    "email": null,
    "language": "en",
    "role": "farmer",
    "profileImage": null,
    "verified": true
  }
}
```

**Errors:**
- `400` - Missing phone or OTP
- `401` - Invalid OTP
- `500` - Server error

---

## Disease Detection

### Detect Disease from Image

Upload crop image for AI-powered disease detection.

**Endpoint:** `POST /api/detect`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (multipart):**
```
image: <file> (JPEG, PNG, WebP, max 10MB)
fieldId: 1 (optional)
```

**Response:** `200 OK`
```json
{
  "reportId": 42,
  "disease": "Tomato Late Blight",
  "confidence": 94.5,
  "severity": "high",
  "crop": "Tomato",
  "imageUrl": "https://res.cloudinary.com/.../image.jpg",
  "overlayUrl": null,
  "expertCaseCreated": false,
  "allPredictions": [
    {
      "disease": "Tomato Late Blight",
      "crop": "Tomato",
      "confidence": "94.50"
    },
    {
      "disease": "Tomato Early Blight",
      "crop": "Tomato",
      "confidence": "3.20"
    }
  ],
  "timestamp": "2025-10-22T10:30:00.000Z"
}
```

**Rate Limit:** 20 requests per hour per user

**Notes:**
- If confidence < 80%, an expert case is automatically created
- Severity levels: `low`, `moderate`, `high`

---

## Treatment Recommendations

### Get Treatment Plan

Get AI-generated treatment recommendations for a disease.

**Endpoint:** `POST /api/treatment`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "disease": "Tomato Late Blight",
  "crop": "Tomato",
  "severity": "high",
  "language": "en",
  "preferences": ["organic", "chemical"]
}
```

**Response:** `200 OK`
```json
{
  "organic": [
    {
      "method": "Neem Oil Spray",
      "description": "Mix 5ml neem oil with 1 liter of water...",
      "frequency": "Every 7-10 days",
      "duration": "3-4 weeks"
    }
  ],
  "chemical": [
    {
      "name": "Mancozeb 75% WP",
      "dosage": "2-2.5 grams per liter of water",
      "applicationMethod": "Foliar spray covering all plant parts",
      "waitingPeriod": "7 days before harvest",
      "ppe": ["Gloves", "Face mask", "Goggles", "Long-sleeved shirt"]
    }
  ],
  "precautions": [
    "Do not spray during flowering",
    "Avoid windy conditions",
    "Consult licensed agronomist"
  ],
  "preventiveMeasures": [
    "Maintain proper plant spacing",
    "Remove infected plant parts"
  ],
  "monitoringTips": [
    "Inspect plants every 2-3 days",
    "Check undersides of leaves"
  ],
  "disclaimer": "IMPORTANT: Consult a licensed agronomist...",
  "voiceSummary": "Treatment options: Organic methods include...",
  "language": "en",
  "timestamp": "2025-10-22T10:35:00.000Z"
}
```

**Supported Languages:** `en`, `hi`, `te`, `ta`, `mr`, `bn`

---

## Expert System

### Create Expert Case

Create a new expert consultation case.

**Endpoint:** `POST /api/expert/send`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "reportId": 42,
  "message": "Need urgent help with diagnosis",
  "priority": "high"  // low, medium, high, critical
}
```

**Response:** `200 OK`
```json
{
  "caseId": 15,
  "status": "open",
  "priority": "high",
  "createdAt": "2025-10-22T10:40:00.000Z"
}
```

---

### Get Expert Cases (Experts Only)

Get list of expert cases. Only accessible by users with `expert` or `admin` role.

**Endpoint:** `GET /api/expert/cases`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
```
status: open (optional) - Filter by status: open, assigned, in_progress, resolved, closed, all
limit: 20 (optional) - Number of results
offset: 0 (optional) - Pagination offset
```

**Response:** `200 OK`
```json
{
  "cases": [
    {
      "id": 15,
      "status": "open",
      "priority": "high",
      "createdAt": "2025-10-22T10:40:00.000Z",
      "report": {
        "id": 42,
        "diseaseName": "Tomato Late Blight",
        "confidence": 75.2,
        "imageUrl": "..."
      },
      "farmer": {
        "id": 1,
        "name": "Farmer Name",
        "phone": "+919876543210"
      }
    }
  ],
  "total": 5
}
```

---

### Reply to Expert Case

Send a message in an expert case.

**Endpoint:** `POST /api/expert/cases/:id/reply`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (multipart):**
```
messageText: "Try applying neem oil..." (required)
media: <file> (optional) - Image or voice note
```

**Response:** `200 OK`
```json
{
  "message": {
    "id": 45,
    "messageType": "text",
    "messageText": "Try applying neem oil...",
    "mediaUrl": null,
    "createdAt": "2025-10-22T10:45:00.000Z"
  }
}
```

**Rate Limit:** 100 messages per day per user

---

## Shop & Orders

### List Products

Get list of available products.

**Endpoint:** `GET /api/products`

**Query Parameters:**
```
category: fungicide (optional) - Filter by category
search: neem (optional) - Search in name, description, brand
page: 1 (default: 1)
limit: 20 (default: 20)
featured: true (optional) - Show only featured products
```

**Response:** `200 OK`
```json
{
  "products": [
    {
      "id": 1,
      "name": "Mancozeb 75% WP Fungicide",
      "brand": "Dhanuka",
      "category": "fungicide",
      "description": "Broad-spectrum fungicide...",
      "priceCents": 42000,
      "gstPercent": 18,
      "stockQty": 150,
      "unit": "kg",
      "imageUrl": "https://...",
      "rating": 4.5,
      "reviewCount": 234,
      "active": true,
      "featured": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

**Categories:** `fungicide`, `insecticide`, `herbicide`, `fertilizer`, `organic`, `equipment`

---

### Create Order

Create a new order.

**Endpoint:** `POST /api/orders`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 5,
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "name": "Farmer Name",
    "phone": "+919876543210",
    "address": "123 Farm Road, Village",
    "city": "Delhi",
    "state": "Delhi",
    "pincode": "110001"
  },
  "paymentMethod": "razorpay"  // razorpay, cod
}
```

**Response:** `200 OK`
```json
{
  "orderId": 100,
  "orderNumber": "ORD-2025-123456",
  "total": 926.40,  // In rupees (paise converted)
  "status": "pending"
}
```

**Rate Limit:** 10 orders per hour per user

---

### Get Order Status

Get details of a specific order.

**Endpoint:** `GET /api/orders/:orderNumber`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "orderNumber": "ORD-2025-123456",
  "status": "shipped",
  "paymentStatus": "success",
  "items": [
    {
      "productId": 1,
      "name": "Mancozeb 75% WP",
      "quantity": 2,
      "priceCents": 42000,
      "total": 84000
    }
  ],
  "total": 926.40,
  "trackingNumber": "TRACK123456",
  "estimatedDelivery": "2025-10-25T00:00:00.000Z",
  "createdAt": "2025-10-22T11:00:00.000Z"
}
```

**Order Statuses:** `pending`, `placed`, `confirmed`, `packed`, `shipped`, `delivered`, `cancelled`, `refunded`

---

## Timeline

### Get User Timeline

Get diagnosis history and timeline for a user.

**Endpoint:** `GET /api/timeline/:userId`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
```
fieldId: 1 (optional) - Filter by specific field
```

**Response:** `200 OK`
```json
{
  "reports": [
    {
      "id": 42,
      "date": "2025-10-22T10:30:00.000Z",
      "disease": "Tomato Late Blight",
      "crop": "Tomato",
      "severity": "high",
      "confidence": 94.5,
      "imageUrl": "https://...",
      "recoveryScore": 65,
      "notes": "Applied treatment as recommended"
    }
  ],
  "stats": {
    "totalReports": 12,
    "highSeverity": 3,
    "avgConfidence": 89.3
  }
}
```

**Note:** Users can only access their own timeline unless they are admins.

---

## Weather & Alerts

### Get Weather and Pest Risk

Get current weather, forecast, and pest outbreak risk for a location.

**Endpoint:** `GET /api/weather/:lat/:lon`

**Headers:**
```
Authorization: Bearer <token>
```

**Example:** `GET /api/weather/28.7041/77.1025`

**Response:** `200 OK`
```json
{
  "location": {
    "lat": 28.7041,
    "lon": 77.1025,
    "region": "Delhi"
  },
  "current": {
    "temp": 32.5,
    "humidity": 78,
    "conditions": "Partly Cloudy",
    "windSpeed": 12.5
  },
  "forecast": [
    {
      "date": "2025-10-23",
      "maxTemp": 34,
      "minTemp": 22,
      "humidity": 75,
      "rainfall": 0
    }
  ],
  "pestRisk": {
    "level": "moderate",
    "score": 65,
    "factors": {
      "humidity": "high",
      "temperature": "optimal",
      "recentReports": 3
    },
    "recommendations": [
      "Monitor crops closely",
      "Consider preventive measures"
    ]
  },
  "alerts": [
    {
      "id": 10,
      "pest": "Late Blight Outbreak",
      "risk": "high",
      "message": "High humidity detected..."
    }
  ]
}
```

**Risk Levels:** `low`, `moderate`, `high`, `critical`

---

## Feedback

### Submit Feedback

Submit user feedback.

**Endpoint:** `POST /api/feedback`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "bug",  // bug, feature, improvement, other
  "message": "The detection is too slow...",
  "rating": 4  // 1-5 stars, optional
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Thank you for your feedback!"
}
```

---

## Error Handling

All API endpoints follow a consistent error response format.

### Error Response Format

```json
{
  "error": "ErrorType",
  "message": "Human-readable error message",
  "timestamp": "2025-10-22T10:00:00.000Z"
}
```

### Common HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input or validation error |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | External service error (e.g., AI model loading) |

### Example Error Responses

#### 400 Bad Request
```json
{
  "error": "Validation Error",
  "message": "Phone number is required",
  "timestamp": "2025-10-22T10:00:00.000Z"
}
```

#### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "timestamp": "2025-10-22T10:00:00.000Z"
}
```

#### 429 Too Many Requests
```json
{
  "error": "Too Many Requests",
  "message": "Too many authentication attempts. Please try again after 15 minutes.",
  "retryAfter": "2025-10-22T10:15:00.000Z"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Server Error",
  "message": "Failed to detect disease",
  "timestamp": "2025-10-22T10:00:00.000Z"
}
```

---

## Rate Limits

| Endpoint Pattern | Limit | Window |
|-----------------|-------|--------|
| `/api/auth/*` | 5 requests | 15 minutes |
| `/api/detect` | 20 requests | 1 hour |
| `/api/expert/*/reply` | 100 requests | 24 hours |
| `/api/orders` (POST) | 10 requests | 1 hour |
| All other endpoints | 100 requests | 15 minutes |

When rate limited, the response includes a `retryAfter` timestamp.

---

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
```
page: 1 (default: 1) - Page number
limit: 20 (default: 20, max: 100) - Items per page
```

**Response includes:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## Data Types

### Enums

**User Roles:**
- `farmer` - Regular farmer user
- `expert` - Agricultural expert
- `admin` - System administrator

**Disease Severity:**
- `low` - Minor issue, preventive action
- `moderate` - Requires attention
- `high` - Urgent treatment needed

**Order Status:**
- `pending` - Order created, payment pending
- `placed` - Payment successful
- `confirmed` - Order confirmed by seller
- `packed` - Order packed
- `shipped` - In transit
- `delivered` - Successfully delivered
- `cancelled` - Order cancelled
- `refunded` - Payment refunded

**Product Category:**
- `fungicide` - Fungal disease control
- `insecticide` - Insect pest control
- `herbicide` - Weed control
- `fertilizer` - Plant nutrition
- `organic` - Organic/natural products
- `equipment` - Farm equipment and tools

---

## Testing

Import the Postman collection from `postman/Smart-Pest-Doctor.postman_collection.json`

Or use curl:

```bash
# Health check
curl http://localhost:4000/health

# Send OTP
curl -X POST http://localhost:4000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210"}'

# Verify OTP (dev mode)
curl -X POST http://localhost:4000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210","otp":"123456"}'

# Detect disease (replace TOKEN)
curl -X POST http://localhost:4000/api/detect \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@/path/to/crop.jpg"
```

---

## Webhooks (Future)

Coming soon: Webhooks for order updates, expert replies, and alerts.

---

## Versioning

Current API version: **v1**

Future versions will be accessible via: `/api/v2/...`

---

## Support

- **Issues:** https://github.com/yourusername/smart-pest-doctor/issues
- **Email:** api-support@smartpestdoctor.com
- **Docs:** https://docs.smartpestdoctor.com

---

**Last Updated:** October 22, 2025
