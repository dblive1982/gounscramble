<?php
// Branded HTML emails (with a plain-text copy). Used for the welcome and password-reset messages.
declare(strict_types=1);

function gu_email(string $to, string $subject, string $heading, string $paraHtml, string $paraText, string $btnText = '', string $btnUrl = ''): void {
    $c = config() ?: [];
    $site = rtrim($c['site'] ?? 'https://gounscramble.com', '/');
    $from = $c['mail_from'] ?? 'noreply@gounscramble.com';
    $logo = $site . '/assets/logo.png';
    $h = htmlspecialchars($heading, ENT_QUOTES, 'UTF-8');
    $btn = '';
    if ($btnText !== '' && $btnUrl !== '') {
        $u = htmlspecialchars($btnUrl, ENT_QUOTES, 'UTF-8');
        $t = htmlspecialchars($btnText, ENT_QUOTES, 'UTF-8');
        $btn = '<p style="margin:26px 0 6px"><a href="' . $u . '" style="display:inline-block;background:#FF6B6B;color:#000000;text-decoration:none;font-weight:700;font-size:20px;padding:12px 28px;border:4px solid #000000;border-radius:999px;font-family:Arial,Helvetica,sans-serif">' . $t . '</a></p>';
    }
    $html = '<!doctype html><html><head><meta charset="utf-8"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light"></head><body style="margin:0;padding:0;background:#FFFFFF">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF"><tr><td align="center" style="padding:24px 12px">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">'
        . '<tr><td align="center" style="background:#0099B5;border:4px solid #000000;border-radius:24px 24px 0 0;padding:18px 12px">'
        . '<img src="' . htmlspecialchars($logo, ENT_QUOTES, 'UTF-8') . '" width="176" height="150" alt="GO! Unscramble!" style="display:block;border:0;height:150px;width:176px"></td></tr>'
        . '<tr><td style="background:#FFFFFF;border:4px solid #000000;border-top:0;border-radius:0 0 24px 24px;padding:28px 26px;font-family:Arial,Helvetica,sans-serif;color:#000000;font-size:17px;line-height:1.55">'
        . '<h1 style="margin:0 0 14px;font-size:28px;line-height:1.15;color:#000000">' . $h . '</h1>'
        . $paraHtml . $btn
        . '</td></tr>'
        . '<tr><td align="center" style="padding:16px 8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#000000">GoUnscramble &middot; <a href="' . $site . '" style="color:#000000">gounscramble.com</a></td></tr>'
        . '</table></td></tr></table></body></html>';
    $text = $heading . "\n\n" . $paraText . ($btnUrl !== '' ? "\n\n" . $btnText . ": " . $btnUrl : '') . "\n\n-- GoUnscramble, " . $site . "\n";

    $b = 'gu' . bin2hex(random_bytes(8));
    $headers = "From: GoUnscramble <$from>\r\n"
        . "MIME-Version: 1.0\r\n"
        . "Content-Type: multipart/alternative; boundary=\"$b\"";
    $body = "--$b\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($text), 76, "\r\n")
        . "--$b\r\nContent-Type: text/html; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($html), 76, "\r\n")
        . "--$b--";
    $subj = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    // Prefer authenticated SMTP through a real mailbox (much better delivery); fall back to PHP mail().
    if (!empty($c['smtp_user']) && !empty($c['smtp_pass'])) {
        $sfrom = $c['smtp_user'];
        $hdr = "From: GoUnscramble <$sfrom>\r\nTo: <$to>\r\nSubject: $subj\r\nDate: " . date('r')
            . "\r\nMessage-ID: <" . bin2hex(random_bytes(12)) . "@gounscramble.com>\r\nMIME-Version: 1.0\r\n"
            . "Content-Type: multipart/alternative; boundary=\"$b\"\r\n";
        if (gu_smtp($c, $sfrom, $to, $hdr . "\r\n" . $body)) return;
    }
    @mail($to, $subj, $body, $headers);
}

function gu_smtp(array $c, string $from, string $to, string $data): bool {
    $host = $c['smtp_host'] ?? 'smtp.hostinger.com';
    $port = (int)($c['smtp_port'] ?? 465);
    $fp = @stream_socket_client(($port === 465 ? 'ssl://' : 'tcp://') . $host . ':' . $port, $en, $es, 10);
    if (!$fp) { error_log("gu_smtp connect failed: $es"); return false; }
    stream_set_timeout($fp, 10);
    $read = function () use ($fp): string {
        $out = '';
        while (($l = fgets($fp, 515)) !== false) { $out .= $l; if (strlen($l) < 4 || $l[3] === ' ') break; }
        return $out;
    };
    $cmd = function (string $x, string $ok) use ($fp, $read): bool {
        fwrite($fp, $x . "\r\n");
        $r = $read();
        return strpos($r, $ok) === 0;
    };
    $good = false;
    if (strpos($read(), '220') === 0 && $cmd('EHLO gounscramble.com', '250')) {
        if ($port !== 465) {
            if ($cmd('STARTTLS', '220') && @stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) $cmd('EHLO gounscramble.com', '250');
            else { fclose($fp); return false; }
        }
        if ($cmd('AUTH LOGIN', '334') && $cmd(base64_encode($c['smtp_user']), '334') && $cmd(base64_encode($c['smtp_pass']), '235')
            && $cmd("MAIL FROM:<$from>", '250') && $cmd("RCPT TO:<$to>", '250') && $cmd('DATA', '354')) {
            $data = preg_replace('/(?<!\r)\n/', "\r\n", $data);
            $data = preg_replace('/^\./m', '..', $data);
            fwrite($fp, $data . "\r\n.\r\n");
            $good = strpos($read(), '250') === 0;
        }
    }
    if (!$good) error_log('gu_smtp failed');
    @fwrite($fp, "QUIT\r\n");
    fclose($fp);
    return $good;
}


// Shared welcome message: [html, text]. $via is "" or " with Google".
function gu_welcome_parts(string $email, string $via = ''): array {
    $e = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
    $items = [
        ['Your progress is saved', 'Word search, Sudoku and every other game save as you play, even part way through. Pick up where you left off on any phone, tablet or computer.'],
        ['Unscramble any letters', 'Type jumbled letters, with blank tiles if you like, and see every word they can make, grouped by length with Scrabble and Words With Friends scores.'],
        ['Games for one or two', 'Word search, Sudoku, Snakes and ladders, Connect 4, Tic tac toe, Memory match and Hangman. Play the computer, or take turns with a friend on the same device.'],
        ['Your own profile', 'Add a picture, a short bio and your favourite game on your account page.'],
        ['Free, with no spam', 'Everything on GoUnscramble is free. We only email you for things like password resets.'],
    ];
    $html = '<p style="margin:0 0 6px">Your free GoUnscramble account is ready. Here is what it gives you:</p>';
    $text = "Your free GoUnscramble account is ready. Here is what it gives you:\n";
    foreach ($items as [$h, $t]) {
        $html .= '<h2 style="margin:20px 0 4px;font-size:19px;line-height:1.25;color:#000000">' . $h . '</h2><p style="margin:0">' . $t . '</p>';
        $text .= "\n" . $h . "\n" . $t . "\n";
    }
    $html .= '<p style="margin:22px 0 0;font-size:14px">You signed up' . $via . ' using ' . $e . '. If that was not you, you can ignore this message.</p>';
    $text .= "\nYou signed up" . $via . " using $email. If that was not you, you can ignore this message.";
    return [$html, $text];
}
