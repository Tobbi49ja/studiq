import { get } from 'svelte/store'
import { token } from '$lib/stores/auth'
import { redirect } from '@sveltejs/kit'

// Call in +page.js load function for protected routes
export function requireAuth() {
  const t = get(token)
  if (!t) throw redirect(302, '/home')
}

// Call in +page.js load function for guest-only routes
export function requireGuest() {
  const t = get(token)
  if (t) throw redirect(302, '/')
}
