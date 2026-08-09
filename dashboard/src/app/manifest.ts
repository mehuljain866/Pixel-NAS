import { MetadataRoute } from 'next'

export const dynamic = "force-static";
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pixel-NAS Dashboard',
    short_name: 'Pixel-NAS',
    description: 'On-Demand Telemetry for Pixel-NAS pipeline.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
