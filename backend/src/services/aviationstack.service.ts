import { config } from '../config';
import { AppError } from '../middleware/error.middleware';

export interface AviationstackFlightRecord {
  flight_date: string;
  flight_status: string;
  departure: {
    airport: string | null;
    timezone: string | null;
    iata: string | null;
    icao: string | null;
    terminal: string | null;
    gate: string | null;
    delay: number | null;
    scheduled: string | null;
    estimated: string | null;
    actual: string | null;
    estimated_runway: string | null;
    actual_runway: string | null;
  };
  arrival: {
    airport: string | null;
    timezone: string | null;
    iata: string | null;
    icao: string | null;
    terminal: string | null;
    gate: string | null;
    baggage: string | null;
    delay: number | null;
    scheduled: string | null;
    estimated: string | null;
    actual: string | null;
    estimated_runway: string | null;
    actual_runway: string | null;
  };
  airline: {
    name: string | null;
    iata: string | null;
    icao: string | null;
  };
  flight: {
    number: string | null;
    iata: string | null;
    icao: string | null;
    codeshared: {
      airline_name?: string | null;
      airline_iata?: string | null;
      airline_icao?: string | null;
      flight_number?: string | null;
      flight_iata?: string | null;
      flight_icao?: string | null;
    } | null;
  };
  aircraft: {
    registration?: string | null;
    iata?: string | null;
    icao?: string | null;
    icao24?: string | null;
  } | null;
  live: {
    updated?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    altitude?: number | null;
    direction?: number | null;
    speed_horizontal?: number | null;
    speed_vertical?: number | null;
    is_ground?: boolean | null;
  } | null;
}

export interface AviationstackPagination {
  limit: number;
  offset: number;
  count: number;
  total: number;
}

export interface AviationstackResponse {
  pagination?: AviationstackPagination;
  data?: AviationstackFlightRecord[];
  error?: {
    code: string;
    message: string;
    context?: Record<string, unknown>;
  };
}

export interface AviationstackSearchParams {
  dep_iata?: string;
  arr_iata?: string;
  flight_date?: string;
  flight_status?: string;
  airline_name?: string;
  airline_iata?: string;
  flight_number?: string;
  flight_iata?: string;
  limit?: number;
  offset?: number;
}

export class AviationstackService {
  private readonly timeoutMs = 12000;

  /**
   * Check if the API key is configured.
   */
  isConfigured(): boolean {
    return Boolean(config.aviationstackApiKey && config.aviationstackApiKey.trim().length > 0);
  }

  /**
   * Fetch live flight records from Aviationstack API.
   */
  async fetchFlights(params: AviationstackSearchParams): Promise<AviationstackResponse> {
    if (!this.isConfigured()) {
      throw new AppError(
        'Aviationstack API key is not configured in backend environment.',
        500,
        'PROVIDER_NOT_CONFIGURED'
      );
    }

    const baseUrl = config.aviationstackBaseUrl.replace(/\/+$/, '');
    const endpointUrl = baseUrl.endsWith('/v1') ? `${baseUrl}/flights` : `${baseUrl}/v1/flights`;

    return this.executeRequest(endpointUrl, params);
  }

  /**
   * Internal request executor with timeout and HTTPS restriction handling.
   */
  private async executeRequest(
    targetUrl: string,
    params: AviationstackSearchParams,
    allowHttpFallback = true
  ): Promise<AviationstackResponse> {
    const url = new URL(targetUrl);

    // Append authentication access key
    url.searchParams.set('access_key', config.aviationstackApiKey.trim());

    // Map supported query parameters
    if (params.dep_iata) url.searchParams.set('dep_iata', params.dep_iata.trim().toUpperCase());
    if (params.arr_iata) url.searchParams.set('arr_iata', params.arr_iata.trim().toUpperCase());
    if (params.flight_date) url.searchParams.set('flight_date', params.flight_date.trim());
    if (params.flight_status) url.searchParams.set('flight_status', params.flight_status.trim());
    if (params.airline_name) url.searchParams.set('airline_name', params.airline_name.trim());
    if (params.airline_iata) url.searchParams.set('airline_iata', params.airline_iata.trim().toUpperCase());
    if (params.flight_number) url.searchParams.set('flight_number', params.flight_number.trim());
    if (params.flight_iata) url.searchParams.set('flight_iata', params.flight_iata.trim().toUpperCase());
    if (typeof params.limit === 'number') url.searchParams.set('limit', String(params.limit));
    if (typeof params.offset === 'number') url.searchParams.set('offset', String(params.offset));

    let response: globalThis.Response;
    try {
      response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        throw new AppError('Aviationstack request timed out. Please try again.', 504, 'PROVIDER_TIMEOUT');
      }
      throw new AppError('Failed to connect to Aviationstack service.', 502, 'PROVIDER_NETWORK_ERROR');
    }

    let payload: AviationstackResponse;
    try {
      payload = (await response.json()) as AviationstackResponse;
    } catch {
      throw new AppError('Invalid JSON response received from Aviationstack.', 502, 'PROVIDER_MALFORMED_RESPONSE');
    }

    // Check for Aviationstack API-level errors
    if (payload.error) {
      // Automatic fallback if free plan restricts HTTPS
      if (
        allowHttpFallback &&
        (payload.error.code === 'https_access_restricted' ||
          payload.error.message?.toLowerCase().includes('https encryption')) &&
        url.protocol === 'https:'
      ) {
        const httpUrl = targetUrl.replace(/^https:/i, 'http:');
        return this.executeRequest(httpUrl, params, false);
      }

      // Automatic fallback if free plan does not support historical/future flight_date
      if (
        params.flight_date &&
        (payload.error.code === 'function_access_restricted' ||
          payload.error.message?.toLowerCase().includes('subscription plan does not support this api function') ||
          payload.error.message?.toLowerCase().includes('access restricted'))
      ) {
        const retryParams = { ...params };
        delete retryParams.flight_date;
        return this.executeRequest(targetUrl, retryParams, allowHttpFallback);
      }

      throw new AppError(
        `Aviationstack error: ${payload.error.message || payload.error.code || 'Unknown provider error'}`,
        502,
        'PROVIDER_ERROR'
      );
    }

    if (!response.ok) {
      throw new AppError(
        `Aviationstack returned HTTP ${response.status}.`,
        response.status >= 500 ? 502 : 400,
        'PROVIDER_HTTP_ERROR'
      );
    }

    return payload;
  }
}

export const aviationstackService = new AviationstackService();
