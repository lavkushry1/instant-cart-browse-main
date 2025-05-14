import { useContext } from 'react';
import { AuthContext, AuthContextType } from './AuthContextDef';

export const useAuth = (): AuthContextType => useContext(AuthContext);