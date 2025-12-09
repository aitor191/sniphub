import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ExplainCodeResponse {
  explanation: string;
  provider: string;
  cached: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  constructor(private api: ApiService) { }

  explainCode(code: string): Observable<ExplainCodeResponse> {
    return this.api.post<ExplainCodeResponse>('/ai/explain', { code });
  }
}