import { apiGet, bearerPost } from './api';
import type { PushSubscribePayload, PushUnsubscribePayload, VapidKeyResponse } from '../types/push';

export function getVapidPublicKey() {
  return apiGet<VapidKeyResponse>('/push/vapid-public-key');
}

export function subscribePush(token: string, payload: PushSubscribePayload) {
  return bearerPost<unknown>('/push/subscribe', token, payload);
}

export function unsubscribePush(token: string, payload: PushUnsubscribePayload) {
  return bearerPost<unknown>('/push/unsubscribe', token, payload);
}
