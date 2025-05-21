import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export function createClient() {
  try {
    const cookieStore = cookies()

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase URL or key is missing")
      return null
    }

    return createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            console.error("Error setting cookie:", error)
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: "", ...options })
          } catch (error) {
            console.error("Error removing cookie:", error)
          }
        },
      },
    })
  } catch (error) {
    console.error("Error creating Supabase server client:", error)
    return null
  }
}
