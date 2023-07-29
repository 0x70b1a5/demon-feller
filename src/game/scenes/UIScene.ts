import EventEmitter from "../EventEmitter";
import audioFiles from "../constants/audioFiles";
import colors from "../constants/colors";
import { GameScene } from "./GameScene";

export class UIScene extends Phaser.Scene {
  songNames: string[] = Object.keys(audioFiles)
  queue: string[] = []
  songs: Phaser.Sound.HTML5AudioSound[] = []
  currentSong?: Phaser.Sound.HTML5AudioSound
  songIndex = 0

  gameScene!: GameScene

  constructor() {
    super({ key: 'UIScene' });
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

    EventEmitter.on('drawMinimap', (minimap: number[][]) => {
      this.createOrRefreshMinimap()
      this.drawMinimapTerrain(minimap)
      this.createMinimapMarkers()
    })

    EventEmitter.on('gameRestarted', () => {
      this.fellerMarker?.destroy()
      this.enemyMarkers?.forEach(e => e?.destroy())
      this.minimapGfx?.clear()
      this.scene.bringToTop(this)
    })

    EventEmitter.on('muteChanged', (isMuted: boolean) => {
      this.sound.setMute(isMuted)
    });

    EventEmitter.on('recreateWalkableGrid', () => {
      // this.createOrRefreshMinimap()
      // this.drawMinimapTerrain(minimap)
      // this.createMinimapMarkers()
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

  minimapGfx!: Phaser.GameObjects.Graphics
  minimapX = 10
  minimapY = 10
  minimapTileSize = 8
  createOrRefreshMinimap() {
    this.minimapGfx = this.add.graphics({ fillStyle: { color: colors.TEXTBOX_BG_COLOR } })
  }

  drawMinimapTerrain(minimap: number[][]) {
    console.log('draw minimap terrain')
    const minimapGfx = this.minimapGfx
    minimapGfx.clear()
    .setX(this.minimapX)
    .setY(this.minimapY)

    minimapGfx.setDefaultStyles({ fillStyle: { color: colors.LINE_COLOR }})
    minimapGfx.fillRect(this.minimapX-1, this.minimapY-1, this.minimapTileSize*minimap[0].length+2, this.minimapTileSize*minimap.length+2)

    for (let y = 0; y < minimap.length; y++) {
      for (let x = 0; x < minimap[y].length; x++) {
        switch (minimap[y][x]) {
          case 0:
            minimapGfx.setDefaultStyles({ fillStyle: { color: colors.TEXTBOX_BG_COLOR } });
            break;
          case 1:
            minimapGfx.setDefaultStyles({ fillStyle: { color: colors.LINE_COLOR } });
            break;
        }
        
        const [drawX, drawY] = [x * this.minimapTileSize, y * this.minimapTileSize];
        minimapGfx.fillRect(drawX, drawY, this.minimapTileSize, this.minimapTileSize);
      }
    }
  }


  fellerMarker!: Phaser.GameObjects.Sprite;
  enemyMarkers!: Phaser.GameObjects.Sprite[];
  createMinimapMarkers() {
    if (!this.fellerMarker) {
      this.fellerMarker = this.physics.add.sprite(this.minimapX, this.minimapY, 'mm-feller');
      this.fellerMarker.setDisplaySize(this.minimapTileSize*2, this.minimapTileSize*2);
    }
    
    if (this.enemyMarkers) {
      this.enemyMarkers?.forEach(m => m?.destroy())
    }
    
    this.enemyMarkers = this.gameScene.enemies.map(enemy => {
      const enemyMarker = this.physics.add.sprite(this.minimapX, this.minimapY, 'mm-demon');
      enemyMarker.setDisplaySize(this.minimapTileSize*2, this.minimapTileSize*2);
      return enemyMarker;
    });
  }

  moveMarkers() {
    if (!this.fellerMarker || !this.gameScene.feller.sprite.x || !this.gameScene.feller.sprite.y) return
    this.fellerMarker.setDepth(this.minimapGfx.depth + 1)
    this.fellerMarker.x = this.minimapX + this.gameScene.feller.sprite.x * this.minimapTileSize / this.gameScene.map.tileWidth;
    this.fellerMarker.y = this.minimapY + this.gameScene.feller.sprite.y * this.minimapTileSize / this.gameScene.map.tileHeight;
    
    for (let i = 0; i < this.enemyMarkers.length; i++) {
      if (!this.gameScene.enemies[i]?.x || !this.gameScene.enemies[i]?.y) {
        continue
      }
      if (!this.gameScene.revealedRooms.includes(this.gameScene.enemies[i].room?.guid) || this.gameScene.enemies[i].dead) {
        this.enemyMarkers[i].setVisible(false)
        continue
      }
      this.enemyMarkers[i].setVisible(true)
      this.enemyMarkers[i].setDepth(this.minimapGfx.depth + 1)
      this.enemyMarkers[i].x = this.minimapX + this.gameScene.enemies[i].x * this.minimapTileSize / this.gameScene.map.tileWidth;
      this.enemyMarkers[i].y = this.minimapY + this.gameScene.enemies[i].y * this.minimapTileSize / this.gameScene.map.tileHeight;
    }
  }

  update() {
    this.moveMarkers()
  }
}