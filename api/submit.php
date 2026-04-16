<?php
/**
 * Обработчик формы обратной связи
 * ООО "Волга-Днепр Инжиниринг"
 */

define('CSRF_TOKEN_SESSION_KEY', 'csrf_token');
define('RATE_LIMIT_WINDOW', 60);
define('RATE_LIMIT_MAX_REQUESTS', 5);
define('MAX_FILE_SIZE', 10 * 1024 * 1024);
define('ALLOWED_FILE_TYPES', ['pdf', 'doc', 'docx', 'xls', 'xlsx']);
define('ALLOWED_MIME_TYPES', [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Access-Control-Allow-Origin: https://vdengineering.ru');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

session_start([
    'cookie_httponly' => true,
    'cookie_secure' => true,
    'cookie_samesite' => 'Strict',
    'use_strict_mode' => true
]);

function generateCsrfToken() {
    if (function_exists('random_bytes')) {
        return bin2hex(random_bytes(32));
    }
    return bin2hex(openssl_random_pseudo_bytes(32));
}

function validateCsrfToken($token) {
    if (!isset($_SESSION[CSRF_TOKEN_SESSION_KEY])) {
        return false;
    }
    return hash_equals($_SESSION[CSRF_TOKEN_SESSION_KEY], $token);
}

if (!isset($_SESSION[CSRF_TOKEN_SESSION_KEY])) {
    $_SESSION[CSRF_TOKEN_SESSION_KEY] = generateCsrfToken();
}

$csrfToken = isset($_SERVER['HTTP_X_CSRF_TOKEN']) ? $_SERVER['HTTP_X_CSRF_TOKEN'] : ($_POST['csrf_token'] ?? '');

if (!validateCsrfToken($csrfToken)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Invalid CSRF token']);
    exit();
}

function checkRateLimit($ip) {
    $file = sys_get_temp_dir() . '/rate_limit_' . md5($ip);
    $now = time();
    if (file_exists($file)) {
        $data = json_decode(file_get_contents($file), true);
        if ($data && ($now - $data['start_time']) < RATE_LIMIT_WINDOW) {
            if ($data['count'] >= RATE_LIMIT_MAX_REQUESTS) {
                return false;
            }
            $data['count']++;
            file_put_contents($file, json_encode($data));
            return true;
        }
    }
    file_put_contents($file, json_encode(['start_time' => $now, 'count' => 1]));
    return true;
}

$clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
if (!checkRateLimit($clientIp)) {
    http_response_code(429);
    echo json_encode(['success' => false, 'error' => 'Too many requests']);
    exit();
}

function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    $data = strip_tags(trim($data));
    $data = htmlspecialchars($data, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    return $data;
}

function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function validatePhone($phone) {
    $clean = preg_replace('/[^0-9]/', '', $phone);
    return strlen($clean) >= 10 && strlen($clean) <= 11;
}

$requiredFields = ['companyName', 'contactPerson', 'email', 'phone', 'taskDescription'];
$errors = [];
$data = [];

foreach ($requiredFields as $field) {
    if (!isset($_POST[$field]) || empty(trim($_POST[$field]))) {
        $errors[] = "Field {$field} is required";
    } else {
        $data[$field] = sanitizeInput($_POST[$field]);
    }
}

if (isset($data['email']) && !validateEmail($data['email'])) {
    $errors[] = 'Invalid email';
}

if (isset($data['phone']) && !validatePhone($data['phone'])) {
    $errors[] = 'Invalid phone';
}

if (isset($_POST['hp_website']) && !empty($_POST['hp_website'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Suspicious activity']);
    exit();
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit();
}

$uploadedFiles = [];
if (!empty($_FILES['attachments'])) {
    $files = $_FILES['attachments'];
    $uploadDir = __DIR__ . '/../uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    $htaccessContent = "Options -ExecCGI\nAddHandler cgi-script .php .pl .py .sh .exe\n<FilesMatch \"\.(php|pl|py|sh|exe)$\">\nRequire all denied\n</FilesMatch>";
    file_put_contents($uploadDir . '.htaccess', $htaccessContent);
    
    foreach ($files['name'] as $key => $name) {
        if ($files['error'][$key] !== UPLOAD_ERR_OK) continue;
        if ($files['size'][$key] > MAX_FILE_SIZE) {
            $errors[] = "File {$name} exceeds size limit";
            continue;
        }
        $extension = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        if (!in_array($extension, ALLOWED_FILE_TYPES)) {
            $errors[] = "Invalid file type: {$name}";
            continue;
        }
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $files['tmp_name'][$key]);
        finfo_close($finfo);
        if (!in_array($mimeType, ALLOWED_MIME_TYPES)) {
            $errors[] = "MIME type mismatch: {$name}";
            continue;
        }
        $safeName = uniqid('file_', true) . '.' . $extension;
        $destination = $uploadDir . $safeName;
        if (!move_uploaded_file($files['tmp_name'][$key], $destination)) {
            $errors[] = "Upload error: {$name}";
            continue;
        }
        $uploadedFiles[] = [
            'original_name' => sanitizeInput($name),
            'saved_name' => $safeName,
            'size' => $files['size'][$key],
            'mime_type' => $mimeType
        ];
    }
}

if (!empty($errors)) {
    foreach ($uploadedFiles as $file) {
        @unlink($uploadDir . $file['saved_name']);
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit();
}

$logEntry = sprintf("[%s] Form submission from IP: %s, Company: %s, Files: %d\n", date('Y-m-d H:i:s'), $clientIp, $data['companyName'] ?? 'unknown', count($uploadedFiles));
file_put_contents(__DIR__ . '/../logs/form_submissions.log', $logEntry, FILE_APPEND);

$newCsrfToken = generateCsrfToken();
$_SESSION[CSRF_TOKEN_SESSION_KEY] = $newCsrfToken;

echo json_encode(['success' => true, 'message' => 'Form submitted successfully', 'csrf_token' => $newCsrfToken]);
