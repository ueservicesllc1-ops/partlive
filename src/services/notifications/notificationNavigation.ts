import { Linking } from 'react-native';
import { MAIN_ROUTES } from '../../app/routes';

/**
 * Routes actions to specific navigation paths according to notification values.
 */
export function handleNotificationAction(notificationData: any, navigation: any) {
  if (!notificationData) return;

  const { actionType, actionValue } = notificationData;
  if (!actionType || actionType === 'none') return;

  switch (actionType) {
    case 'open_profile':
      if (actionValue) {
        navigation.navigate(MAIN_ROUTES.PUBLIC_PROFILE, { userId: actionValue });
      }
      break;
    case 'open_room':
      if (actionValue) {
        navigation.navigate(MAIN_ROUTES.ROOM_DETAILS, { roomId: actionValue });
      }
      break;
    case 'open_live':
      if (actionValue) {
        navigation.navigate(MAIN_ROUTES.LIVE_DETAILS, { liveId: actionValue });
      }
      break;
    case 'open_game_session':
      if (actionValue) {
        // Find or build params or navigate to session
        navigation.navigate(MAIN_ROUTES.GAME_SESSION, { sessionId: actionValue });
      }
      break;
    case 'open_missions':
      navigation.navigate(MAIN_ROUTES.MISSIONS);
      break;
    case 'open_wallet':
      navigation.navigate(MAIN_ROUTES.WALLET);
      break;
    case 'open_host_dashboard':
      navigation.navigate(MAIN_ROUTES.HOST_DASHBOARD);
      break;
    case 'open_payout':
      if (actionValue) {
        navigation.navigate(MAIN_ROUTES.PAYOUT_DETAILS, { payoutId: actionValue });
      }
      break;
    case 'open_vip':
      // VIP subscriptions screen/tab
      navigation.navigate(MAIN_ROUTES.SETTINGS);
      break;
    case 'open_url':
      if (actionValue) {
        Linking.openURL(actionValue).catch((err) =>
          console.error('Failed to open notification URL:', err)
        );
      }
      break;
    default:
      console.log('Unhandled action type:', actionType);
      break;
  }
}
