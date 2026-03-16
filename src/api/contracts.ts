import type {
  AcceptLeaseDto,
  AcceptLeaseResponseDto,
  AmenityResponseDto,
  ClaimInviteDto,
  ClaimInviteResponseDto,
  CompleteProfileDto,
  CompleteProfileResponseDto,
  ConsumeMagicLinkDto,
  CreateAmenityDto,
  CreateLeaseTemplateDto,
  CreatePropertyDto,
  CreateServiceDto,
  CreateTicketDto,
  CreateUnitDto,
  GenerateInvoicesDto,
  GenerateInvoicesResponseDto,
  HouseUnitResponseDto,
  InviteSummaryResponseDto,
  InviteTenantDto,
  InviteTokenResponseDto,
  LeaseTemplatePreviewResponseDto,
  LeaseTemplateResponseDto,
  LoginDto,
  ServiceProviderResponseDto,
  LogoutDto,
  NewLeaseTemplateVersionDto,
  PendingLeaseAcceptanceResponseDto,
  PropertyResponseDto,
  RefreshDto,
  RegisterOwnerDto,
  RequestMagicLinkDto,
  TenantLeaseResponseDto,
  UpdateAmenityDto,
  UpdatePropertyDto,
  UpdateServiceDto,
  UpdateTicketDto,
  UpdateUnitDto
} from "@/src/api/generated";
import type { PaginatedResponse, TokenPair } from "@/src/types/contracts";

export type RegisterOwnerRequest = RegisterOwnerDto;
export type LoginRequest = LoginDto;
export type RequestMagicLinkRequest = RequestMagicLinkDto;
export type ConsumeMagicLinkRequest = ConsumeMagicLinkDto;
export type RefreshRequest = RefreshDto;
export type LogoutRequest = LogoutDto;

export type AuthTokensResponse = TokenPair;

export type Property = PropertyResponseDto;

export type CreatePropertyRequest = CreatePropertyDto;
export type UpdatePropertyRequest = UpdatePropertyDto;

export type Unit = HouseUnitResponseDto;

export type CreateUnitRequest = CreateUnitDto;
export type UpdateUnitRequest = UpdateUnitDto;

export type Amenity = AmenityResponseDto;

export type CreateAmenityRequest = CreateAmenityDto;
export type UpdateAmenityRequest = UpdateAmenityDto;

export interface OrgOnboardingConfig {
  id: string;
  orgId: string;
  settings: Record<string, unknown>;
}

export type LeaseTemplate = LeaseTemplateResponseDto;

export type CreateLeaseTemplateRequest = CreateLeaseTemplateDto;
export type NewLeaseTemplateVersionRequest = NewLeaseTemplateVersionDto;
export interface LeaseTemplateListParams {
  propertyId?: string;
  unitId?: string;
}

export type InviteTenantRequest = InviteTenantDto;
export type InviteTenantResponse = InviteTokenResponseDto;

export type UnitInvite = InviteSummaryResponseDto;

export type OnboardingClaimRequest = ClaimInviteDto;

export type OnboardingClaimResponse = ClaimInviteResponseDto;

export interface CompleteProfileRequest extends CompleteProfileDto {
  password: string;
}
export type CompleteProfileResponse = CompleteProfileResponseDto;
export type AcceptLeaseRequest = AcceptLeaseDto;
export type AcceptLeaseResponse = AcceptLeaseResponseDto;
export type SignLeaseRequest = AcceptLeaseRequest;

export type LeasePreviewResponse = LeaseTemplatePreviewResponseDto;

export type TenantLease = TenantLeaseResponseDto;
export type PendingLeaseAcceptanceResponse = PendingLeaseAcceptanceResponseDto;

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

export type CreateServiceProviderRequest = CreateServiceDto;

export type UpdateServiceProviderRequest = UpdateServiceDto;

export type ServiceProvider = ServiceProviderResponseDto;

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

export type GenerateInvoicesResponse = GenerateInvoicesResponseDto;

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
  fileName?: string;
  filename?: string;
  contentType: string;
  sizeBytes?: number;
}

export interface PresignUploadResponse {
  uploadUrl: string;
  key: string;
  headers?: Record<string, string>;
  method?: string;
  expiresInSeconds?: number;
}

export interface CreateFileAssetRequest {
  key?: string;
  fileName?: string;
  filename?: string;
  contentType?: string;
  sizeBytes?: number;
  type?: string;
  url?: string;
  checksum?: string;
}

export interface FileAsset {
  assetId: string;
  id?: string;
  url?: string;
}

export interface PresignDownloadResponse {
  downloadUrl: string;
  expiresInSeconds?: number;
}

export interface PropertyListResponse extends PaginatedResponse<Property> { }
export interface UnitListResponse extends PaginatedResponse<Unit> { }
export interface AmenityListResponse extends PaginatedResponse<Amenity> { }
export interface LeaseTemplateListResponse extends PaginatedResponse<LeaseTemplate> { }
export interface InvoiceListResponse extends PaginatedResponse<Invoice> { }
export interface NoticeListResponse extends PaginatedResponse<Notice> { }
export interface ServiceProviderListResponse extends PaginatedResponse<ServiceProvider> { }
export interface OwnerTicketListResponse extends PaginatedResponse<OwnerTicket> { }
export interface UnitInviteListResponse extends PaginatedResponse<UnitInvite> { }
