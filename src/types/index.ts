export type { UserRole, UserStatus, AuthUser, AuthTokens,
              AuthStackParamList, ClientTabParamList,
              DriverDrawerParamList, AdminDrawerParamList,
              ManagerDrawerParamList, ManagerReservationsStackParamList, 
              ManagerNotificationsStackParamList,
              ManagersStackParamList,
              ClientsStackParamList,
              AdminAuditLogsStackParamList
            } from './auth.types';

export type { ClientUser, DriverUser, AdminUser,
              ManagerUser, TypedUser,
              Vehicle, DriverProfile, DriverWithUser } from './user.types';
export { isClient, isDriver, isAdmin, isManager }        from './user.types';

export type { LoginPayload, RegisterPayload,
              RegisterClientPayload, RegisterDriverPayload,
              ChangePasswordPayload, UpdateProfilePayload,
              UpdateClientProfilePayload,
              // UpdateDriverProfilePayload,
              // UpdateAdminProfilePayload,
              UpdateUserStatusPayload,
              ChangeDriverStatusPayload }                   from './payload.types';

export type { ApiResponse, AuthResponseData,
              AvatarUploadResponseData, PaginatedUsers, PaginatedDrivers,
              ListUsersParams, ListDriversParams }                           from './api.types';


export type {
  DocumentType, DocumentStatus,
  DriverDocument, UploadDocumentPayload,
  DocumentUploadResponse,
} from './document.types';

export type {
  AvailableDriverDto,
  Reservation
} from './reservations.types';

export type {
  DriverPlanningResult,
  PlanningPeriod,
  PlanningReservation,
  DriverRevenuesResult,
  RevenuesPeriod,
  RevenueTrip,
  WeeklyScheduleDay,
  WeeklyScheduleResult,
  SetScheduleDto,
  DayOfWeek
} from './drivers.types';

export type {
  UserProfile,
  CreateManagerDto,
  UpdateManagerDto,
  ChangeManagerStatusDto,
  ManagerListFilters,
  ManagerListResult,
  ClientGlobalStats,
  ClientWithStats,
  ClientListFilters,
  ClientListResult,
  ClientTripItem,
  ClientTripsResult,
  ManagerPermission,
  SetManagerPermissionsDto,
  ManagerPermissionsResult,
  AdminStats,
  AdminStatsFilters,
  AdminDashboard,
  AdminDashboardPeriod,
  RevenueChartEntry,
  TopDriver,
  PopularRoute,
  PeakHourSlot
} from './admin.types';
export { MANAGER_PERMISSIONS, PERMISSION_LABELS } from './admin.types';

export type {
  DiscountType,
  PromoCode,
  CreatePromoCodeDto,
  UpdatePromoCodeDto,
  PromoCodeListFilters,
  PromoCodeListResult,
  UserPromoCodesResult,
  UserPromoCodeItem,
  BulkAssignDto,
  BulkAssignResult
} from './promo-codes.types';

export type {
  CampaignType, CampaignStatus,
  MarketingCampaign,
  CreateCampaignDto,
  UpdateCampaignDto,
  ClientSummary,
  ClientBaseStats,
  ClientBaseFilters,
  ClientBaseResult,
  CampaignListResult,
  UpdateMarketingConsentsDto,
  MyMarketingProfile,
} from './marketing.types';

export type {
  AuditLog,
  AuditLogListFilters,
  AuditLogListResult,
} from './audit-logs.types';


export type {
  Notification,
  NotificationType,
  NotificationListFilters,
  RealtimeNotificationPayload,
} from './notifications.types';
export { NOTIFICATION_ICONS, NOTIFICATION_ACTION_LABELS , NotificationIconConfig} from './notifications.types';

export type {
  ChatMessage,
  ChatSenderRole,
  SendMessageDto,
  ChatMessageListResult,
  ActiveConversation,
  // chatMessageListFilters
} from './chats.type';

export type {
  CommissionZone,
  CommissionRateType,
  CommissionSetting,
  CreateCommissionSettingDto,
  UpdateCommissionSettingDto,
  CommissionDetail,
  CommissionPeriod
} from './commission.types';

export type {
  RgpdExport,

} from './rgpd.type';