import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class QueryService {
  private readonly endpoint =
    'https://n8n.srv1232458.hstgr.cloud/webhook/77116ce1-d6b1-4a3c-b64f-ae6b07b7f38e';

  constructor(private readonly http: HttpClient) {}

  sendQuery(query: string, sessionId: string) {
    return this.http.post(this.endpoint, { query, sessionId });
  }
}
