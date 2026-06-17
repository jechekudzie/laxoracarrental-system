<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\LoginRequest;
use App\Http\Requests\Api\V1\RegisterCustomerRequest;
use App\Http\Resources\Api\V1\CustomerResource;
use App\Models\User;
use App\Services\CustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private CustomerService $customers) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->string('email'))->first();

        if (! $user || ! Hash::check($request->string('password'), $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken($request->string('device_name')->toString())->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->getRoleNames(),
                'permissions' => $user->getAllPermissions()->pluck('name'),
            ],
        ]);
    }

    public function register(RegisterCustomerRequest $request): JsonResponse
    {
        $customer = $this->customers->registerWithAccount($request->validated());
        $user = $customer->user;

        $token = $user->createToken($request->string('device_name')->toString())->plainTextToken;

        return response()->json([
            'token' => $token,
            'customer' => CustomerResource::make($customer),
        ], 201);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        // Guarantee every authenticated user has a linked customer record so
        // they can immediately create bookings through the mobile customer flow.
        // Staff and admins also get a customer shell so they can test the flow
        // or rent themselves. See CustomerService::ensureForUser.
        $customer = $this->customers->ensureForUser($user);

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
            'customer' => CustomerResource::make($customer),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }
}
