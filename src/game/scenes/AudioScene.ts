import EventEmitter from "../EventEmitter";
import audioFiles from "../constants/audioFiles";
import { GameScene } from "./GameScene";

export class AudioScene extends Phaser.Scene {
  songNames: string[] = Object.keys(audioFiles)
  queue: string[] = []
  songs: Phaser.Sound.HTML5AudioSound[] = []
  currentSong?: Phaser.Sound.HTML5AudioSound
  songIndex = 0

  gameScene!: GameScene

  constructor() {
    super({ key: 'AudioScene' });
  }
  
  create() {
    this.gameScene = this.scene.get('GameScene') as GameScene

    this.songs = this.songNames
      .filter(songName => this.songIsLoaded(songName))
      .map(songName => this.sound.add(songName) as Phaser.Sound.HTML5AudioSound)

    console.log('loaded songs:', this.songs)

    this.playRandomMusic()

    EventEmitter.on('unpause', () => {
      this.scene.resume('GameScene')
    })

    EventEmitter.on('muteChanged', (isMuted: boolean) => {
      this.sound.setMute(isMuted)
    });

    EventEmitter.on('musicVolumeChanged', (volume: number) => {
      this.sound.setVolume(volume)
    });

    EventEmitter.on('sfxVolumeChanged', (volume: number) => {
      this.sound.setVolume(volume)
    });

    EventEmitter.on('musicRewind', (volume: number) => {
      // ?
    });

    EventEmitter.on('musicForward', (volume: number) => {
      this.playRandomMusic()
    });

    Object.entries(audioFiles).forEach(([key, file]) => {
      if (!this.songIsLoaded(key))
        this.load.audio(key, file)
    })

    this.load.on('complete', () => {
      Object.entries(audioFiles).forEach(([key, file]) => {
        this.sound.add(key)
      })
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
      this.currentSong.play();
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