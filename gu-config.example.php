<?php
// Copy this file to ONE FOLDER ABOVE public_html and name it gu-config.php
//   /home/u175986232/domains/gounscramble.com/gu-config.php
// Fill in the database details from hPanel > Databases. Never put the real file in Git.
return [
    'db_host' => '127.0.0.1',
    'db_name' => 'u175986232_gounscramble',
    'db_user' => 'u175986232_gu',
    'db_pass' => 'PUT-THE-DATABASE-PASSWORD-HERE',
    'site' => 'https://gounscramble.com',
    'mail_from' => 'noreply@gounscramble.com',
    'google_client_id' => '',  // optional: Google sign-in (Client ID only, no secret needed)
];
