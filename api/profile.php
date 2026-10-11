<?php
require __DIR__ . '/_boot.php';
if (!config()) out(200, ['user' => null]);
start_session();
if (empty($_SESSION['uid'])) out(200, ['user' => null]);
$uid = (int)$_SESSION['uid'];
$pdo = db();

function load_profile(PDO $pdo, int $uid): array {
    $s = $pdo->prepare('SELECT u.name, u.email, u.created_at, p.bio, p.location, p.fav, p.avatar
        FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id=?');
    $s->execute([$uid]);
    $r = $s->fetch() ?: [];
    return [
        'name' => $r['name'] ?? '', 'email' => $r['email'] ?? '',
        'since' => isset($r['created_at']) ? substr($r['created_at'], 0, 10) : '',
        'bio' => $r['bio'] ?? '', 'location' => $r['location'] ?? '', 'fav' => $r['fav'] ?? '',
        'avatar' => $r['avatar'] ?? null,
    ];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') out(200, ['profile' => load_profile($pdo, $uid)]);

$in = read_post();
$name = trim((string)($in['name'] ?? ''));
$bio = trim((string)($in['bio'] ?? ''));
$loc = trim((string)($in['location'] ?? ''));
$fav = trim((string)($in['fav'] ?? ''));
if ($name === '' || mb_strlen($name) > 60) out(400, ['error' => 'Please enter a display name (up to 60 characters).']);
if (mb_strlen($bio) > 280) out(400, ['error' => 'Your bio can be up to 280 characters.']);
if (mb_strlen($loc) > 80) out(400, ['error' => 'Location can be up to 80 characters.']);
if (mb_strlen($fav) > 40) out(400, ['error' => 'Favourite game can be up to 40 characters.']);

$cur = load_profile($pdo, $uid);
$avatar = $cur['avatar'];
if (array_key_exists('avatar', $in)) {
    $a = $in['avatar'];
    if ($a === null || $a === '') $avatar = null;
    elseif (is_string($a) && strlen($a) <= 90000 && preg_match('#^data:image/jpeg;base64,[A-Za-z0-9+/=]+$#', $a)) $avatar = $a;
    else out(400, ['error' => 'That picture could not be used. Try a different image.']);
}
$pdo->prepare('UPDATE users SET name=? WHERE id=?')->execute([$name, $uid]);
$pdo->prepare('INSERT INTO profiles (user_id,bio,location,fav,avatar,updated_at) VALUES (?,?,?,?,?,NOW())
    ON DUPLICATE KEY UPDATE bio=VALUES(bio),location=VALUES(location),fav=VALUES(fav),avatar=VALUES(avatar),updated_at=NOW()')
    ->execute([$uid, $bio, $loc, $fav, $avatar]);
out(200, ['profile' => load_profile($pdo, $uid)]);
