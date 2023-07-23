import EventEmitter from "../EventEmitter";
import { GameScene } from "./GameScene";

export class UIScene extends Phaser.Scene {
  songNames: string[] = ['fate', 'faithless', 'cracks']
  songs: Phaser.Sound.HTML5AudioSound[] = []
  currentSong?: Phaser.Sound.HTML5AudioSound
  songIndex = 0
  constructor() {
    super({ key: 'UIScene' });
  }
  
  create() {
    this.songs = this.songNames.map(songName => this.sound.add(songName) as Phaser.Sound.HTML5AudioSound)

    this.playRandomMusic()

    EventEmitter.on('unpause', () => {
      this.scene.resume('GameScene')
    })
  }

  playRandomMusic() {
    if (this.currentSong) {
      this.currentSong.stop();
    }

    // Shuffling the tracks
    const randomIndex = Phaser.Math.Between(0, this.songNames.length - 1);

    // Play the selected track
    this.currentSong = this.sound.add(this.songNames[randomIndex]) as any;
    if (this.currentSong) {
      this.currentSong.play();
      
      // When the music ends, play another track
      this.currentSong.on('complete', () => {
        this.playRandomMusic();
      });
    }
  }

  update() {
  }
}