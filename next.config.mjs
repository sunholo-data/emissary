/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    reactStrictMode: true,
    // Add environment variables configuration
    experimental: {
        // Enable runtime configuration
        serverComponentsExternalPackages: ['fs'],
      },
    // Add this to ensure environment variables are refreshed
    serverRuntimeConfig: {
        // Will only be available on the server side
        ENV_FILE: process.env.ENV_FILE
    },
    publicRuntimeConfig: {
        // Will be available on both server and client
        NEXT_PUBLIC_FIREBASE_CONFIG: process.env.NEXT_PUBLIC_FIREBASE_CONFIG
    },
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'firebasestorage.googleapis.com',
            port: '',
            pathname: '/**',
          },
          {
            protocol: 'http',
            hostname: '127.0.0.1',
            port: '9199',  // Specify port for local Firebase emulator
            pathname: '/**',            
          }
        ],
      },
    headers: async () => {
      const headers = [
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin'
        }
      ];
  
      // Add stricter CSP in production
      if (process.env.NODE_ENV === 'production') {
        headers.push({
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseapp.com https://*.firebase.com https://*.googleapis.com",
            "style-src 'self' 'unsafe-inline'",
            "media-src 'self' https://*.googleapis.com https://firebasestorage.googleapis.com", // Add this line
            "img-src 'self' data: https:",
            "frame-src 'self' https://*.firebaseapp.com https://*.firebase.com https://*.googleapis.com",
            "connect-src 'self' https://*.firebase.com https://*.firebaseapp.com https://*.googleapis.com",
            "font-src 'self' data:",
          ].join('; ')
        });
      } else {
        headers.push({
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:",
            "style-src 'self' 'unsafe-inline' https: http:",
            "img-src 'self' data: https: http:",
            "media-src 'self' https: http:", // Add this line
            "frame-src 'self' https: http:",
            "connect-src 'self' https: http: ws: wss:",
            "font-src 'self' https: http:",
          ].join('; ')
        });
      }
  
      return [
        {
          source: '/:path*',
          headers,
        }
      ];
    },
  
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
          child_process: false,
          perf_hooks: false
        };
      }
      return config;
    }
  };
  
  export default nextConfig;