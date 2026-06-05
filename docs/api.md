# TerraFlow API Reference

## Posts

### GET /api/v1/posts/search

Search posts by title, description, or tag.

**Query Parameters**

| Parameter | Type   | Required | Default | Description                        |
|-----------|--------|----------|---------|------------------------------------|
| q         | string | No       | —       | Full-text search on title/description |
| tag       | string | No       | —       | Filter by tag (case-insensitive)   |
| page      | number | No       | 1       | Page number (1-indexed)            |

**Response**

```json
{
  "posts": [
    {
      "id": "post-uuid",
      "title": "Eiffel Tower View",
      "description": "A beautiful sunset from the tower",
      "latitude": 48.8584,
      "longitude": 2.2945,
      "h3Index": "88268562d5fffff",
      "tags": ["travel", "paris"],
      "visibility": "PUBLIC",
      "createdAt": "2025-06-01T12:00:00.000Z",
      "user": {
        "id": "user-uuid",
        "username": "traveler",
        "name": "Jane Doe",
        "profilePic": "https://example.com/pic.jpg"
      },
      "media": [],
      "_count": { "likes": 12, "comments": 3 }
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20,
  "hasMore": true
}
```

---

### GET /api/v1/posts/explore

Explore posts within a geographic bounding box. Returns **clusters** at low zoom levels (≤ 9) and **individual posts** at higher zoom levels.

**Query Parameters**

| Parameter | Type   | Required | Default | Description                       |
|-----------|--------|----------|---------|-----------------------------------|
| minLat    | number | Yes      | —       | Minimum latitude of bounding box  |
| maxLat    | number | Yes      | —       | Maximum latitude of bounding box  |
| minLng    | number | Yes      | —       | Minimum longitude of bounding box |
| maxLng    | number | Yes      | —       | Maximum longitude of bounding box |
| zoom      | number | No       | 2       | Map zoom level                    |
| category  | string | No       | —       | Filter by tag category            |
| page      | number | No       | 1       | Page number (1-indexed)           |

**Response (Clusters — zoom ≤ 9)**

```json
{
  "type": "CLUSTERS",
  "clusters": [
    {
      "h3Index": "82268ffffffffff",
      "latitude": 48.86,
      "longitude": 2.34,
      "count": 15,
      "postSample": { "id": "post-uuid", "title": "..." }
    }
  ],
  "total": 120,
  "page": 1,
  "limit": 50,
  "hasMore": true
}
```

**Response (Posts — zoom > 9)**

```json
{
  "type": "POSTS",
  "posts": [
    {
      "id": "post-uuid",
      "title": "Eiffel Tower View",
      "description": "A beautiful sunset from the tower",
      "latitude": 48.8584,
      "longitude": 2.2945,
      "tags": ["travel", "paris"],
      "createdAt": "2025-06-01T12:00:00.000Z",
      "user": {
        "username": "traveler",
        "name": "Jane Doe",
        "profilePic": null
      },
      "media": []
    }
  ],
  "total": 60,
  "page": 2,
  "limit": 50,
  "hasMore": false
}
```

---

## Pagination Fields

All paginated endpoints return a consistent set of pagination metadata:

| Field   | Type    | Description                                              |
|---------|---------|----------------------------------------------------------|
| total   | number  | Total number of matching records (from a `COUNT` query)  |
| page    | number  | Current page number (1-indexed)                          |
| limit   | number  | Maximum number of records returned per page              |
| hasMore | boolean | `true` if there are additional pages beyond the current one |

**`hasMore` is computed as:** `skip + limit < total` where `skip = (page - 1) * limit`.
