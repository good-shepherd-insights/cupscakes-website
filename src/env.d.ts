/// <reference path="../.astro/types.d.ts" />

declare module 'sanity:client' {
  import type { SanityClient } from '@sanity/client';
  export const sanityClient: SanityClient;
}
