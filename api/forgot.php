<?php
require __DIR__ . '/_boot.php';
require __DIR__ . '/_mail.php';
$in = read_post();
$email = clean_email((string)($in['email'] ?? ''));
if (!valid_email($email)) out(422, ['error' => 'Please enter a valid email address.']);
throttle('forgot', 5, 60);
note_attempt('forgot');
$pdo = db();
$s = $pdo->prepare('SELECT id, name FROM users WHERE email=?');
$s->execute([$email]);
$u = $s->fetch();
if ($u) {
    $token = bin2hex(random_bytes(32));
    $pdo->prepare('INSERT INTO resets (user_id, token_hash, expires_at) VALUES (?,?,NOW() + INTERVAL 1 HOUR)')
        ->execute([$u['id'], hash('sha256', $token)]);
    $c = config();
    $site = rtrim($c['site'] ?? 'https://gounscramble.com', '/');
    $link = $site . '/account.html?reset=' . $token;
    gu_email($email, 'Reset your GoUnscramble password',
        'Choose a new password',
        '<p style="margin:0 0 12px">Hi ' . htmlspecialchars($u['name'], ENT_QUOTES, 'UTF-8') . ', tap the button to choose a new GoUnscramble password. The link works for one hour.</p>'
        . '<p style="margin:0">If you did not ask for this, you can ignore this email and your password will stay the same.</p>',
        'Hi ' . $u['name'] . ", use this link to choose a new GoUnscramble password. It works for one hour.\n\nIf you did not ask for this, you can ignore this email.",
        'Choose a new password', $link);
}
// Same answer whether or not the email has an account.
out(200, ['ok' => true]);
