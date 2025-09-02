<?php
require 'vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Dotenv\Dotenv;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

$mongo = new MongoDB\Client($_ENV['MONGO_URI']);
$db = $mongo->selectDatabase($_ENV['DB_NAME']);
$users = $db->users;

// JWT
$jwt_secret = $_ENV['JWT_SECRET'];
$jwt_algorithm = "HS256";
?>