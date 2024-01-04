import { type MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Magic: The Griddening',
        short_name: 'Griddening',
        description: 'A daily puzzle game where you name magic cards meeting certain constraints',
        start_url: '/',
        display: 'standalone',
        background_color: '#3A1300',
        theme_color: '#3a3aec',
        icons:[
            {
                src: '/favicon-app.ico',
                sizes: 'any',
                type: 'image/x-icon'
            }
        ]
    }
}