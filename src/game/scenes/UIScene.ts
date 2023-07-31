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
    this.minimap.setBackgroundColor(colors.TEXT_COLOR).startFollow(this.gameScene.feller.sprite)
    .ignore(this.gameScene.shadowLayer);

    EventEmitter.on('unpause', () => {
      this.scene.resume('GameScene')
    })

    this.createMinimapMarkers()
    EventEmitter.on('drawMinimap', () => this.createMinimapMarkers())

    EventEmitter.on('gameRestarted', () => {
      this.scene.bringToTop(this)
    })
  }

  fellerMarker!: Phaser.GameObjects.Sprite;
  enemyMarkers!: Phaser.GameObjects.Sprite[];
  createMinimapMarkers() {
    if (this.fellerMarker) {
      this.fellerMarker.destroy()
    }

    this.fellerMarker = this.add.sprite(
      this.gameScene.feller.sprite.x*this.minimapZoom, 
      this.gameScene.feller.sprite.y*this.minimapZoom,
      'mm-feller');
    
    if (this.enemyMarkers) {
      this.enemyMarkers.forEach(em => em.destroy())
    }

    this.enemyMarkers = this.gameScene.enemies.filter(e => e.seenFeller).map(enemy => {
      return this.add.sprite(
        enemy.x*this.minimapZoom, 
        enemy.y*this.minimapZoom, 
      'mm-demon');
    });


    this.minimap.ignore([this.gameScene.feller.sprite, ...this.gameScene.enemies]);
    // this.gameScene.cameras.main.ignore([this.fellerMarker, ...this.enemyMarkers]);
  }

  update() {
    console.log(this.minimap.scrollX, this.minimap.scrollY)
  }
}