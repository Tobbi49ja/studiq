import { requireAuth } from '$lib/guards/auth'
export function load() { requireAuth() }
