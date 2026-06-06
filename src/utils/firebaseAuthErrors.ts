export const getFriendlyAuthError = (error: any): string => {
  if (!error || !error.code) {
    return 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.';
  }

  switch (error.code) {
    case 'auth/invalid-email':
      return 'El correo electrónico no tiene un formato válido.';
    case 'auth/user-not-found':
      return 'No hay ninguna cuenta registrada con este correo.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Credenciales incorrectas. Verifica tu email y contraseña.';
    case 'auth/email-already-in-use':
      return 'Este correo electrónico ya está en uso por otra cuenta.';
    case 'auth/weak-password':
      return 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
    case 'auth/network-request-failed':
      return 'Error de red. Revisa tu conexión a internet e inténtalo de nuevo.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Por favor, intenta más tarde o restablece tu contraseña.';
    case 'auth/requires-recent-login':
      return 'Por motivos de seguridad, necesitas volver a iniciar sesión para realizar esta acción.';
    case 'auth/user-disabled':
      return 'Esta cuenta ha sido deshabilitada por violar nuestros términos de servicio.';
    case 'auth/operation-not-allowed':
      return 'Este método de inicio de sesión no está habilitado en este momento.';
    case 'ASYNC_OP_IN_PROGRESS':
      return 'Operación en progreso, por favor espera.';
    case 'SIGN_IN_CANCELLED':
      return 'Inicio de sesión cancelado.';
    case 'DEVELOPER_ERROR':
      return 'Error de configuración. Contacta al soporte técnico.';
    default:
      return error.message || 'Ocurrió un error al autenticar. Por favor, inténtalo de nuevo.';
  }
};
