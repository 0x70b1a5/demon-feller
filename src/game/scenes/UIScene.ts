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