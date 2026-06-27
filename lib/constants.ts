/// Fixed PRM reference price in USD, scaled to 8 decimals (Spec 4.8): $0.10 per
/// PRM = 10_000_000. Mirrors the backend `PRM_REFERENCE_PRICE_8DEC`. Used for
/// PRM-to-USD conversions (e.g. the reserve ratio's circulating-PRM-value input)
/// until PRM trades on a market, at which point the real price replaces it.
export const PRM_REFERENCE_PRICE_8DEC = 10_000_000n;
