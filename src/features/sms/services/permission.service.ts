import { PermissionsAndroid, Platform, Alert } from 'react-native';

export interface PermissionStatus {
  smsGranted: boolean;
  notificationGranted: boolean;
}

/**
 * Checks current status of SMS and Notification permissions on Android.
 */
export async function checkPermissions(): Promise<PermissionStatus> {
  if (Platform.OS !== 'android') {
    return { smsGranted: true, notificationGranted: true };
  }

  try {
    const hasReceiveSms = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    );
    const hasReadSms = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
    );

    let hasNotification = true;
    if (Platform.Version >= 33) {
      hasNotification = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
    }

    return {
      smsGranted: hasReceiveSms && hasReadSms,
      notificationGranted: hasNotification,
    };
  } catch (err) {
    console.error('Error checking permissions:', err);
    return { smsGranted: false, notificationGranted: false };
  }
}

/**
 * Requests SMS and Notification permissions from the user.
 */
export async function requestSmsAndNotificationPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  try {
    const permissionsToRequest: (typeof PermissionsAndroid.PERMISSIONS)[keyof typeof PermissionsAndroid.PERMISSIONS][] = [
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      PermissionsAndroid.PERMISSIONS.READ_SMS,
    ];

    if (Platform.Version >= 33) {
      permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }

    const results = await PermissionsAndroid.requestMultiple(permissionsToRequest);

    const receiveSms = results[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS];
    const readSms = results[PermissionsAndroid.PERMISSIONS.READ_SMS];

    const isSmsGranted =
      receiveSms === PermissionsAndroid.RESULTS.GRANTED &&
      readSms === PermissionsAndroid.RESULTS.GRANTED;

    return isSmsGranted;
  } catch (err) {
    console.error('Error requesting SMS permissions:', err);
    return false;
  }
}
