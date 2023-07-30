import EventEmitter from "../EventEmitter";
import audioFiles from "../constants/audioFiles";

export class AudioScene extends Phaser.Scene {
  songNames: string[] = Object.keys(audioFiles)
  queue: string[] = []
  songs: Phaser.Sound.HTML5AudioSound[] = []
  currentSong?: Phaser.Sound.HTML5AudioSound
  songIndex = 0

  musicVolume = 0.5
  sfxVolume = 0.5

  grunt!: Phaser.Sound.HTML5AudioSound
  squeal!: Phaser.Sound.HTML5AudioSound
  belch!: Phaser.Sound.HTML5AudioSound
  breathe!: Phaser.Sound.HTML5AudioSound
  impsqueak!: Phaser.Sound.HTML5AudioSound
  soulgrunt!: Phaser.Sound.HTML5AudioSound
  soulgrumble!: Phaser.Sound.HTML5AudioSound
  goosquelch!: Phaser.Sound.HTML5AudioSound
  goosquish!: Phaser.Sound.HTML5AudioSound
  bat!: Phaser.Sound.HTML5AudioSound
  magic!: Phaser.Sound.HTML5AudioSound

  constructor() {
    super({ key: 'AudioScene' });
  }

  create() {
    const prefix = '__demonfeller-'
    const DEFAULT_VOLUME = 0.5

    let startMuted: any = localStorage.getItem(prefix+'isMuted') || false
    if (startMuted) startMuted = (startMuted === true || startMuted === 'true') 
    let startMusicVolume: any = +localStorage.getItem(prefix+'musicVolume')!
    let startSfxVolume: any = +localStorage.getItem(prefix+'sfxVolume')!
    
    this.musicVolume = isNaN(startMusicVolume) ? DEFAULT_VOLUME : startMusicVolume
    this.sfxVolume = isNaN(startSfxVolume) ? DEFAULT_VOLUME : startSfxVolume
    this.sound.setMute(startMuted)

    this.songs = this.songNames
      .filter(songName => this.songIsLoaded(songName))
      .map(songName => this.sound.add(songName) as Phaser.Sound.HTML5AudioSound)

    console.log('loaded songs:', this.songs)

    this.bat = this.sound.add('bat') as Phaser.Sound.HTML5AudioSound
    this.magic = this.sound.add('magic') as Phaser.Sound.HTML5AudioSound
    this.grunt = this.sound.add('piggrunt') as Phaser.Sound.HTML5AudioSound
    this.squeal = this.sound.add('pigsqueal') as Phaser.Sound.HTML5AudioSound
    this.belch = this.sound.add('belcherbelch') as Phaser.Sound.HTML5AudioSound
    this.breathe = this.sound.add('belcherbreathe') as Phaser.Sound.HTML5AudioSound
    this.impsqueak = this.sound.add('impsqueak') as Phaser.Sound.HTML5AudioSound
    this.soulgrunt = this.sound.add('soulgrunt') as Phaser.Sound.HTML5AudioSound
    this.soulgrumble = this.sound.add('soulgrumble') as Phaser.Sound.HTML5AudioSound
    this.goosquelch = this.sound.add('goosquelch') as Phaser.Sound.HTML5AudioSound
    this.goosquish = this.sound.add('goosquish') as Phaser.Sound.HTML5AudioSound

    EventEmitter.on('gameStarted', () => {
      this.playRandomMusic()
      this.load.start()
    })

    EventEmitter.on('unpause', () => {
      this.scene.resume('GameScene')
    })

    EventEmitter.on('muteChanged', (isMuted: boolean) => {
      this.sound.setMute(isMuted)
    });

    EventEmitter.on('musicVolumeChanged', (volume: number) => {
      this.musicVolume = volume
      this.currentSong?.setVolume(volume)
    });

    EventEmitter.on('sfxVolumeChanged', (volume: number) => {
      this.sfxVolume = volume 
      this.grunt.play({ volume: this.sfxVolume })
    });

    EventEmitter.on('musicRewind', (volume: number) => {
      // ?
    });

    EventEmitter.on('musicForward', (volume: number) => {
      this.playRandomMusic()
    });

    EventEmitter.on('playSound', (key: string, config: Phaser.Types.Sound.SoundConfig) => {
      if (!this.songIsLoaded(key)) return
      this.sound.play(key, { volume: this.sfxVolume, ...config })
    })

    this.load.on('complete', () => {
      Object.entries(audioFiles).forEach(([key, file]) => {
        this.sound.add(key)
      })
    })

    Phaser.Utils.Array.Shuffle(Object.entries(audioFiles)).forEach(([key, file]) => {
      if (!this.songIsLoaded(key)) {
        this.load.audio(key, file)
      }
    })
  }

  songIsLoaded(key: string) {
    return this.cache.audio.has(key)
  }

  playRandomMusic() {
    if (this.currentSong) {
      this.currentSong.stop();
    }

    // Filter out songs that haven't been loaded yet
    const eligibleSongs = this.songNames.filter(songName => this.songIsLoaded(songName))

    console.log({eligibleSongs})
    // Shuffling the tracks
    const nextSong = Phaser.Utils.Array.Shuffle(eligibleSongs.slice()).pop()!

    // Play the selected track
    this.currentSong = this.sound.add(nextSong) as Phaser.Sound.HTML5AudioSound
    if (this.currentSong) {
      this.currentSong.play({ volume: this.musicVolume });
      const zong = (audioFiles as any)?.[this.currentSong.key as any]
      if (zong && !this.sound.mute)
        EventEmitter.emit('nowPlaying', zong.split('/').pop().replace(/\.(mp3|ogg)/, ''))
      
      // When the music ends, play another track
      this.currentSong.on('complete', () => {
        this.playRandomMusic();
      });
    } else {
      throw ''
    }

    this.sound.pauseOnBlur = false
    this.queue.push(nextSong)
  }

}