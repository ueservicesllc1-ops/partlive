import firestore from '@react-native-firebase/firestore';
import { Agency, AgencyHost } from '../../../types/agency';

const AGENCIES = 'agencies';
const AGENCY_HOSTS = 'agencyHosts';

export const subscribeToAgency = (
  agencyId: string,
  onUpdate: (agency: Agency) => void,
  onError?: (error: Error) => void
): (() => void) => {
  return firestore()
    .collection(AGENCIES)
    .doc(agencyId)
    .onSnapshot(
      (doc) => {
        if (doc.exists()) {
          onUpdate({ id: doc.id, ...doc.data() } as Agency);
        }
      },
      (err) => {
        console.error('Error listening to agency:', err);
        if (onError) onError(err);
      }
    );
};

export const subscribeToAgencyHosts = (
  agencyId: string,
  onUpdate: (hosts: AgencyHost[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  return firestore()
    .collection(AGENCY_HOSTS)
    .where('agencyId', '==', agencyId)
    .where('status', '==', 'active')
    .onSnapshot(
      (snap) => {
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as AgencyHost[];
        onUpdate(list);
      },
      (err) => {
        console.error('Error listening to agency hosts:', err);
        if (onError) onError(err);
      }
    );
};
