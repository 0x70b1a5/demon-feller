import EventEmitter from './EventEmitter';
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
  private _health: number;
  public get health(): number {
    return this._health;
  }
  public set health(value: number) {
    if (isNaN(value)) debugger
    this._health = value;
  }
  MAX_HEALTH: number;
  damage?: number;
  room!: RoomWithEnemies
  guid!: string

  constructor(scene: GameScene, config: StuffConfig, x: number, y: number) {
    super(scene, x, y, config.texture)
    this.scene = scene
    this._health = config.health || 3;
    this.MAX_HEALTH = this.health;
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
      .setVisible(false)

    this.debug && this.gfx.strokeCircle(this.x, this.y, this.height/2)

    EventEmitter.on('spawnDoors', (guid: string) => {
      if (this.room.guid === guid) {
        this.setVisible(true)
      }
    }).on('levelChanged', (level: number, guid: string) => {
      if (this.room.guid === guid) {
        this.setVisible(true)
      }
    })
  }

  hit(damage = 1) {
    console.log('stuff was hit!', damage)
    if (isNaN(this.health)) {
      debugger
      this.health = this.MAX_HEALTH;
    }
    this.health -= damage;
    if (this.health <= 0) {
      this.die();
    }
  }

  fixedUpdate(time: number, delta: number) {
    if (this.dying || this.dead) return
    super.preUpdate(time, delta);
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
    this.body?.destroy()
    EventEmitter.emit('recreateWalkableGrid')
  }
}