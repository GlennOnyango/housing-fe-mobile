import type { AxiosRequestConfig } from "axios";

import type {
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
  UpdateOwnerTicketRequest,
  UpdatePropertyRequest,
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

  createAmenity(payload: CreateAmenityRequest) {
    return http
      .post<Amenity>("/amenities", payload)
      .then((response) => response.data);
  },

  listAmenities(params?: PaginationParams) {
    return http
      .get<AmenityListResponse | Amenity[]>("/amenities", { params })
      .then((response) => toPaginated<Amenity>(response.data, params));
  },

  listUnitAmenities(unitId: string, params?: PaginationParams) {
    return http
      .get<AmenityListResponse | Amenity[]>(`/units/${unitId}/amenities`, { params })
      .then((response) => toPaginated<Amenity>(response.data, params));
  },

  assignAmenity(unitId: string, amenityId: string) {
    return http.post<void>(`/units/${unitId}/amenities/${amenityId}`);
  },

  unassignAmenity(unitId: string, amenityId: string) {
    return http.delete<void>(`/units/${unitId}/amenities/${amenityId}`);
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

  listLeaseTemplates(params?: PaginationParams) {
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

  signLease(inviteToken: string, payload: SignLeaseRequest) {
    return http
      .post<void>("/onboarding/sign-lease", payload, {
        _skipAuth: true,
        _cooldownKey: "onboarding.sign-lease",
        headers: {
          "x-invite-token": inviteToken,
        },
      })
      .then((response) => response.data);
  },

  getLeasePreview(inviteToken: string, leaseId: string) {
    return http
      .get<LeasePreviewResponse>("/onboarding/lease-preview", {
        _skipAuth: true,
        headers: {
          "x-invite-token": inviteToken,
        },
        params: {
          leaseId,
        },
      })
      .then((response) => response.data);
  },
};

export const tenantApi = {
  getLeases() {
    return http
      .get<TenantLease[]>("/tenant/me/leases")
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

  listServiceProviders(category?: string, params?: PaginationParams) {
    return http
      .get<ServiceProviderListResponse | ServiceProvider[]>(
        "/tenant/me/service-providers",
        {
          params: {
            ...params,
            category,
          },
        },
      )
      .then((response) => toPaginated<ServiceProvider>(response.data, params));
  },

  createTicket(payload: TenantTicketCreateRequest) {
    return http
      .post<TenantTicket>("/tenant/me/tickets", payload)
      .then((response) => response.data);
  },
};

export const filesApi = {
  presignUpload(payload: PresignUploadRequest) {
    return http
      .post<PresignUploadResponse>("/files/presign-upload", payload)
      .then((response) => response.data);
  },

  createAsset(payload: CreateFileAssetRequest) {
    return http
      .post<FileAsset>("/files", payload)
      .then((response) => response.data);
  },

  presignDownload(assetId: string) {
    return http
      .post<PresignDownloadResponse>(`/files/${assetId}/presign-download`)
      .then((response) => response.data);
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
