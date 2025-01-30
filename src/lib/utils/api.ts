const API_TIMEOUT = 30000 // 30 seconds timeout for API calls
export const MAX_RETRIES = 3

export async function fetchWithTimeout(url: string, options: RequestInit) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      let errorMessage = "Failed to fetch"
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorData.details || response.statusText
      } catch {
        errorMessage = response.statusText
      }
      throw new Error(errorMessage)
    }

    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Request timed out")
      }
    }
    throw error
  }
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred"
}

export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-cache, no-store, must-revalidate",
}