<?php 
require 'config.php';
header("Access-Control-Allow-Origin: http://localhost:5000");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$name = $data['name'] ?? ''; // Single full name field
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';
$role = $data['role'] ?? 'user';

error_log(json_encode($data));


if (!$name || !$email || !$password) {
    http_response_code(400);
    echo json_encode(["error" => "All fields required"]);
    exit;
}

$existing = $users->findOne(['email' => $email]);
if ($existing) {
    http_response_code(409);
    echo json_encode(["error" => "Email already registered"]);
    exit;
}

$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

$insertResult = $users->insertOne([
    "name" => $name,
    "email" => $email,
    "password" => $hashedPassword,
    "role" => $role
]);

echo json_encode(["message" => "User registered successfully"]);
?>
