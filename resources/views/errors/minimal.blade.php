<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>@yield('code') · @yield('title')</title>
    <style>
        *{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;padding:24px;background:#fafafa;color:#18181b;font:16px/1.6 system-ui,sans-serif}main{text-align:center;max-width:420px}.code{font-size:14px;letter-spacing:.15em;color:#71717a}h1{font-size:26px;letter-spacing:-.04em;font-weight:600;margin:12px 0}p{font-size:14px;color:#71717a}
        @media(prefers-color-scheme:dark){body{background:#18181b;color:#fafafa}.code,p{color:#a1a1aa}}
    </style>
</head>
<body><main><div class="code">@yield('code')</div><h1>@yield('title')</h1><p>@yield('message')</p></main></body>
</html>
