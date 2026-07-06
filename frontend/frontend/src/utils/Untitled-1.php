<?php
$ch = curl_init('http://127.0.0.1:8082/api/auth/login');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['identifier'=>'admin','password'=>'Admin@123']));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
$response = curl_exec($ch);
$info = curl_getinfo($ch);
curl_close($ch);
echo "<pre>";
echo "HTTP code: {$info['http_code']} \n";
echo "URL: {$info['url']} \n";
echo "Resp:\n";
echo htmlentities($response);
echo "</pre>";
