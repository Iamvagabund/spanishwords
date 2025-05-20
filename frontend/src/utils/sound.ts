class SoundManager {
  private sounds: Record<string, HTMLAudioElement> = {}
  private isMuted: boolean = true // Тимчасово вимкнено

  constructor() {
    this.loadSounds()
  }

  private loadSounds() {
    const soundFiles = {
      correct: '/src/assets/sounds/correct.mp3',
      incorrect: '/src/assets/sounds/incorrect.mp3',
      complete: '/src/assets/sounds/complete.mp3',
      click: '/src/assets/sounds/click.mp3',
      success: '/src/assets/sounds/success.mp3'
    }

    Object.entries(soundFiles).forEach(([key, path]) => {
      const audio = new Audio(path)
      audio.preload = 'auto'
      this.sounds[key] = audio
    })
  }

  play(soundName: keyof typeof this.sounds) {
    if (this.isMuted) return

    const sound = this.sounds[soundName]
    if (sound) {
      sound.currentTime = 0
      sound.play().catch(() => {
        // Ігноруємо помилки відтворення звуку
        console.warn(`Не вдалося відтворити звук: ${soundName}`)
      })
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted
    return this.isMuted
  }

  setMute(mute: boolean) {
    this.isMuted = mute
  }
}

export const soundManager = new SoundManager() 