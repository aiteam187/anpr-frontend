export interface VapidKeyResponse {
  public_key: string;
}

export interface PushSubscribePayload {
  endpoint: string;
  keys: Record<string, string>;
}

export interface PushUnsubscribePayload {
  endpoint: string;
}
