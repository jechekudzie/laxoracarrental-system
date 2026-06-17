<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\User;
use App\Models\WorkerTask;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinanceWorkerTaskTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_guests_are_redirected_from_tasks(): void
    {
        $this->get(route('finance.tasks.index'))->assertRedirect(route('login'));
    }

    public function test_can_view_tasks_index(): void
    {
        $this->actingAs($this->user)
            ->get(route('finance.tasks.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('finance/tasks/index'));
    }

    public function test_can_create_task(): void
    {
        $employee = Employee::factory()->create();

        $this->actingAs($this->user)
            ->post(route('finance.tasks.store'), [
                'title' => 'Clean vehicle fleet',
                'description' => 'Wash all vehicles in the lot',
                'assigned_to' => $employee->id,
                'priority' => 'normal',
                'due_date' => now()->addDays(2)->toDateString(),
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('worker_tasks', ['title' => 'Clean vehicle fleet', 'assigned_by' => $this->user->id]);
    }

    public function test_task_title_is_required(): void
    {
        $this->actingAs($this->user)
            ->post(route('finance.tasks.store'), ['priority' => 'normal'])
            ->assertSessionHasErrors('title');
    }

    public function test_can_update_task_status(): void
    {
        $task = WorkerTask::factory()->create(['status' => 'pending']);

        $this->actingAs($this->user)
            ->post(route('finance.tasks.status', $task), ['status' => 'in_progress'])
            ->assertRedirect();

        $this->assertDatabaseHas('worker_tasks', ['id' => $task->id, 'status' => 'in_progress']);
    }

    public function test_completing_task_sets_completed_at(): void
    {
        $task = WorkerTask::factory()->create(['status' => 'in_progress']);

        $this->actingAs($this->user)
            ->post(route('finance.tasks.status', $task), ['status' => 'completed', 'completion_notes' => 'All done'])
            ->assertRedirect();

        $updated = $task->fresh();
        $this->assertEquals('completed', $updated->status->value);
        $this->assertNotNull($updated->completed_at);
    }

    public function test_can_delete_task(): void
    {
        $task = WorkerTask::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('finance.tasks.destroy', $task))
            ->assertRedirect();

        $this->assertSoftDeleted('worker_tasks', ['id' => $task->id]);
    }
}
