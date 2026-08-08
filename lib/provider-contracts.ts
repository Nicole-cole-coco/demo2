/**
 * 首版不启用地图算路和交易票务。以下契约只用于保留未来扩展边界，
 * 业务生成代码不得直接调用供应商，也不得在未启用时伪造精确结果。
 */
export interface FutureMapProvider {
  readonly id: string;
  readonly enabled: boolean;
  searchPoi(input: { cityId: string; keyword: string }): Promise<unknown>;
  route(input: { origin: string; destination: string; mode: "transit" | "walking" | "driving" }): Promise<unknown>;
}

export interface FutureTicketProvider {
  readonly id: string;
  readonly enabled: boolean;
  getPublicReference(input: { cityId: string; poiId: string; visitDate?: string }): Promise<unknown>;
}

export const V1_PROVIDER_CAPABILITIES = {
  mapRouting: { enabled: false, mode: "external-map-verification-only" },
  paidTicketing: { enabled: false, mode: "public-reference-price-only" },
} as const;
