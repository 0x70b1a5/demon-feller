import EventEmitter from "../EventEmitter";
import audioFiles from "../constants/audioFiles";
import colors from "../constants/colors";
import TILE_MAPPING from "../constants/tiles";
import { GameScene } from "./GameScene";

export class UIScene extends Phaser.Scene {
  gameScene!: GameScene
  minimap!: Phaser.Cameras.Scene2D.Camera
  minimapZoom = 0.04
  constructor() {
    super({ key: 'UIScene' });
  }
  
  checkmarks!: Phaser.GameObjects.Sprite[]
  create() {
    this.gameScene = this.scene.get('GameScene') as GameScene;
    this.minimap = this.gameScene.cameras.add(0, 0, 200, 200, false, 'mini').setZoom(this.minimapZoom)
    this.minimap.setBackgroundColor(colors.TEXT_COLOR)

    this.refollowAndignoreSprites()
    
    EventEmitter.on('unpause', () => {
      this.scene.resume('GameScene')
    })
    .on('drawMinimap', () => this.refollowAndignoreSprites())
    .on('gameRestarted', () => {
      this.scene.bringToTop(this)
    }).on('roomComplete', (guid: string) => {
      const room = this.gameScene.rooms.find(r => r.guid === guid)
      if (!room) return

      const check = this.gameScene.add.sprite(
        this.gameScene.map.tileToWorldX(room.centerX)!, 
        this.gameScene.map.tileToWorldY(room.centerY)!,
        'mm-check')
      check.setScale(20)
      this.gameScene.cameras.main.ignore(check)
      this.checkmarks ||= []
      this.checkmarks.push(check)
    })
  }

  refollowAndignoreSprites() {
    this.minimap
    .startFollow(this.gameScene.feller.sprite)
    .ignore([
      this.gameScene.shadowLayer, 
      this.gameScene.feller.sprite,
      this.gameScene.feller.gunSprite, 
      ...this.gameScene.enemies
    ]);
  }
}