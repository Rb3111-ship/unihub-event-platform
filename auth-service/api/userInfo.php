<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);



require 'vendor/autoload.php';
require 'config.php';

use Firebase\JWT\JWT;

// header("Access-Control-Allow-Origin: http://localhost:5000");
//------------------------------------------------------------------
$allowedOrigins = [
    "http://localhost:5000",
    "http://192.168.41.157:5000"  // 👈 replace with your laptop’s IP
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Vary: Origin");
}
//------------------------------------------------------------------
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json");

file_put_contents('log.txt', "Reached userinfo.php\n", FILE_APPEND);


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Accept both GET and POST input
$input = $_SERVER['REQUEST_METHOD'] === 'GET' ? $_GET : json_decode(file_get_contents("php://input"), true);
$userId = $input['id'] ?? '';

if (!$userId) {
    http_response_code(400);
    echo json_encode(["error" => "User ID required"]);
    exit;
}
file_put_contents('log.txt', "User ID: " . $userId . "\n", FILE_APPEND);

try {
    $user = $users->findOne(['_id' => new MongoDB\BSON\ObjectId($userId)]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid user ID format"]);
    exit;
}

if (!$user) {
    http_response_code(404);
    echo json_encode(["error" => "User not found"]);
    exit;
}
file_put_contents('log.txt', "User ID: " . $userId . "\n", FILE_APPEND);

$tokenPayload = [
    "id" => (string)$user['_id'],
    "name" => $user['name'],
    "email" => $user['email'],
    "role" => $user['role'],
    "iat" => time(),
    "exp" => time() + 3600 // 1 hour
];

$jwt = JWT::encode($tokenPayload, $jwt_secret, $jwt_algorithm);

echo json_encode([
    "token" => $jwt,
    "user" => [
        "id" => (string)$user['_id'],
        "name" => $user['name'],
        "email" => $user['email'],
        "role" => $user['role']
    ]
]);
?>
