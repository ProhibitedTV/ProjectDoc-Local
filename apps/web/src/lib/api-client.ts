import type {
  AppSettings,
  ApproveReviewItemRequest,
  AuditEventListResponse,
  CorrectReviewItemRequest,
  CreateExportJobRequest,
  DocumentIngestionRecord,
  DocumentSearchResponse,
  DocumentUploadResponse,
  ExportJob,
  FollowUpReviewItemRequest,
  HealthCheckResponse,
  ReviewItemDetail,
  ReviewQueueItem,
  SearchableDocument,
  UpdateAppSettingsRequest
} from "@projectdoc/shared";

import { webEnv } from "../config/web-env";

const readErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as { message?: string | string[] };

    if (Array.isArray(payload.message)) {
      return payload.message.join(", ");
    }

    if (typeof payload.message === "string") {
      return payload.message;
    }
  } catch {
    // Fall back to the generic response text below.
  }

  return response.statusText || "Request failed";
};

export const fetchHealth = async (): Promise<HealthCheckResponse> => {
  const response = await fetch(`${webEnv.VITE_API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<HealthCheckResponse>;
};

export const fetchAuditEvents = async (filters?: {
  limit?: number;
  eventType?: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
}): Promise<AuditEventListResponse> => {
  const searchParams = new URLSearchParams();

  if (filters?.limit) {
    searchParams.set("limit", String(filters.limit));
  }

  if (filters?.eventType) {
    searchParams.set("eventType", filters.eventType);
  }

  if (filters?.entityType) {
    searchParams.set("entityType", filters.entityType);
  }

  if (filters?.entityId) {
    searchParams.set("entityId", filters.entityId);
  }

  if (filters?.actorId) {
    searchParams.set("actorId", filters.actorId);
  }

  const queryString = searchParams.toString();

  const response = await fetch(
    `${webEnv.VITE_API_BASE_URL}/audit-events${queryString ? `?${queryString}` : ""}`
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<AuditEventListResponse>;
};

export const fetchAdminSettings = async (): Promise<AppSettings> => {
  const response = await fetch(`${webEnv.VITE_API_BASE_URL}/admin/settings`);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<AppSettings>;
};

export const updateAdminSettings = async (body: UpdateAppSettingsRequest): Promise<AppSettings> => {
  const response = await fetch(`${webEnv.VITE_API_BASE_URL}/admin/settings`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<AppSettings>;
};

export const createCsvExport = async (body: CreateExportJobRequest): Promise<ExportJob> => {
  const response = await fetch(`${webEnv.VITE_API_BASE_URL}/exports/csv`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<ExportJob>;
};

export const uploadDocument = async (file: File): Promise<DocumentUploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${webEnv.VITE_API_BASE_URL}/documents/upload`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<DocumentUploadResponse>;
};

export const fetchDocuments = async (): Promise<DocumentIngestionRecord[]> => {
  const response = await fetch(`${webEnv.VITE_API_BASE_URL}/documents`);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<DocumentIngestionRecord[]>;
};

export const searchDocuments = async (filters: {
  query: string;
  documentType?: string;
  status?: string;
}): Promise<DocumentSearchResponse> => {
  const searchParams = new URLSearchParams({
    query: filters.query
  });

  if (filters.documentType) {
    searchParams.set("documentType", filters.documentType);
  }

  if (filters.status) {
    searchParams.set("status", filters.status);
  }

  const response = await fetch(`${webEnv.VITE_API_BASE_URL}/search?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<DocumentSearchResponse>;
};

export const fetchSearchableDocument = async (documentId: string): Promise<SearchableDocument> => {
  const response = await fetch(`${webEnv.VITE_API_BASE_URL}/search/documents/${documentId}`);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<SearchableDocument>;
};

export const fetchReviewQueue = async (): Promise<ReviewQueueItem[]> => {
  const response = await fetch(`${webEnv.VITE_API_BASE_URL}/review-items`);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<ReviewQueueItem[]>;
};

export const fetchReviewItem = async (reviewTaskId: string): Promise<ReviewItemDetail> => {
  const response = await fetch(`${webEnv.VITE_API_BASE_URL}/review-items/${reviewTaskId}`);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<ReviewItemDetail>;
};

const postReviewMutation = async <TRequest>(
  reviewTaskId: string,
  action: "approve" | "correct" | "follow-up",
  body: TRequest
): Promise<ReviewItemDetail> => {
  const response = await fetch(`${webEnv.VITE_API_BASE_URL}/review-items/${reviewTaskId}/${action}`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<ReviewItemDetail>;
};

export const approveReviewItem = (reviewTaskId: string, body: ApproveReviewItemRequest) =>
  postReviewMutation(reviewTaskId, "approve", body);

export const correctReviewItem = (reviewTaskId: string, body: CorrectReviewItemRequest) =>
  postReviewMutation(reviewTaskId, "correct", body);

export const markReviewItemNeedsFollowUp = (
  reviewTaskId: string,
  body: FollowUpReviewItemRequest
) => postReviewMutation(reviewTaskId, "follow-up", body);
