/**
 * Translation helper for Google Play Billing errors to human-readable Spanish messages.
 */
export const getIapErrorMessage = (error: any): string => {
  if (!error) {
    return 'Ha ocurrido un error inesperado al procesar la compra.';
  }

  // Handle standard react-native-iap error codes
  const code = error.code || '';
  const message = error.message || '';

  // Standard react-native-iap / Google Play Billing codes
  switch (code) {
    case 'E_USER_CANCELLED':
      return 'La compra fue cancelada.';
    case 'E_ITEM_UNAVAILABLE':
      return 'Este paquete de monedas no está disponible en este momento para tu cuenta o región.';
    case 'E_BILLING_RESPONSE_RESULT_BILLING_UNAVAILABLE':
      return 'El servicio de facturación de Google Play no está disponible en tu dispositivo.';
    case 'E_ITEM_ALREADY_OWNED':
      return 'Ya tienes una compra pendiente para este paquete. Por favor, espera a que se complete o inicia la app nuevamente.';
    case 'E_SERVICE_ERROR':
    case 'E_BILLING_RESPONSE_RESULT_SERVICE_UNAVAILABLE':
      return 'El servicio de Google Play está temporalmente fuera de servicio. Inténtalo más tarde.';
    case 'E_NETWORK_ERROR':
    case 'E_BILLING_RESPONSE_RESULT_SERVICE_DISCONNECTED':
      return 'Error de conexión. Verifica tu conexión a internet e inténtalo de nuevo.';
    case 'E_DEVELOPER_ERROR':
    case 'E_BILLING_RESPONSE_RESULT_DEVELOPER_ERROR':
      return 'Error de configuración. Por favor, contacta a soporte técnico.';
    case 'E_UNKNOWN':
    case 'E_BILLING_RESPONSE_RESULT_ERROR':
      return 'Ocurrió un error al comunicarse con Google Play.';
    default:
      // Fallback matching substring message patterns
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes('cancel') || lowerMsg.includes('user_cancelled')) {
        return 'La compra fue cancelada.';
      }
      if (lowerMsg.includes('already owned') || lowerMsg.includes('item_already_owned')) {
        return 'Ya tienes una compra pendiente para este paquete. Por favor, inicia la app nuevamente.';
      }
      if (lowerMsg.includes('network') || lowerMsg.includes('internet')) {
        return 'Error de red. Por favor, verifica tu conexión a internet.';
      }
      if (lowerMsg.includes('unavailable')) {
        return 'El servicio de Google Play no está disponible en este dispositivo.';
      }
      return `Error al procesar la compra: ${message || 'Error desconocido'}`;
  }
};
