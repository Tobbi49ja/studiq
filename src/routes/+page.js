import { get } from 'svelte/store'
import { token } from '$lib/stores/auth'
import { redirect } from '@sveltejs/kit'

export function load() {
  const t = get(token)
  if (!t) throw redirect(302, '/home')
  // if logged in, show dashboard (no redirect needed)
}
