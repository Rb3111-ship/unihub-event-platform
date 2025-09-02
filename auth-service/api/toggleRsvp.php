<?php
require 'vendor/autoload.php';
require 'config.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
// -----------------------------------------
// Secure CORS setup 
$allowedOrigins = [
    "http://localhost:5000",
    "http://192.168.41.157:5000"  
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Vary: Origin");
}

header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
// -----------------------------------------

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(["error" => "Missing or invalid token"]);
    exit;
}

$jwt = $matches[1];

try {
    $decoded = JWT::decode($jwt, new Key($jwt_secret, $jwt_algorithm));
    $userId = $decoded->id;
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["error" => "Token verification failed"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$eventId = $data['eventId'] ?? '';

if (!$eventId) {
    http_response_code(400);
    echo json_encode(["error" => "Event ID missing"]);
    exit;
}

$user = $users->findOne(['_id' => new MongoDB\BSON\ObjectId($userId)]);

if (!$user) {
    http_response_code(404);
    echo json_encode(["error" => "User not found"]);
    exit;
}

$rsvpedEvents = $user['rsvpedEvents'] ?? [];
$isRsvped = in_array($eventId, $rsvpedEvents);

if ($isRsvped) {
    $rsvpedEvents = array_values(array_filter($rsvpedEvents, fn($id) => $id !== $eventId));
} else {
    $rsvpedEvents[] = $eventId;
}

$users->updateOne(
    ['_id' => new MongoDB\BSON\ObjectId($userId)],
    ['$set' => ['rsvpedEvents' => $rsvpedEvents]]
);

echo json_encode([
    "message" => $isRsvped ? "RSVP removed" : "RSVP added",
    "rsvpedEvents" => $rsvpedEvents,
    "interested" => !$isRsvped
]);
?>
