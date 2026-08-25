import { requireGuest } from '$lib/guards/auth'
export function load() { requireGuest() }
