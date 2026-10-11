<?php
require __DIR__ . '/_boot.php';
$in = read_post();
$email = clean_email((string)($in['email'] ?? ''));
$pass = (string)($in['password'] ?? '');
if (!valid_email($email) || $pass === '') out(422, ['error' => 'Please enter your email and password.']);
throttle('login', 8, 15);
$pdo = db();
$s = $pdo->prepare('SELECT id, name, email, pass_hash FROM users WHERE email=?');
$s->execute([$email]);
$u = $s->fetch();
// Always run a hash check so a wrong email takes as long as a wrong password.
$hash = ($u && $u['pass_hash']) ? $u['pass_hash'] : password_hash('not-a-real-password', PASSWORD_DEFAULT);
$ok = password_verify($pass, $hash) && $u && $u['pass_hash'];
$ok = (bool)$ok;
if (!$ok) {
    note_attempt('login');
    out(401, ['error' => 'That email and password do not match.']);
}
if (password_needs_rehash($u['pass_hash'], PASSWORD_DEFAULT)) {
    $pdo->prepare('UPDATE users SET pass_hash=? WHERE id=?')->execute([password_hash($pass, PASSWORD_DEFAULT), $u['id']]);
}
$pdo->prepare('UPDATE users SET last_login=NOW() WHERE id=?')->execute([$u['id']]);
start_session();
session_regenerate_id(true);
$_SESSION['uid'] = (int)$u['id'];
out(200, ['user' => public_user($u)]);
