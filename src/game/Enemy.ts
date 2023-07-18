import Phaser from 'phaser'
import { GameScene, RoomWithEnemies } from './scenes/GameScene';
import { Room } from '@mikewesthad/dungeon';
import Feller from './Feller';
import EventEmitter from './EventEmitter';
import animations from './util/animate';
import { Exception } from 'sass';
import assert from './util/assert';

export interface EnemyConfig {
  damage?: number
  health?: number
  room: RoomWithEnemies
  texture: string
  velocity?: number
  enemyType?: EnemyType
}

export enum EnemyType {
  Goo,
  Pig,
  Soul,
}

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  target!: Phaser.Types.Math.Vector2Like;
  health: number;
  damage: number;
  room!: RoomWithEnemies
  scene!: GameScene
  seenFeller = false
  speed = 100
  knockback = 100
  dead = false
  debug = false
  gfx!: Phaser.GameObjects.Graphics;
  pushing = 0
  enemyType?: EnemyType

  constructor(scene: GameScene, config: EnemyConfig, x?: number, y?: number) {
    super(scene, 0, 0, config.texture);
    this.health = config.health || 3;
    this.damage = config.damage || 1;
    this.room = config.room
    this.scene = scene
    this.speed = config.velocity || this.speed
    this.enemyType = config.enemyType

    scene.add.existing(this);
    scene.physics.add.existing(this);
    scene.physics.add.collider(this, scene.groundLayer)
    
    this.setX(scene.map.tileToWorldX(this.room.centerX)! + Math.random() * 200)
    this.setY(scene.map.tileToWorldY(this.room.centerY)! + Math.random() * 200)
    this.setMaxVelocity(this.speed)

    this.gfx = this.scene.add.graphics({ lineStyle: { color: 0x0 }, fillStyle: { color: 0xff0000 }})
    .fillRect(this.x, this.y, 10, 10)

    // this.setBounce(1); // This will avoid enemy sticking to the wall

    // animations.enshadow(this)
    // animations.wobbleSprite(this.scene, this)
  }

  attack(feller: Feller) {
    if (this.dead) return
    feller.hit(this)
  }

  hit(damage = 1) {
    this.health -= damage;
    if (this.health <= 0) {
      this.die();
    }
  }

  preUpdate(time: any, delta: any) {
    super.preUpdate(time, delta);

    assert(this.room)

    if (this.debug) {
      this.gfx
        // .clear()
        // .lineBetween(this.x, this.y, 
        //   this.scene.map.tileToWorldX(this.room.centerX)!, this.scene.map.tileToWorldY(this.room.centerY)!
        // )
        .fillRect(this.x, this.y, 5, 5)
    }

    this.lookForFeller()
    this.move(time, delta)
  }

  lookForFeller() {
    if (this.room.guid === this.scene.fellerRoom.guid) {
      !this.visible && this.setVisible(true)

      if (!this.seenFeller) {
        console.log('seen feller', this)
        this.seenFeller = true
        this.gfx.setDefaultStyles({ fillStyle: { color: 0x0000ff }})
        this.target = this.scene.feller.sprite
      }
    } else {
      // if we are not in same room as player, hide sprite
      this.setVisible(false)
      this.seenFeller = false
    }
  }

  acquireTarget(time: any, delta: any) {
    if (!this.seenFeller) {
      if (time % 10000 === 0)
      { 
        console.log({ time, delta })
        // at least 1: index 0 is a wall
        // at most width - 1 or height - 1: index width/height is a wall
        let potentialTarget = new Phaser.Math.Vector2(
          1 + this.scene.map.tileToWorldX(this.room.x)! + Math.random() * (this.room.width - 2) * this.scene.map.tileWidth, 
          1 + this.scene.map.tileToWorldY(this.room.y)! + Math.random() * (this.room.height - 2) * this.scene.map.tileHeight
        );

        let isNearDoor = false;
      
        // Check if the potential target is within 2 tiles of any door
        for (let door of this.room.getDoorLocations()) {
          const doorWorldPos = new Phaser.Math.Vector2(
            this.scene.map.tileToWorldX(door.x)!, 
            this.scene.map.tileToWorldY(door.y)!
          );  
          if (potentialTarget.distance(doorWorldPos) < 2 * this.scene.map.tileWidth) {
            isNearDoor = true;
            break;
          }
        }
        
        // If the potential target is not near any door, make it the actual target
        if(!isNearDoor) {
          this.target = potentialTarget;
        }
      }
    } else {
      this.target = this.scene.feller.sprite
    }
  }

  chaseTarget() {
    if (this.target) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x!, this.target.y!);
      this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
    }
  }

  wobble() {
    assert(this.body)

    const wobbleFactor = this.speed / 2
    const angle = Math.random() * 2 * Math.PI
    const wobbleX = Math.random() * wobbleFactor * (Math.random() < 0.5 ? -1 : 1)
    const wobbleY = Math.random() * wobbleFactor * (Math.random() < 0.5 ? -1 : 1)
    this.body.velocity.x += Math.cos(angle) * wobbleFactor + wobbleX
    this.body.velocity.y += Math.sin(angle) * wobbleFactor + wobbleY
  }

  move(time: any, delta: any) {
    this.acquireTarget(time, delta)
    this.chaseTarget()
    this.wobble()
  }

  pushAway(other: Phaser.Physics.Arcade.Sprite) {
    if (this.pushing > 0) {
      this.pushing--
      return
    }
    this.pushing = 100
    const overlapAngle = Phaser.Math.Angle.BetweenPoints(other, this)
    const distance = Phaser.Math.Distance.BetweenPoints(other, this)
    const force = 200 / ((distance * distance) || 1)
    if (this.debug) {
      console.log('pushing away', { velocity: this.body?.velocity, overlapAngle, distance, force, })
    }
    if (this.body && !isNaN(this.body.velocity.x) && !isNaN(this.body.velocity.y)) {
      this.body.velocity.x += force * Math.sin(overlapAngle)
      this.body.velocity.y += force * Math.cos(overlapAngle)
    }
    if (other.body && !isNaN(other.body.velocity.x) && !isNaN(other.body.velocity.y)) {
      other.body.velocity.x -= force * Math.sin(overlapAngle)
      other.body.velocity.y -= force * Math.cos(overlapAngle)
    }
  }

  checkRoomComplete() {
    if (this.room.enemies?.every(e => e.dead)) {
      console.log('room complete', this.room.guid)
      EventEmitter.emit('openDoors', this.room.guid)
    }
  }

  die() {
    this.gfx.clear()
    this.dead = true
    EventEmitter.emit('demonFelled')
    this.checkRoomComplete()
    this.scene.checkLevelComplete() // dont call after destroy()
    this.destroy()
  }
}
