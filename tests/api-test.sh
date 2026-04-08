#!/bin/bash

# API Test Script for Super Admin Backend
# Usage: ./tests/api-test.sh

BASE_URL="http://localhost"
TOKEN=""

echo "=== Hospital Management System API Tests ==="
echo ""

# Test 1: Health Check
echo "1. Testing Health Check..."
curl -s -X GET "$BASE_URL/api/health" | jq '.'
echo ""

# Test 2: Login (should fail - no credentials)
echo "2. Testing Login (invalid credentials)..."
curl -s -X POST "$BASE_URL/api/platform/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@example.com","password":"wrong"}' | jq '.'
echo ""

# Test 3: Login (valid credentials)
echo "3. Testing Login (valid credentials)..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/platform/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')
echo "$LOGIN_RESPONSE" | jq '.'
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')
echo "Token: $TOKEN"
echo ""

# Test 4: Access without token (should fail)
echo "4. Testing Hospital List without token (should fail)..."
curl -s -X GET "$BASE_URL/api/platform/admin/hospitals" | jq '.'
echo ""

# Test 5: Access with token (should succeed)
echo "5. Testing Hospital List with token (should succeed)..."
curl -s -X GET "$BASE_URL/api/platform/admin/hospitals" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 6: Dashboard
echo "6. Testing Dashboard..."
curl -s -X GET "$BASE_URL/api/platform/admin/dashboard" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 7: Create Hospital
echo "7. Testing Create Hospital..."
curl -s -X POST "$BASE_URL/api/platform/admin/hospitals" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Hospital",
    "email": "test@hospital.com",
    "phone": "1234567890",
    "address_line1": "123 Test Street",
    "city": "Test City",
    "state": "Test State",
    "country": "India"
  }' | jq '.'
echo ""

echo "=== Tests Complete ==="
