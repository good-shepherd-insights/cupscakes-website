import type { SlugValidationContext } from 'sanity';

/**
 * Rejects publishing a document whose slug matches another document
 * of the same `_type`. Sanity's `slug` field has no built-in uniqueness
 * constraint — this is the standard async-custom-validator pattern.
 */
export function validateUniqueSlug(documentType: string) {
  return async (slug: { current?: string } | undefined, context: SlugValidationContext) => {
    if (!slug?.current) return true;

    const { document, getClient } = context;
    const client = getClient({ apiVersion: '2026-05-01' });
    const id = document?._id?.replace(/^drafts\./, '');

    const conflictId = await client.fetch<string | null>(
      `*[_type == $type && !(_id in [$draft, $published]) && slug.current == $slug][0]._id`,
      { type: documentType, draft: `drafts.${id}`, published: id, slug: slug.current }
    );

    return conflictId ? 'Slug is already in use by another document — slugs must be unique.' : true;
  };
}
