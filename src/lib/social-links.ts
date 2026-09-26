/**
 * Gulel's social profiles, shown on the /go link-in-bio page.
 *
 * TODO(marketing): replace the placeholder hrefs with the real profile URLs
 * once the accounts are live. Entries with an empty href are not rendered.
 */
export interface SocialLink {
  label: string;
  href: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  // Planned handles (marketing/02-channels-and-characters.md). Fill in once each account exists.
  { label: 'Instagram', href: '' }, // https://www.instagram.com/thegulel
  { label: 'YouTube', href: '' }, // https://www.youtube.com/@thegulel
  { label: 'Facebook', href: '' }, // https://www.facebook.com/thegulel
  { label: 'WhatsApp Channel', href: '' }, // channel invite link
  { label: 'Threads', href: '' }, // https://www.threads.net/@thegulel
];
