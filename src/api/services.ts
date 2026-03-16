import type { AxiosRequestConfig } from "axios";

import type {
  AcceptLeaseRequest,
  AcceptLeaseResponse,
  Amenity,
  AmenityListResponse,
  AuthTokensResponse,
  CompleteProfileRequest,
  CompleteProfileResponse,
  ConsumeMagicLinkRequest,
  CreateAmenityRequest,
  CreateFileAssetRequest,
  CreateLeaseTemplateRequest,
  CreatePropertyRequest,
  CreateServiceProviderRequest,
  CreateUnitRequest,
  FileAsset,
  GenerateInvoicesRequest,
  GenerateInvoicesResponse,
  InviteTenantRequest,
  InviteTenantResponse,
  Invoice,
  InvoiceLinkResponse,
  InvoiceListResponse,
  LeasePreviewResponse,
  LeaseTemplate,
  LeaseTemplateListParams,
  LeaseTemplateListResponse,
  LoginRequest,
  LogoutRequest,
  NewLeaseTemplateVersionRequest,
  Notice,
  NoticeListResponse,
  OnboardingClaimRequest,
  OnboardingClaimResponse,
  OrgOnboardingConfig,
  OwnerTicket,
  OwnerTicketListResponse,
  PendingLeaseAcceptanceResponse,
  PresignDownloadResponse,
  PresignUploadRequest,
  PresignUploadResponse,
  Property,
  PropertyListResponse,
  PublicInvoiceResponse,
  RefreshRequest,
  RegisterOwnerRequest,
  RequestMagicLinkRequest,
  ServiceProvider,
  ServiceProviderListResponse,
  SignLeaseRequest,
  TenantBalance,
  TenantLease,
  TenantTicket,
  TenantTicketCreateRequest,
  Unit,
  UnitInvite,
  UnitInviteListResponse,
  UnitListResponse,
  UpdateAmenityRequest,
  UpdateOwnerTicketRequest,
  UpdatePropertyRequest,
  UpdateServiceProviderRequest,
  UpdateUnitRequest,
} from "@/src/api/contracts";
import { http, rawHttp } from "@/src/api/http-client";
import type { PaginatedResponse, PaginationParams, TokenPair } from "@/src/types/contracts";

function toPaginated<T>(
  payload: unknown,
  fallback: PaginationParams = {},
): PaginatedResponse<T> {
  if (Array.isArray(payload)) {
    return {
      items: payload as T[],
      page: fallback.page ?? 1,
      pageSize: fallback.pageSize ?? payload.length,
      total: payload.length,
    };
  }

  if (payload && typeof payload === "object") {
    const source = payload as Record<string, unknown>;
    if (Array.isArray(source.items)) {
      return {
        items: source.items as T[],
        page: typeof source.page === "number" ? source.page : fallback.page ?? 1,
        pageSize:
          typeof source.pageSize === "number"
            ? source.pageSize
            : fallback.pageSize ?? source.items.length,
        total:
          typeof source.total === "number"
            ? source.total
            : (source.items as unknown[]).length,
      };
    }
  }

  return {
    items: [],
    page: fallback.page ?? 1,
    pageSize: fallback.pageSize ?? 0,
    total: 0,
  };
}

function skipAuthConfig(extra?: AxiosRequestConfig): AxiosRequestConfig {
  return {
    ...(extra ?? {}),
    _skipAuth: true,
  };
}

export const authApi = {
  registerOwner(payload: RegisterOwnerRequest) {
    return http
      .post<AuthTokensResponse>(
        "/auth/register-owner",
        payload,
        skipAuthConfig({ _cooldownKey: "auth.register-owner" }),
      )
      .then((response) => response.data);
  },

  login(payload: LoginRequest) {
    return http
      .post<AuthTokensResponse>(
        "/auth/login",
        payload,
        skipAuthConfig({ _cooldownKey: "auth.login" }),
      )
      .then((response) => response.data);
  },

  requestMagicLink(payload: RequestMagicLinkRequest) {
    return http.post<void>(
      "/auth/request-magic-link",
      payload,
      skipAuthConfig({ _cooldownKey: "auth.request-magic-link" }),
    );
  },

  consumeMagicLink(payload: ConsumeMagicLinkRequest) {
    return http
      .post<AuthTokensResponse>(
        "/auth/consume-magic-link",
        payload,
        skipAuthConfig({ _cooldownKey: "auth.consume-magic-link" }),
      )
      .then((response) => response.data);
  },

  refresh(payload: RefreshRequest) {
    return rawHttp
      .post<TokenPair>("/auth/refresh", payload, skipAuthConfig())
      .then((response) => response.data);
  },

  logout(payload: LogoutRequest) {
    return http.post<void>("/auth/logout", payload);
  },
};

export const ownerApi = {
  createProperty(payload: CreatePropertyRequest) {
    return http
      .post<Property>("/properties", payload)
      .then((response) => response.data);
  },

  listProperties(params?: PaginationParams) {
    return http
      .get<PropertyListResponse | Property[]>("/properties", { params })
      .then((response) => toPaginated<Property>(response.data, params));
  },

  getProperty(propertyId: string) {
    return http
      .get<Property>(`/properties/${propertyId}`)
      .then((response) => response.data);
  },

  updateProperty(propertyId: string, payload: UpdatePropertyRequest) {
    return http
      .patch<Property>(`/properties/${propertyId}`, payload)
      .then((response) => response.data);
  },

  deleteProperty(propertyId: string) {
    return http.delete<void>(`/properties/${propertyId}`);
  },

  createUnit(propertyId: string, payload: CreateUnitRequest) {
    return http
      .post<Unit>(`/properties/${propertyId}/units`, payload)
      .then((response) => response.data);
  },

  listUnits(propertyId: string, params?: PaginationParams) {
    return http
      .get<UnitListResponse | Unit[]>(`/properties/${propertyId}/units`, { params })
      .then((response) => toPaginated<Unit>(response.data, params));
  },

  updateUnit(unitId: string, payload: UpdateUnitRequest) {
    return http
      .patch<Unit>(`/units/${unitId}`, payload)
      .then((response) => response.data);
  },

  createAmenity(propertyId: string, payload: CreateAmenityRequest) {
    return http
      .post<Amenity>(`/properties/${propertyId}/amenities`, payload)
      .then((response) => response.data);
  },

  listAmenities(propertyId: string, params?: PaginationParams) {
    return http
      .get<AmenityListResponse | Amenity[]>(`/properties/${propertyId}/amenities`, { params })
      .then((response) => toPaginated<Amenity>(response.data, params));
  },

  listUnitAmenities(unitId: string, params?: PaginationParams) {
    return http
      .get<AmenityListResponse | Amenity[]>(`/units/${unitId}/amenities`, { params })
      .then((response) => toPaginated<Amenity>(response.data, params));
  },

  assignAmenity(unitId: string, amenityId: string) {
    return http
      .post<Amenity>(`/units/${unitId}/amenities/${amenityId}/attach`)
      .then((response) => response.data);
  },

  detachAmenity(unitId: string, amenityId: string) {
    return http.delete<void>(`/units/${unitId}/amenities/${amenityId}/detach`);
  },

  updateAmenity(amenityId: string, payload: UpdateAmenityRequest) {
    return http
      .patch<Amenity>(`/amenities/${amenityId}`, payload)
      .then((response) => response.data);
  },


  listServiceProviders(propertyId: string, category?: string, params?: PaginationParams) {
    return http
      .get<ServiceProviderListResponse | ServiceProvider[]>(
        `/properties/${propertyId}/services`,
        {
          params: {
            ...params,
            category,
          }
        },
      )
      .then((response) => toPaginated<ServiceProvider>(response.data, params));
  },

  createServiceProvider(propertyId: string, payload: CreateServiceProviderRequest) {
    return http
      .post<ServiceProvider>(`/properties/${propertyId}/service`, payload)
      .then((response) => response.data);
  },

  updateServiceProvider(serviceId: string, payload: UpdateServiceProviderRequest) {
    return http
      .patch<ServiceProvider>(`/service/${serviceId}`, payload)
      .then((response) => response.data);
  },

  getOnboardingConfig(orgId: string) {
    return http
      .get<OrgOnboardingConfig>(`/orgs/${orgId}/onboarding-config`)
      .then((response) => response.data);
  },

  updateOnboardingConfig(orgId: string, payload: Record<string, unknown>) {
    return http
      .put<OrgOnboardingConfig>(`/orgs/${orgId}/onboarding-config`, payload)
      .then((response) => response.data);
  },

  createLeaseTemplate(payload: CreateLeaseTemplateRequest) {
    return http
      .post<LeaseTemplate>("/lease-templates", payload)
      .then((response) => response.data);
  },

  newLeaseTemplateVersion(templateId: string, payload: NewLeaseTemplateVersionRequest) {
    return http
      .post<LeaseTemplate>(`/lease-templates/${templateId}/new-version`, payload)
      .then((response) => response.data);
  },

  listLeaseTemplates(params?: PaginationParams & LeaseTemplateListParams) {
    return http
      .get<LeaseTemplateListResponse | LeaseTemplate[]>("/lease-templates", { params })
      .then((response) => toPaginated<LeaseTemplate>(response.data, params));
  },

  inviteTenant(unitId: string, payload: InviteTenantRequest) {
    return http
      .post<InviteTenantResponse>(`/units/${unitId}/invite-tenant`, payload)
      .then((response) => response.data);
  },

  listUnitInvites(unitId: string, params?: PaginationParams) {
    return http
      .get<UnitInviteListResponse | UnitInvite[]>(`/units/${unitId}/invites`, { params })
      .then((response) => toPaginated<UnitInvite>(response.data, params));
  },

  listOrgTickets(orgId: string, params?: PaginationParams) {
    return http
      .get<OwnerTicketListResponse | OwnerTicket[]>(`/orgs/${orgId}/tickets`, {
        params,
      })
      .then((response) => toPaginated<OwnerTicket>(response.data, params));
  },

  updateOrgTicket(orgId: string, ticketId: string, payload: UpdateOwnerTicketRequest) {
    return http
      .patch<OwnerTicket>(`/orgs/${orgId}/tickets/${ticketId}`, payload)
      .then((response) => response.data);
  },

  generateInvoices(orgId: string, payload: GenerateInvoicesRequest) {
    return http
      .post<GenerateInvoicesResponse>(`/orgs/${orgId}/invoices/generate`, payload)
      .then((response) => response.data);
  },

  generateInvoiceLink(orgId: string, invoiceId: string, ttlMinutes: number) {
    return http
      .post<InvoiceLinkResponse>(
        `/orgs/${orgId}/invoices/${invoiceId}/link`,
        null,
        { params: { ttlMinutes } },
      )
      .then((response) => response.data);
  },
};

export const onboardingApi = {
  claim(payload: OnboardingClaimRequest) {
    return http
      .post<OnboardingClaimResponse>(
        "/onboarding/claim",
        payload,
        skipAuthConfig({ _cooldownKey: "onboarding.claim" }),
      )
      .then((response) => response.data);
  },

  completeProfile(inviteToken: string, payload: CompleteProfileRequest) {
    return http
      .post<CompleteProfileResponse>("/onboarding/complete-profile", payload, {
        _skipAuth: true,
        _cooldownKey: "onboarding.complete-profile",
        headers: {
          "x-invite-token": inviteToken,
        },
      })
      .then((response) => response.data);
  },

  acceptLease(inviteToken: string, payload: AcceptLeaseRequest): Promise<AcceptLeaseResponse> {
    return http
      .post<AcceptLeaseResponse>("/onboarding/accept-lease", payload, {
        _skipAuth: true,
        _cooldownKey: "onboarding.accept-lease",
        headers: {
          "x-invite-token": inviteToken,
        },
      })
      .then((response) => response.data)
      .catch((error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status !== 404) {
          throw error;
        }

        return http
          .post<AcceptLeaseResponse | void>("/onboarding/sign-lease", payload, {
            _skipAuth: true,
            _cooldownKey: "onboarding.accept-lease",
            headers: {
              "x-invite-token": inviteToken,
            },
          })
          .then((response) => {
            const source = response.data as Partial<AcceptLeaseResponse> | undefined;
            if (
              source &&
              typeof source.accessToken === "string" &&
              typeof source.refreshToken === "string"
            ) {
              return source as AcceptLeaseResponse;
            }

            throw new Error(
              "Accept lease fallback succeeded but no access/refresh tokens were returned.",
            );
          });
      });
  },

  signLease(inviteToken: string, payload: SignLeaseRequest) {
    return this.acceptLease(inviteToken, payload);
  },

  getLeasePreview(
    inviteToken: string,
    params: {
      leaseId?: string;
      userId?: string;
    },
  ) {
    return http
      .get<LeasePreviewResponse>("/onboarding/lease-preview", {
        _skipAuth: true,
        headers: {
          "x-invite-token": inviteToken,
        },
        params,
      })
      .then((response) => response.data);
  },
};

export const tenantApi = {
  listLeases(params?: PaginationParams) {
    return http
      .get<TenantLease[] | Record<string, unknown>>("/tenant/me/leases", { params })
      .then((response) => toPaginated<TenantLease>(response.data, params));
  },

  getLeases() {
    return this.listLeases().then((response) => response.items);
  },

  getLeaseHistory(params?: PaginationParams) {
    return http
      .get<TenantLease[] | Record<string, unknown>>("/tenant/me/leases/history", { params })
      .then((response) => toPaginated<TenantLease>(response.data, params));
  },

  getPendingLeaseAcceptance() {
    return http
      .get<PendingLeaseAcceptanceResponse>("/tenant/me/leases/pending-acceptance")
      .then((response) => response.data);
  },

  acceptPendingLease(leaseId: string) {
    return http
      .post<AcceptLeaseResponse>("/onboarding/accept-lease", { leaseId })
      .then((response) => response.data);
  },

  listInvoices(params?: PaginationParams) {
    return http
      .get<InvoiceListResponse | Invoice[]>("/tenant/me/invoices", { params })
      .then((response) => toPaginated<Invoice>(response.data, params));
  },

  getInvoice(invoiceId: string) {
    return http
      .get<Invoice>(`/tenant/me/invoices/${invoiceId}`)
      .then((response) => response.data);
  },

  getBalance() {
    return http
      .get<TenantBalance>("/tenant/me/balance")
      .then((response) => response.data);
  },

  listNotices(params?: PaginationParams) {
    return http
      .get<NoticeListResponse | Notice[]>("/tenant/me/notices", { params })
      .then((response) => toPaginated<Notice>(response.data, params));
  },


  createTicket(payload: TenantTicketCreateRequest) {
    return http
      .post<TenantTicket>("/tenant/me/tickets", payload)
      .then((response) => response.data);
  },
};

export const filesApi = {
  presignUpload(payload: PresignUploadRequest) {
    const fileName = payload.fileName ?? payload.filename;
    if (!fileName) {
      throw new Error("fileName is required.");
    }

    return http
      .post<PresignUploadResponse | Record<string, unknown>>("/files/presign-upload", {
        filename: fileName,
        contentType: payload.contentType,
        metadata:
          typeof payload.sizeBytes === "number"
            ? { sizeBytes: String(payload.sizeBytes) }
            : undefined,
      })
      .then((response) => {
        const source = response.data as Record<string, unknown>;
        const uploadUrl =
          typeof source.uploadUrl === "string"
            ? source.uploadUrl
            : typeof source.url === "string"
              ? source.url
              : "";
        const key = typeof source.key === "string" ? source.key : "";

        if (!uploadUrl || !key) {
          throw new Error("Invalid presign upload response.");
        }

        return {
          uploadUrl,
          key,
          headers:
            source.headers && typeof source.headers === "object"
              ? (source.headers as Record<string, string>)
              : undefined,
          method: typeof source.method === "string" ? source.method : undefined,
          expiresInSeconds:
            typeof source.expiresInSeconds === "number"
              ? source.expiresInSeconds
              : undefined,
        } satisfies PresignUploadResponse;
      });
  },

  createAsset(payload: CreateFileAssetRequest) {
    const fileType = payload.type ?? payload.contentType ?? "image/png";
    const fileUrl = payload.url ?? payload.key;
    if (!fileUrl) {
      throw new Error("Asset URL/key is required.");
    }

    return http
      .post<FileAsset | Record<string, unknown>>("/files", {
        type: fileType,
        url: fileUrl,
        checksum: payload.checksum,
      })
      .then((response) => {
        const source = response.data as Record<string, unknown>;
        const assetId =
          typeof source.assetId === "string"
            ? source.assetId
            : typeof source.id === "string"
              ? source.id
              : "";
        if (!assetId) {
          throw new Error("Invalid file asset response.");
        }

        return {
          assetId,
          id: typeof source.id === "string" ? source.id : undefined,
          url: typeof source.url === "string" ? source.url : undefined,
        } satisfies FileAsset;
      });
  },

  presignDownload(assetId: string) {
    return http
      .post<PresignDownloadResponse | Record<string, unknown>>(
        `/files/${assetId}/presign-download`,
      )
      .then((response) => {
        const source = response.data as Record<string, unknown>;
        const downloadUrl =
          typeof source.downloadUrl === "string"
            ? source.downloadUrl
            : typeof source.url === "string"
              ? source.url
              : "";
        if (!downloadUrl) {
          throw new Error("Invalid presign download response.");
        }

        return {
          downloadUrl,
          expiresInSeconds:
            typeof source.expiresInSeconds === "number"
              ? source.expiresInSeconds
              : undefined,
        } satisfies PresignDownloadResponse;
      });
  },

  deleteAsset(assetId: string) {
    return http.delete<void>(`/files/${assetId}`);
  },

  async uploadToPresignedUrl(
    uploadUrl: string,
    payload: Blob,
    headers?: Record<string, string>,
  ) {
    await fetch(uploadUrl, {
      method: "PUT",
      headers: headers ?? {},
      body: payload,
    });
  },
};

export const publicApi = {
  getPublicInvoice(token: string) {
    return http
      .get<PublicInvoiceResponse>("/public/invoice", {
        _skipAuth: true,
        params: { token },
      })
      .then((response) => response.data);
  },
};
