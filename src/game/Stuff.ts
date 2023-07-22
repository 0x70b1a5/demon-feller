import { GameScene, RoomWithEnemies } from './scenes/GameScene'
import { v4 as uuid } from 'uuid';

export interface StuffConfig {
  health: number,
  damage?: number,
  texture: string,
  room: RoomWithEnemies
}

export default class Stuff extends Phaser.Physics.Arcade.Sprite {
  debug = false
  
  dying = false
  dead = false
  gfx!: Phaser.GameObjects.Graphics;
  scene!: GameScene
  health: number;
  damage?: number;
  room!: RoomWithEnemies
  guid!: string

  constructor(scene: GameScene, config: StuffConfig, x: number, y: number) {
    super(scene, x, y, config.texture)
    this.scene = scene
    this.health = config.health || 3;
    this.damage = config.damage || 1;
    this.room = config.room
    this.gfx = this.scene.add.graphics({ lineStyle: { color: 0x00ff00 }, fillStyle: { color: 0x00ff00, alpha: 0.5 } })
    this.guid = uuid()
    
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this
      .setX(scene.map.tileToWorldX(x)! + scene.map.tileWidth/2)
      .setY(scene.map.tileToWorldY(y)! + scene.map.tileHeight/2)
      .setCircle(this.width/2)

    this.debug && this.gfx.strokeCircle(this.x, this.y, this.height/2)
  }

  hit(damage = 1) {
    this.health -= damage;
    if (this.health <= 0) {
      this.die();
    }
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);

    if (this.room.guid !== this.scene.fellerRoom.guid) {
      this.setVisible(false)
    } else {
      this.setVisible(true)
    }
  }

  onBeforeDie() {
    this.dying = true
  }

  die() {
    if (this.debug) {
      this.gfx.clear()
    }
    this.onBeforeDie()
    this.dead = true
    this.setVisible(false)
    this.setActive(false)
    this.body!.destroy()
  }
}