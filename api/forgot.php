<?php
require __DIR__ . '/_boot.php';
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
    $from = $c['mail_from'] ?? 'noreply@gounscramble.com';
    $link = $site . '/account.html?reset=' . $token;
    $body = "Hi " . $u['name'] . ",\n\nUse this link to choose a new GoUnscramble password. It works for one hour:\n\n" . $link . "\n\nIf you did not ask for this, you can ignore this email.\n";
    @mail($email, 'Reset your GoUnscramble password', $body, "From: GoUnscramble <$from>\r\nContent-Type: text/plain; charset=utf-8");
}
// Same answer whether or not the email has an account.
out(200, ['ok' => true]);
