import type {
  ClaimInviteDto,
  ClaimInviteResponseDto,
  CompleteProfileDto,
  CompleteProfileResponseDto,
  ConsumeMagicLinkDto,
  CreateAmenityDto,
  CreateLeaseTemplateDto,
  CreatePropertyDto,
  CreateTicketDto,
  CreateUnitDto,
  GenerateInvoicesDto,
  InviteSummaryResponseDto,
  InviteTenantDto,
  InviteTokenResponseDto,
  LoginDto,
  LogoutDto,
  NewLeaseTemplateVersionDto,
  RefreshDto,
  RegisterOwnerDto,
  RequestMagicLinkDto,
  SignLeaseDto,
  UnitStatus,
  UpdatePropertyDto,
  UpdateTicketDto,
  UpdateUnitDto,
} from "@/src/api/generated";
import type { PaginatedResponse, TokenPair } from "@/src/types/contracts";

export type RegisterOwnerRequest = RegisterOwnerDto;
export type LoginRequest = LoginDto;
export type RequestMagicLinkRequest = RequestMagicLinkDto;
export type ConsumeMagicLinkRequest = ConsumeMagicLinkDto;
export type RefreshRequest = RefreshDto;
export type LogoutRequest = LogoutDto;

export type AuthTokensResponse = TokenPair;

export interface Property {
  id: string;
  orgId: string;
  name: string;
  addressLine1?: string;
  city?: string;
  country?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreatePropertyRequest = CreatePropertyDto;
export type UpdatePropertyRequest = UpdatePropertyDto;

export interface Unit {
  id: string;
  propertyId: string;
  unitLabel?: string;
  name?: string;
  floor?: number;
  number?: string;
  status?: UnitStatus;
  rent?: number;
  deposit?: number;
  serviceCharge?: number;
  effectiveAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateUnitRequest = CreateUnitDto;
export type UpdateUnitRequest = UpdateUnitDto;

export interface Amenity {
  id: string;
  name: string;
  description?: string;
}

export type CreateAmenityRequest = CreateAmenityDto;

export interface OrgOnboardingConfig {
  id: string;
  orgId: string;
  settings: Record<string, unknown>;
}

export interface LeaseTemplate {
  id: string;
  orgId: string;
  name?: string;
  title?: string;
  version: number;
  documentMarkdown?: string | null;
  documentHtml?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateLeaseTemplateRequest = CreateLeaseTemplateDto;
export type NewLeaseTemplateVersionRequest = NewLeaseTemplateVersionDto;

export type InviteTenantRequest = InviteTenantDto;
export type InviteTenantResponse = InviteTokenResponseDto;

export type UnitInvite = InviteSummaryResponseDto;

export type OnboardingClaimRequest = ClaimInviteDto;

export type OnboardingClaimResponse = ClaimInviteResponseDto;

export type CompleteProfileRequest = CompleteProfileDto;
export type CompleteProfileResponse = CompleteProfileResponseDto;
export type SignLeaseRequest = SignLeaseDto;

export interface LeasePreviewResponse {
  leaseId: string;
  renderedPdfUrl?: string;
  documentHtml?: string;
}

export interface TenantLease {
  id: string;
  unitName?: string;
  propertyName?: string;
  startsAt?: string;
  endsAt?: string;
}

export interface Invoice {
  id: string;
  amountDue: number;
  dueDate: string;
  status: string;
  currency?: string;
}

export interface TenantBalance {
  amount: number;
  currency: string;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  createdAt?: string;
}

export interface ServiceProvider {
  id: string;
  name: string;
  category: string;
  phone?: string;
  whatsapp?: string;
}

export type TenantTicketCreateRequest = CreateTicketDto;

export interface TenantTicket {
  id: string;
  title: string;
  description: string;
  status: string;
}

export interface OwnerTicket {
  id: string;
  title: string;
  status: string;
  priority?: string;
}

export type UpdateOwnerTicketRequest = UpdateTicketDto;

export type GenerateInvoicesRequest = GenerateInvoicesDto;

export interface GenerateInvoicesResponse {
  generatedCount: number;
}

export interface InvoiceLinkResponse {
  token: string;
  expiresAt: string;
  url?: string;
}

export interface PublicInvoiceResponse {
  invoice: Invoice;
  orgName?: string;
  tenantName?: string;
}

export interface PresignUploadRequest {
  fileName: string;
  contentType: string;
  sizeBytes?: number;
}

export interface PresignUploadResponse {
  uploadUrl: string;
  key: string;
  headers?: Record<string, string>;
}

export interface CreateFileAssetRequest {
  key: string;
  fileName: string;
  contentType: string;
  sizeBytes?: number;
}

export interface FileAsset {
  assetId: string;
  url?: string;
}

export interface PresignDownloadResponse {
  downloadUrl: string;
}

export interface PropertyListResponse extends PaginatedResponse<Property> {}
export interface UnitListResponse extends PaginatedResponse<Unit> {}
export interface AmenityListResponse extends PaginatedResponse<Amenity> {}
export interface LeaseTemplateListResponse extends PaginatedResponse<LeaseTemplate> {}
export interface InvoiceListResponse extends PaginatedResponse<Invoice> {}
export interface NoticeListResponse extends PaginatedResponse<Notice> {}
export interface ServiceProviderListResponse extends PaginatedResponse<ServiceProvider> {}
export interface OwnerTicketListResponse extends PaginatedResponse<OwnerTicket> {}
export interface UnitInviteListResponse extends PaginatedResponse<UnitInvite> {}
