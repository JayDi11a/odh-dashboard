import { UserSettings } from 'mod-arch-core';
import { useAppContext } from '../context/AppContext';

const useUser = (): UserSettings => {
  const { user } = useAppContext();
  return user;
};

export default useUser;
