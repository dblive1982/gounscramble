<?php
require __DIR__ . '/_boot.php';
if (!config()) out(200, ['user' => null]);
start_session();
$uid = (int)($_SESSION['uid'] ?? 0);
if ($uid <= 0) out(200, ['user' => null]);
$pdo = db();

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $in = read_post();
    $data = $in['data'] ?? null;
    if (!is_array($data)) out(422, ['error' => 'Bad data.']);
    // Keep only the games we know about, and keep the size sensible.
    $keep = [];
    foreach (['ws', 'sd', 'sl', 'c4', 'tt', 'mm', 'hm', 'gs', 'ad', 'rs'] as $g) if (isset($data[$g]) && is_array($data[$g])) $keep[$g] = $data[$g];
    $json = json_encode($keep, JSON_UNESCAPED_SLASHES);
    if ($json === false || strlen($json) > 200000) out(413, ['error' => 'Too much data.']);
    $pdo->prepare('INSERT INTO progress (user_id, data, updated_at) VALUES (?,?,NOW()) ON DUPLICATE KEY UPDATE data=VALUES(data), updated_at=NOW()')
        ->execute([$uid, $json]);
    out(200, ['ok' => true]);
}

$s = $pdo->prepare('SELECT data FROM progress WHERE user_id=?');
$s->execute([$uid]);
$row = $s->fetch();
$d = $row ? json_decode($row['data'], true) : [];
out(200, ['user' => true, 'data' => is_array($d) ? $d : new stdClass()]);
