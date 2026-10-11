<?php
require __DIR__ . '/_boot.php';
read_post();
start_session();
$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $p = session_get_cookie_params();
    setcookie(session_name(), '', time() - 3600, $p['path'], $p['domain'], true, true);
}
session_destroy();
out(200, ['ok' => true]);
