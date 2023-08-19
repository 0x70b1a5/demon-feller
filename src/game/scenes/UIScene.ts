import EventEmitter from '../EventEmitter';
import audioFiles from '../constants/audioFiles';
import colors from '../constants/colors';
import TILE_MAPPING from '../constants/tiles';
import { GameScene } from './GameScene';

export class UIScene extends Phaser.Scene {
  gameScene!: GameScene
  minimap!: Phaser.GameObjects.RenderTexture
  minimapZoom = 0.06

  offsetX!: number
  offsetY!: number
  mapW!: number
  mapH!: number
  screenW!: number
  screenH!: number
  ratioOfScreenToMap!: number

  constructor() {
    super({ key: 'UIScene' });
  }
  
  checkmarks!: Phaser.GameObjects.Sprite[]
  create() {
    this.gameScene = this.scene.get('GameScene') as GameScene;
    this.mapW = (this.gameScene.map.widthInPixels)
    this.mapH = (this.gameScene.map.heightInPixels)
    this.screenW = this.game.config.width as number
    this.screenH = this.game.config.height as number
    this.ratioOfScreenToMap = this.screenH/this.mapH
    this.offsetX = -this.screenW/2
    this.offsetY = -this.screenH/2
    this.minimap = this.gameScene.add.renderTexture(0, 0, this.mapW, this.mapH)
    this.minimap.setAlpha(0.5).setOrigin(0, 0)

    this.drawLevel_refollow_ignoreSprites()
    
    EventEmitter.on('unpause', () => {
      this.scene.resume('GameScene')
    })
    .on('drawMinimap', () => this.drawLevel_refollow_ignoreSprites())
    .on('levelChanged', () => this.drawLevel_refollow_ignoreSprites())
    .on('revealRoom', () => this.drawLevel_refollow_ignoreSprites())
    .on('gameRestarted', () => {
      this.scene.bringToTop(this)
    }).on('roomComplete', (guid: string) => {
      const room = this.gameScene.rooms.find(r => r.guid === guid)
      if (!room) return

      const check = this.gameScene.add.sprite(
        this.gameScene.map.tileToWorldX(room.centerX)!, 
        this.gameScene.map.tileToWorldY(room.centerY)!,
        'mm-check')
      check.setScale(10)
      this.gameScene.cameras.main.ignore(check)
      this.checkmarks ||= []
      this.checkmarks.push(check)
    }).on('resizeMinimap', (size: string, transparent: boolean) => this.resizeMinimap(size, transparent))
  }

  drawLevel_refollow_ignoreSprites() {
    this.minimap.clear()
      .draw(this.gameScene.groundLayer)
      .setScale(this.ratioOfScreenToMap/4, this.ratioOfScreenToMap/4)
      
    this.scene.bringToTop(this)
    // this.checkmarks?.forEach(c => c.destroy())
    // this.minimap
    // .startFollow(this.gameScene.feller.sprite)
    // .ignore([
    //   this.gameScene.feller.sprite,
    //   this.gameScene.feller.gunSprite, 
    //   ...this.gameScene.enemies
    // ]);
  }

  resizeMinimap(size: string, transparent: boolean) {
    console.log({ size, transparent })

    switch (size) {
      case 'small':
        this.minimap.setSize(window.innerWidth/6, window.innerHeight/6)
        break
      case 'medium':
        this.minimap.setSize(window.innerWidth/4, window.innerHeight/4)
        break
      case 'large':
        this.minimap.setSize(window.innerWidth/3, window.innerHeight/3)
        break
      default:
        break
    }

    if (transparent) {
      this.minimap.setAlpha(0.5)
    } else {
      this.minimap.setAlpha(1)
    }
  }

  update(time: number, delta: number): void {
    this.minimap.setX(this.gameScene.feller.sprite.x + this.offsetX)
    .setY(this.gameScene.feller.sprite.y + this.offsetY)
  }
}