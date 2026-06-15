export type PkBattleStatus =
  | 'invited'
  | 'accepted'
  | 'rejected'
  | 'active'
  | 'finished'
  | 'cancelled'
  | 'expired';

export type PkBattleResult =
  | 'hostA_win'
  | 'hostB_win'
  | 'draw'
  | 'cancelled';

export type PkInviteStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export interface PkBattle {
  id: string;
  hostAId: string;
  hostBId: string;
  hostALiveId: string;
  hostBLiveId?: string;
  hostAName: string;
  hostBName: string;
  hostAPhotoURL?: string;
  hostBPhotoURL?: string;
  status: PkBattleStatus;
  durationSeconds: number;
  startedAt?: any;
  endsAt?: any;
  finishedAt?: any;
  hostAScore: number;
  hostBScore: number;
  hostADiamonds: number;
  hostBDiamonds: number;
  hostAGiftsCount: number;
  hostBGiftsCount: number;
  winnerId?: string;
  result?: PkBattleResult;
  eventId?: string;
  createdAt: any;
  updatedAt: any;
}

export interface PkInvite {
  id: string;
  pkBattleId: string;
  fromHostId: string;
  toHostId: string;
  fromLiveId: string;
  toLiveId?: string;
  status: PkInviteStatus;
  message?: string;
  expiresAt: any;
  createdAt: any;
  updatedAt: any;
  respondedAt?: any;
}

export interface PkGiftContribution {
  id: string;
  pkBattleId: string;
  giftEventId: string;
  senderId: string;
  receiverHostId: string;
  giftId: string;
  giftName: string;
  diamonds: number;
  beansGenerated: number;
  createdAt: any;
}
