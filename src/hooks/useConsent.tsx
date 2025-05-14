import { useContext } from 'react';
import { ConsentContext, ConsentContextType } from './ConsentContextDef';

export const useConsent = (): ConsentContextType => useContext(ConsentContext);