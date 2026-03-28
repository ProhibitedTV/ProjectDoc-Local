import { BadRequestException, Body, Controller, Get, Param, Post } from "@nestjs/common";
import type {
  ApproveReviewItemRequest,
  CorrectReviewItemRequest,
  FollowUpReviewItemRequest,
  ReviewItemDetail,
  ReviewQueueItem
} from "@projectdoc/shared";
import {
  approveReviewItemRequestSchema,
  correctReviewItemRequestSchema,
  followUpReviewItemRequestSchema
} from "@projectdoc/shared";

import { ReviewService } from "./review.service";

@Controller("review-items")
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  async listReviewItems(): Promise<ReviewQueueItem[]> {
    return this.reviewService.listQueueItems();
  }

  @Get(":reviewTaskId")
  async getReviewItem(@Param("reviewTaskId") reviewTaskId: string): Promise<ReviewItemDetail> {
    return this.reviewService.getReviewItem(reviewTaskId);
  }

  @Post(":reviewTaskId/approve")
  async approveReviewItem(
    @Param("reviewTaskId") reviewTaskId: string,
    @Body() body: unknown
  ): Promise<ReviewItemDetail> {
    return this.reviewService.approveReviewItem(reviewTaskId, this.parseApproveRequest(body));
  }

  @Post(":reviewTaskId/correct")
  async correctReviewItem(
    @Param("reviewTaskId") reviewTaskId: string,
    @Body() body: unknown
  ): Promise<ReviewItemDetail> {
    return this.reviewService.correctReviewItem(reviewTaskId, this.parseCorrectRequest(body));
  }

  @Post(":reviewTaskId/follow-up")
  async markNeedsFollowUp(
    @Param("reviewTaskId") reviewTaskId: string,
    @Body() body: unknown
  ): Promise<ReviewItemDetail> {
    return this.reviewService.markNeedsFollowUp(reviewTaskId, this.parseFollowUpRequest(body));
  }

  private parseApproveRequest(body: unknown): ApproveReviewItemRequest {
    try {
      return approveReviewItemRequestSchema.parse(body);
    } catch (error) {
      throw new BadRequestException(this.readParseMessage(error));
    }
  }

  private parseCorrectRequest(body: unknown): CorrectReviewItemRequest {
    try {
      return correctReviewItemRequestSchema.parse(body);
    } catch (error) {
      throw new BadRequestException(this.readParseMessage(error));
    }
  }

  private parseFollowUpRequest(body: unknown): FollowUpReviewItemRequest {
    try {
      return followUpReviewItemRequestSchema.parse(body);
    } catch (error) {
      throw new BadRequestException(this.readParseMessage(error));
    }
  }

  private readParseMessage(error: unknown) {
    if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
      return error.message;
    }

    return "The review request payload was invalid.";
  }
}
