<?php

test('root access is forbidden', function () {
    $response = $this->get(route('home'));

    $response->assertForbidden();
});
