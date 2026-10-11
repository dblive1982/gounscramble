<?php
require __DIR__ . '/_boot.php';
$c = config();
if (!$c) out(200, ['user' => null, 'enabled' => false]);
start_session();
$user = null;
if (!empty($_SESSION['uid'])) {
    $s = db()->prepare('SELECT name, email FROM users WHERE id=?');
    $s->execute([$_SESSION['uid']]);
    $r = $s->fetch();
    if ($r) $user = public_user($r); else unset($_SESSION['uid']);
}
out(200, ['user' => $user, 'enabled' => true, 'google' => !empty($c['google_client_id']), 'google_id' => $c['google_client_id'] ?? '']);
