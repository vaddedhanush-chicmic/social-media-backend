import { registerAs } from '@nestjs/config';

export default registerAs('giphy', () => ({
  apiKey: process.env.GIPHY_API_KEY,
  baseUrl: 'https://api.giphy.com/v1/gifs',
  limit: 20,
  rating: 'g', // g | pg | pg-13 | r
}));