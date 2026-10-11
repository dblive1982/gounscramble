<?php
require __DIR__ . '/_boot.php';
require __DIR__ . '/_mail.php';
$in = read_post();
$name = trim((string)($in['name'] ?? ''));
$email = clean_email((string)($in['email'] ?? ''));
$pass = (string)($in['password'] ?? '');
if ($name === '' || mb_strlen($name) > 60) out(422, ['error' => 'Please tell us what to call you.']);
if (!valid_email($email)) out(422, ['error' => 'Please enter a valid email address.']);
if (strlen($pass) < 8 || strlen($pass) > 200) out(422, ['error' => 'Your password needs at least 8 characters.']);
throttle('register', 10, 60);
note_attempt('register');
$pdo = db();
$s = $pdo->prepare('SELECT id FROM users WHERE email=?');
$s->execute([$email]);
if ($s->fetch()) out(409, ['error' => 'An account with that email already exists. Try signing in.']);
$pdo->prepare('INSERT INTO users (email, name, pass_hash, created_at, last_login) VALUES (?,?,?,NOW(),NOW())')
    ->execute([$email, $name, password_hash($pass, PASSWORD_DEFAULT)]);
$id = (int)$pdo->lastInsertId();
start_session();
session_regenerate_id(true);
$_SESSION['uid'] = $id;
$site = rtrim((config()['site'] ?? 'https://gounscramble.com'), '/');
$safe = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
gu_email($email, 'Welcome to GoUnscramble',
    'Welcome, ' . $name . '!',
    '<p style="margin:0 0 12px">Your free GoUnscramble account is ready. Type any jumbled letters to find every word they can make, or take a break with Sudoku, word search and more.</p>'
    . '<p style="margin:0">You signed up with this email address (' . htmlspecialchars($email, ENT_QUOTES, 'UTF-8') . '). If that was not you, you can ignore this message.</p>',
    "Your free GoUnscramble account is ready. Type any jumbled letters to find every word they can make, or take a break with Sudoku, word search and more.\n\nYou signed up with this email address ($email). If that was not you, you can ignore this message.",
    'Start unscrambling', $site . '/');
out(200, ['user' => ['name' => $name, 'email' => $email]]);
