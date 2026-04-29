#!/bin/bash

# Test magazine creation with proper JSON

curl -X POST http://localhost:5174/api/magazines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d @- << 'EOF'
{
  "title": "Test Magazine April 2026",
  "issueNumber": "Vol 1",
  "coverImage": "https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=400&h=600&fit=crop",
  "pdfUrl": "https://example.com/magazine.pdf",
  "date": "2026-04-20",
  "pricePhysical": 499,
  "priceDigital": 0,
  "gatedPage": 2,
  "blurPaywall": true
}
EOF
