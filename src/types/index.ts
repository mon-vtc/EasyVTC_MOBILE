export type { UserRole, UserStatus, AuthUser, AuthTokens,
              AuthStackParamList, ClientTabParamList,
              DriverDrawerParamList, AdminDrawerParamList,
              ManagerDrawerParamList }                    from './auth.types';

export type { ClientUser, DriverUser, AdminUser,
              ManagerUser, TypedUser }           from './user.types'; // Add Vehicle if we use the object 
export { isClient, isDriver, isAdmin, isManager }        from './user.types';

export type { LoginPayload, RegisterPayload,
              RegisterClientPayload, RegisterDriverPayload,
              ChangePasswordPayload, UpdateProfilePayload,
              UpdateClientProfilePayload,
              UpdateDriverProfilePayload,
              UpdateAdminProfilePayload,
              UpdateUserStatusPayload }                   from './payload.types';

export type { ApiResponse, AuthResponseData,
              AvatarUploadResponseData, PaginatedUsers,
              ListUsersParams }                           from './api.types';


export type {
  DocumentType, DocumentStatus,
  DriverDocument, UploadDocumentPayload,
  DocumentUploadResponse,
} from './document.types';

