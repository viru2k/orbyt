import { UserResponseDto } from '../../api/models/user-response-dto';
import { ClientResponseDto } from '../../api/models/client-response-dto';
import { ProductResponseDto } from '../../api/models/product-response-dto';
import { FileUploadResponseDto } from '../../api/models/file-upload-response-dto';

export type AvatarEntity = UserResponseDto | ClientResponseDto | ProductResponseDto;
export type AvatarSize = 'normal' | 'large' | 'xlarge';
export type AvatarShape = 'square' | 'circle';

export interface AvatarDisplayConfig {
  entity: AvatarEntity;
  size?: AvatarSize;
  shape?: AvatarShape;
  showUploadButton?: boolean;
  clickable?: boolean;
}

export interface EntityWithAvatar {
  id: number;
  avatar?: FileUploadResponseDto;
  displayName: string;
  initials: string;
}

// Utility functions types
export interface AvatarUtils {
  getEntityDisplayName(entity: AvatarEntity): string;
  getEntityInitials(entity: AvatarEntity): string;
  getAvatarUrl(entity: AvatarEntity, avatar?: FileUploadResponseDto): string | null;
  generateInitials(name: string): string;
}

// Size mappings para PrimeNG Avatar
export const AVATAR_SIZE_MAPPING = {
  normal: 'normal',
  large: 'large', 
  xlarge: 'xlarge'
} as const;

// CSS classes para diferentes contextos
export const AVATAR_CONTEXT_CLASSES = {
  table: 'entity-avatar-table',
  modal: 'entity-avatar-modal',
  profile: 'entity-avatar-profile',
  card: 'entity-avatar-card'
} as const;