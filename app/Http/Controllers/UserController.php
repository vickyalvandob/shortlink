<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('users/index', [
            'users' => User::query()->latest()->orderByDesc('id')->paginate(20),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('users/create');
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        User::create($request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'User created successfully.']);

        return to_route('users.index');
    }

    public function edit(User $user): Response
    {
        return Inertia::render('users/edit', ['user' => $user]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();
        if (empty($data['password'])) {
            unset($data['password']);
        }

        $this->changeUser($request, $user, $data);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'User updated successfully.']);

        return $this->afterChange($request, $user);
    }

    public function status(Request $request, User $user): RedirectResponse
    {
        $this->changeUser($request, $user, $request->validate(['is_active' => ['required', 'boolean']]));
        Inertia::flash('toast', ['type' => 'success', 'message' => $user->fresh()->is_active ? 'User enabled.' : 'User disabled.']);

        return $this->afterChange($request, $user);
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $this->changeUser($request, $user, [], delete: true);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'User deleted. Their short links have been preserved.']);

        return $this->afterChange($request, $user);
    }

    /** @param array<string, mixed> $data */
    private function changeUser(Request $request, User $user, array $data, bool $delete = false): void
    {
        DB::transaction(function () use ($request, $user, $data, $delete): void {
            /** Lock in one stable order so concurrent changes cannot remove the last active administrator. */
            $users = User::orderBy('id')->lockForUpdate()->get();
            $actor = $users->firstWhere('id', $request->user()->id);
            abort_unless($actor?->isAdmin() && $actor->is_active, 403);
            $target = $users->firstWhere('id', $user->id);
            abort_unless($target !== null, 404);

            $remainsActiveAdmin = ! $delete
                && ($data['role'] ?? $target->role) === 'admin'
                && ($data['is_active'] ?? $target->is_active);

            if ($target->isAdmin() && $target->is_active && ! $remainsActiveAdmin
                && ! $users->contains(fn (User $other) => $other->id !== $target->id && $other->isAdmin() && $other->is_active)) {
                throw ValidationException::withMessages(['is_active' => 'At least one active administrator must remain.']);
            }

            if ($delete) {
                $target->delete();

                return;
            }

            if (isset($data['password']) || (isset($data['is_active']) && ! $data['is_active'])) {
                $target->remember_token = Str::random(60);
                if (config('session.driver') === 'database') {
                    DB::table('sessions')->where('user_id', $target->id)->delete();
                }
            }

            $target->fill($data)->save();
        }, 3);
    }

    private function afterChange(Request $request, User $user): RedirectResponse
    {
        if ($request->user()->id === $user->id) {
            $current = $user->fresh();
            if (! $current || ! $current->is_active) {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return to_route('login');
            }

            if (! $current->isAdmin()) {
                return to_route('dashboard');
            }
        }

        return to_route('users.index');
    }
}
