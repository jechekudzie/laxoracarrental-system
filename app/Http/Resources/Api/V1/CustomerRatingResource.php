<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Models\CustomerRating;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin CustomerRating
 */
class CustomerRatingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer_id' => $this->customer_id,
            'booking_id' => $this->booking_id,
            'rated_by_user_id' => $this->rated_by_user_id,
            'score_condition' => $this->score_condition,
            'score_timeliness' => $this->score_timeliness,
            'score_payment' => $this->score_payment,
            'score_communication' => $this->score_communication,
            'score_care' => $this->score_care,
            'average' => $this->average,
            'comment' => $this->comment,
            'created_at' => $this->created_at,
        ];
    }
}
