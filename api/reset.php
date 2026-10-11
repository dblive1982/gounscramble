<?php
require __DIR__ . '/_boot.php';
$in = read_post();
$token = (string)($in['token'] ?? '');
$pass = (string)($in['password'] ?? '');
if (!preg_match('/^[a-f0-9]{64}$/', $token)) out(422, ['error' => 'This reset link is not valid. Please ask for a new one.']);
if (strlen($pass) < 8 || strlen($pass) > 200) out(422, ['error' => 'Your password needs at least 8 characters.']);
throttle('reset', 10, 60);
note_attempt('reset');
$pdo = db();
$s = $pdo->prepare('SELECT r.id, r.user_id FROM resets r WHERE r.token_hash=? AND r.used=0 AND r.expires_at > NOW()');
$s->execute([hash('sha256', $token)]);
$r = $s->fetch();
if (!$r) out(422, ['error' => 'This reset link has expired. Please ask for a new one.']);
$pdo->prepare('UPDATE users SET pass_hash=? WHERE id=?')->execute([password_hash($pass, PASSWORD_DEFAULT), $r['user_id']]);
$pdo->prepare('UPDATE resets SET used=1 WHERE user_id=?')->execute([$r['user_id']]);
out(200, ['ok' => true]);
