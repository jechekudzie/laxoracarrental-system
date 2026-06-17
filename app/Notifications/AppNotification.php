<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Generic in-app notification used for every domain event we care about
 * (booking created/confirmed/active/completed/cancelled, payment recorded,
 * deposit refund, etc.). Each instance carries:
 *
 *   - `type`  — short slug callers + clients can switch on (e.g. "booking.created")
 *   - `title` — bold one-liner shown in the bell list
 *   - `body`  — supporting copy
 *   - `data`  — opaque key/value payload (e.g. {booking_id: 17}) for deep linking
 *
 * Delivered on two channels: `database` (always) so the bell list works, and
 * `mail` whenever `withEmail` is true so important events also hit the inbox.
 *
 * Instances are not queued by default — flip on ShouldQueue + add `use Queueable`
 * once a queue worker is provisioned.
 */
class AppNotification extends Notification
{
    use Queueable;

    /** @param  array<string, mixed>  $data */
    public function __construct(
        public readonly string $type,
        public readonly string $title,
        public readonly string $body,
        public readonly array $data = [],
        public readonly bool $withEmail = false,
        public readonly ?string $actionUrl = null,
        public readonly ?string $actionLabel = null,
    ) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return $this->withEmail ? ['database', 'mail'] : ['database'];
    }

    /** @return array<string, mixed> */
    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => $this->type,
            'title' => $this->title,
            'body' => $this->body,
            'data' => $this->data,
            'action_url' => $this->actionUrl,
            'action_label' => $this->actionLabel,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $msg = (new MailMessage())
            ->subject($this->title)
            ->greeting('Hi'.($notifiable->name ? ' '.$notifiable->name : '').',')
            ->line($this->body);

        if ($this->actionUrl !== null) {
            $msg->action($this->actionLabel ?? 'Open in app', $this->actionUrl);
        }

        return $msg->line('Thanks for using Car Rental.');
    }
}
