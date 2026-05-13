import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GifResult {
  id:       string;
  title:    string;
  url:      string;   // Giphy page URL
  gifUrl:   string;   // direct .gif to store in message
  preview:  string;   // small preview for UI
  width:    string;
  height:   string;
}

@Injectable()
export class GiphyService {
  private readonly logger = new Logger(GiphyService.name);
  private readonly apiKey:  string;
  private readonly baseUrl: string;
  private readonly rating:  string;
  private readonly defaultLimit: number;

  constructor(private configService: ConfigService) {
    this.apiKey       = this.configService.get<string>('giphy.apiKey')!;
    this.baseUrl      = this.configService.get<string>('giphy.baseUrl')!;
    this.rating       = this.configService.get<string>('giphy.rating')!;
    this.defaultLimit = this.configService.get<number>('giphy.limit')!;
  }

  async search(query: string, limit?: number): Promise<GifResult[]> {
    try {
      const params = new URLSearchParams({
        api_key: this.apiKey,
        q:       query,
        limit:   String(limit ?? this.defaultLimit),
        rating:  this.rating,
        lang:    'en',
      });

      const res  = await fetch(`${this.baseUrl}/search?${params}`);
      const json = await res.json();
      return this.mapResults(json.data);
    } catch (err) {
      this.logger.error('Giphy search failed', err);
      throw new InternalServerErrorException('Failed to fetch GIFs');
    }
  }

  async trending(limit?: number): Promise<GifResult[]> {
    try {
      const params = new URLSearchParams({
        api_key: this.apiKey,
        limit:   String(limit ?? this.defaultLimit),
        rating:  this.rating,
      });

      const res  = await fetch(`${this.baseUrl}/trending?${params}`);
      const json = await res.json();
      return this.mapResults(json.data);
    } catch (err) {
      this.logger.error('Giphy trending failed', err);
      throw new InternalServerErrorException('Failed to fetch trending GIFs');
    }
  }

  // ── Helper ────────────────────────────────────────────────────

  private mapResults(data: any[]): GifResult[] {
    return data.map((gif) => ({
      id:      gif.id,
      title:   gif.title,
      url:     gif.url,
      gifUrl:  gif.images.original.url,        // full GIF — stored in message
      preview: gif.images.fixed_height.url,    // smaller — shown in picker UI
      width:   gif.images.original.width,
      height:  gif.images.original.height,
    }));
  }
}