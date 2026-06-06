import { sendRoomSystemMessage } from './messagesService';

export const sendUserJoinedMessage = async (roomId: string, displayName: string): Promise<void> => {
  await sendRoomSystemMessage(roomId, `✨ ${displayName} se ha unido a la sala`);
};

export const sendUserLeftMessage = async (roomId: string, displayName: string): Promise<void> => {
  await sendRoomSystemMessage(roomId, `🚪 ${displayName} salió de la sala`);
};

export const sendMicApprovedMessage = async (roomId: string, displayName: string): Promise<void> => {
  await sendRoomSystemMessage(roomId, `🎙️ ${displayName} subió al escenario`);
};

export const sendMicRejectedMessage = async (roomId: string, displayName: string): Promise<void> => {
  await sendRoomSystemMessage(roomId, `❌ Solicitud de micrófono de ${displayName} rechazada`);
};

export const sendUserMutedMessage = async (roomId: string, displayName: string): Promise<void> => {
  await sendRoomSystemMessage(roomId, `🔇 ${displayName} fue silenciado`);
};

export const sendUserKickedMessage = async (roomId: string, displayName: string): Promise<void> => {
  await sendRoomSystemMessage(roomId, `🥾 ${displayName} fue expulsado de la sala`);
};
