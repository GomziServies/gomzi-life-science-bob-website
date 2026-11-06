/**
 * Where "Edit label" goes for a product: the label studio for that pack (jar templates, or the pouch / sachet label), coming
 * back to `returnTo` after Save. `saved`: the product already has a saved label for this pack, and the studio reopens it as saved.
 */
export function labelEditPath(productId: string, pack: 'jar' | 'pouch' | 'sachet' | undefined, returnTo = `/details?preview=${productId}`, saved = false): string {
  const query = new URLSearchParams();
  if (pack && pack !== 'jar') query.set('pack', pack);
  if (saved) query.set('saved', '1');
  query.set('returnTo', returnTo);
  return `/customize/${productId}?${query}`;
}

/** Whether a saved label (made for `labelPack`, a jar wrap when not set) is the one to reopen when editing `pack`. */
export const editsSaved = (banner: { pack?: string; origin?: string } | undefined | null, pack: string | undefined) =>
  !!banner && banner.origin !== 'graphics_team' && (banner.pack ?? 'jar') === (pack ?? 'jar');
