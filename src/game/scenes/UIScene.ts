import EventEmitter from "../EventEmitter";
import colors from "../constants/colors";
import { GameScene } from "./GameScene";

export class UIScene extends Phaser.Scene {
  songNames: string[] = [
    'pentarchy',
    'cracks',
    'faithless',
    'fate',
    'armiger',
    'ouroboros',
    'remains',
    'clouds',
    'surrender',
  ]
  songs: Phaser.Sound.HTML5AudioSound[] = []
  currentSong?: Phaser.Sound.HTML5AudioSound
  songIndex = 0

  gameScene!: GameScene

  constructor() {
    super({ key: 'UIScene' });
  }
  
  create() {
    this.gameScene = this.scene.get('GameScene') as GameScene

    this.songs = this.songNames.map(songName => this.sound.add(songName) as Phaser.Sound.HTML5AudioSound)

    this.playRandomMusic()

    EventEmitter.on('unpause', () => {
      this.scene.resume('GameScene')
    })

    EventEmitter.on('drawMinimap', (minimap: number[][]) => {
      this.createOrRefreshMinimap()
      this.drawMinimapTerrain(minimap)
      this.createMinimapMarkers()
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

  minimapGfx!: Phaser.GameObjects.Graphics
  minimapX = 10
  minimapY = 10
  minimapTileSize = 8
  createOrRefreshMinimap() {
    if (!this.minimapGfx) {
      this.minimapGfx = this.add.graphics({ fillStyle: { color: colors.TEXTBOX_BG_COLOR, alpha: 0.8 } })
    }
  }

  drawMinimapTerrain(minimap: number[][]) {
    const minimapGfx = this.minimapGfx
    minimapGfx.clear()
    .setX(this.minimapX)
    .setY(this.minimapY)

    for (let y = 0; y < minimap.length; y++) {
      for (let x = 0; x < minimap[y].length; x++) {
        switch (minimap[y][x]) {
          case 0:
            minimapGfx.setDefaultStyles({ fillStyle: { color: colors.TEXTBOX_BG_COLOR, alpha: 0.8 } });
            break;
          case 1:
            minimapGfx.setDefaultStyles({ fillStyle: { color: colors.LINE_COLOR, alpha: 0.8 } });
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