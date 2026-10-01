<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class CreateAdmin extends Command
{
    protected $signature = 'app:create-admin {email} {--name=Administrator}';

    protected $description = 'Create an administrator using a hidden password prompt';

    public function handle(): int
    {
        if (! $this->input->isInteractive()) {
            $this->error('Run this command interactively to enter a password securely.');

            return self::FAILURE;
        }

        $data = [
            'name' => $this->option('name'),
            'email' => strtolower((string) $this->argument('email')),
            'password' => $this->secret('Password (at least 12 characters)'),
        ];
        $validator = Validator::make($data, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', Password::min(12), 'max:128'],
        ]);
        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        User::create([...$validator->validated(), 'role' => 'admin', 'is_active' => true]);
        $this->info('Administrator created.');

        return self::SUCCESS;
    }
}
