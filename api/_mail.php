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
    $html = '<!doctype html><html><body style="margin:0;padding:0;background:#E2CF9F">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E2CF9F"><tr><td align="center" style="padding:24px 12px">'
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
    $body = "--$b\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n$text\r\n"
        . "--$b\r\nContent-Type: text/html; charset=utf-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n$html\r\n"
        . "--$b--";
    @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers);
}
