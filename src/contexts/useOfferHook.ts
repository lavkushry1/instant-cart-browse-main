import { useContext } from 'react';
import { OfferContext, OfferContextType } from './OfferContextDef';

export const useOffers = (): OfferContextType => {
    const context = useContext(OfferContext);
    if (context === undefined) {
        throw new Error('useOffers must be used within an OfferProvider');
    }
    return context;
};