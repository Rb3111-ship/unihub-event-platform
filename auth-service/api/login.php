<?php
require 'vendor/autoload.php';
require 'config.php';
use Firebase\JWT\JWT;
//------------------------------------------------------------------
$allowedOrigins = [
    "http://localhost:5000",
    "http://192.168.41.157:5000"  
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Vary: Origin");
}
//------------------------------------------------------------------


header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}


$data = json_decode(file_get_contents("php://input"), true);
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

error_log(json_encode($data));

$user = $users->findOne(['email' => $email]);

if (!$user || !password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode(["error" => "Invalid credentials"]);
    exit;
}

$tokenPayload = [
    "id" => (string)$user['_id'],
    "name" => $user['name'],
    "email" => $user['email'],
    "role" => $user['role'],
    "iat" => time(),
    "exp" => time() + 3600 // 1 hour expiry
];

error_log(json_encode($tokenPayload));

$jwt = JWT::encode($tokenPayload, $jwt_secret, $jwt_algorithm);

echo json_encode([
    "token" => $jwt,
    "user" => [
        "id" => (string)$user['_id'],
        "name" => $tokenPayload['name'],
        "email" => $tokenPayload['email'],
        "role" => $tokenPayload['role'],
        "rsvpedEvents" => $user['rsvpedEvents'] ?? []
    ]
]);

?>
