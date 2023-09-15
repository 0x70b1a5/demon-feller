import EventEmitter from '../EventEmitter';
import audioFiles from '../constants/audioFiles';
import colors from '../constants/colors';
import TILE_MAPPING from '../constants/tiles';
import { GameScene } from './GameScene';

export class UIScene extends Phaser.Scene {
  gameScene!: GameScene
  minimap!: Phaser.Cameras.Scene2D.Camera
  minimapZoom = 0.06
  constructor() {
    super({ key: 'UIScene' });
  }
  
  checkmarks!: Phaser.GameObjects.Sprite[]
  create() {
    this.gameScene = this.scene.get('GameScene') as GameScene;
    const existingMini = this.gameScene.cameras.getCamera('mini')
    if (!existingMini) {
      this.minimap = this.gameScene.cameras.add(0, 0, this.game.config.width as number/4, this.game.config.height as number/4, false, 'mini').setZoom(this.minimapZoom)
    } else {
      this.minimap = existingMini
    }
    this.minimap.setAlpha(0.5)

    this.refollowAndignoreSprites()
    
    EventEmitter.on('unpause', () => {
      this.scene.resume('GameScene')
    })
    .on('drawMinimap', () => this.refollowAndignoreSprites())
    .on('levelChanged', () => this.refollowAndignoreSprites())
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

  refollowAndignoreSprites() {
    this.checkmarks?.forEach(c => c.destroy())
    this.minimap
    .clearMask()
    .startFollow(this.gameScene.feller.sprite)
    .ignore([
      this.gameScene.feller.sprite,
      this.gameScene.feller.gunSprite, 
      ...this.gameScene.enemies
    ]);
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
}