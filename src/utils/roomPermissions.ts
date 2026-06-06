import { RoomRole, RoomPermission, ROOM_ROLE_PERMISSIONS } from '../constants/roomPermissions';

export const hasRoomPermission = (role: RoomRole | null, permission: RoomPermission): boolean => {
  if (!role) return false;
  const permissions = ROOM_ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(permission) : false;
};

export const canManageRole = (actorRole: RoomRole | null, targetRole: RoomRole | null): boolean => {
  if (!actorRole || !targetRole) return false;
  if (actorRole === 'owner') {
    return targetRole !== 'owner'; // Owner can manage all except owner
  }
  if (actorRole === 'host') {
    return !['owner', 'host'].includes(targetRole); // Host can manage mod, speaker, listener
  }
  if (actorRole === 'moderator') {
    return !['owner', 'host', 'moderator'].includes(targetRole); // Mod can manage speaker, listener
  }
  return false; // Speakers and listeners can't manage anyone
};

export const canPromoteToRole = (actorRole: RoomRole | null, newRole: RoomRole): boolean => {
  if (!actorRole) return false;
  if (actorRole === 'owner') {
    return ['host', 'moderator', 'speaker', 'listener'].includes(newRole);
  }
  if (actorRole === 'host') {
    return ['speaker', 'listener'].includes(newRole);
  }
  return false;
};

export const canKickMember = (actorRole: RoomRole | null, targetRole: RoomRole | null): boolean => {
  return canManageRole(actorRole, targetRole) && hasRoomPermission(actorRole, 'KICK_MEMBER');
};

export const canMuteMember = (actorRole: RoomRole | null, targetRole: RoomRole | null): boolean => {
  return canManageRole(actorRole, targetRole) && hasRoomPermission(actorRole, 'MUTE_MEMBER');
};

export const canHideMessage = (actorRole: RoomRole | null, messageSenderRole: RoomRole | null): boolean => {
  if (!actorRole) return false;
  if (!hasRoomPermission(actorRole, 'HIDE_MESSAGE')) return false;
  if (!messageSenderRole) return true;
  return canManageRole(actorRole, messageSenderRole) || actorRole === messageSenderRole;
};

export const isElevatedRoomRole = (role: RoomRole | null): boolean => {
  if (!role) return false;
  return ['owner', 'host', 'moderator'].includes(role);
};

export const isSpeakerRole = (role: RoomRole | null): boolean => {
  if (!role) return false;
  return ['owner', 'host', 'moderator', 'speaker'].includes(role);
};

export const getAvailableRoomActions = (
  actorRole: RoomRole | null,
  targetRole: RoomRole | null,
  isOwnUser: boolean
) => {
  return {
    canMute: !isOwnUser && canMuteMember(actorRole, targetRole),
    canKick: !isOwnUser && canKickMember(actorRole, targetRole),
    canAssignSpeaker: canPromoteToRole(actorRole, 'speaker') && isSpeakerRole(targetRole),
    canAssignHost: actorRole === 'owner' && targetRole !== 'owner',
    canAssignMod: actorRole === 'owner' && targetRole !== 'owner',
  };
};
