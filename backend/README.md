# HMS Backend - Database Connection Guide

## Database Configuration

The project uses a centralized database connection file located at:
```
backend/config/db_connect.php
```

### Configuration Details
- **Host**: localhost
- **Database**: hms
- **User**: root
- **Password**: (empty)
- **Connection Type**: mysqli
- **Charset**: utf8mb4

## How to Use

### Method 1: Include and Use (Recommended)
```php
<?php
// Include the connection file
$conn = require_once '../config/db_connect.php';

// Use the connection
$result = $conn->query("SELECT * FROM doctors");

// Close when done
$conn->close();
?>
```

### Method 2: Include Without Return
```php
<?php
include '../config/db_connect.php';

// $conn is now available
$result = $conn->query("SELECT * FROM patients");
?>
```

## Example API Structure

```php
<?php
header('Content-Type: application/json');

// Include database
$conn = require_once '../config/db_connect.php';

try {
    // Your query
    $sql = "SELECT * FROM appointments WHERE date = CURDATE()";
    $result = $conn->query($sql);
    
    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => ['message' => 'Server error']
    ]);
}

$conn->close();
?>
```

## Error Handling

The connection file automatically:
- Returns JSON error if connection fails
- Sets HTTP 500 status code on failure
- Logs errors to PHP error log
- Exits script on connection failure

## Security Notes

1. Never expose database credentials in frontend code
2. Always use prepared statements for user input:
```php
$stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
```

3. Always close connections when done
4. Use `htmlspecialchars()` when displaying data in HTML

## Folder Structure

```
HMS/
├── backend/
│   ├── config/
│   │   └── db_connect.php       # Database connection
│   ├── api/
│   │   ├── example_api.php      # Example API
│   │   ├── doctors.php          # Doctor APIs
│   │   └── appointments.php     # Appointment APIs
│   └── README.md                # This file
├── frontend/
│   └── doctor/
└── database/
    └── schema.sql
```

## Testing Connection

Create a test file:
```php
<?php
$conn = require_once 'config/db_connect.php';
echo json_encode(['success' => true, 'message' => 'Connected successfully']);
$conn->close();
?>
```

Access: `http://localhost/HMS/backend/test_connection.php`
