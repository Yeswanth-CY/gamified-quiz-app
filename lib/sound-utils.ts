/**
 * Utility functions for handling sound in the application
 */

// Check if audio is supported in the current environment
export function isAudioSupported(): boolean {
  return typeof window !== "undefined" && typeof Audio !== "undefined"
}

// Create an audio element with error handling
export function createAudio(src: string): HTMLAudioElement | null {
  if (!isAudioSupported()) return null

  try {
    const audio = new Audio(src)

    // Add error handler
    audio.onerror = () => {
      console.log(`Failed to load sound: ${src}`)
      return null
    }

    return audio
  } catch (error) {
    console.error("Error creating audio element:", error)
    return null
  }
}

// Play a sound with error handling
export function playSound(audio: HTMLAudioElement | null): void {
  if (!audio) return

  try {
    // Reset the audio to the beginning
    audio.currentTime = 0

    // Play the sound
    const playPromise = audio.play()

    // Handle promise rejection (happens in some browsers)
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.log("Error playing sound:", error)
      })
    }
  } catch (error) {
    console.error("Error playing sound:", error)
  }
}
