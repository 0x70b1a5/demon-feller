import Phaser from 'phaser'
import { GameScene, RoomWithEnemies } from './scenes/GameScene';
import { Room } from '@mikewesthad/dungeon';
import Feller from './Feller';
import EventEmitter from './EventEmitter';
import animations from './util/animate';
import { Exception } from 'sass';
import assert from './util/assert';
import Pathfinding, { DiagonalMovement } from 'pathfinding';
import TILE_MAPPING from './constants/tiles';

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
  debug = true


  target!: Phaser.Types.Math.Vector2Like;
  health: number;
  damage: number;
  room!: RoomWithEnemies
  scene!: GameScene
  seenFeller = false
  speed = 100
  knockback = 100
  dead = false
  gfx!: Phaser.GameObjects.Graphics;
  pushing = 0
  enemyType?: EnemyType
  movementAngle = 0

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
    scene.physics.add.collider(this, scene.stuffLayer)
    
    const [spawnX, spawnY] = scene.findUnoccupiedRoomTile(config.room)
    x ||= spawnX
    y ||= spawnY

    this.setX(scene.map.tileToWorldX(x)!)
    this.setY(scene.map.tileToWorldY(y)!)
    this.setOrigin(0.5, 0.5)

    this.gfx = this.scene.add.graphics({ lineStyle: { color: 0x0 }, fillStyle: { color: 0xff0000 }})
    if (this.debug) {
      this.gfx
      .fillRect(this.x, this.y, 10, 10)
    }
  }

  isNearDoor(x: number, y: number) {
    const threshold = 500; // pixels
  
    for (let door of this.room.getDoorLocations()) {
      const doorX = this.scene.map.tileToWorldX(door.x)!
      const doorY = this.scene.map.tileToWorldY(door.y)!
      if (Math.abs(x - doorX) < threshold && 
          Math.abs(y - doorY) < threshold) {
        return true;
      }
    }
    return false;
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
        .clear()
        // .lineBetween(this.x, this.y, 
        //   this.scene.map.tileToWorldX(this.room.centerX)!, this.scene.map.tileToWorldY(this.room.centerY)!
        // )
        if(this.target)
        this.gfx
        .lineBetween(this.x, this.y, this.target.x!, this.target.y!)
        // .fillRect(this.x, this.y, 5, 5)
    }

    this.lookForFeller()
    if (time % 10000 === delta) {
      this.acquireTarget(time, delta)
    }
    if (this.isNearDoor(this.x, this.y)) {
      this.acquireTarget(time, delta); 
    }
    this.move(time, delta)
  }

  lookForFeller() {
    if (this.room.guid === this.scene.fellerRoom.guid) {
      !this.visible && this.setVisible(true)

      if (!this.seenFeller) {
        console.log('seen feller', this)
        this.seenFeller = true
        if(this.debug) {
          this.gfx.setDefaultStyles({ fillStyle: { color: 0x0000ff }})
        }
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
      // at least 1: index 0 is a wall
      // at most width - 1 or height - 1: index width/height is a wall
      const newTarget = () => new Phaser.Math.Vector2(
        1 + this.scene.map.tileToWorldX(this.room.x)! + Math.random() * (this.room.width - 2) * this.scene.map.tileWidth, 
        1 + this.scene.map.tileToWorldY(this.room.y)! + Math.random() * (this.room.height - 2) * this.scene.map.tileHeight
      );

      let potentialTarget = newTarget()

      while (this.isNearDoor(potentialTarget.x, potentialTarget.y)) {
        potentialTarget = newTarget()
      }

      this.target = potentialTarget
    } else {
      this.target = this.scene.feller.sprite
    }
  }

  move(time: any, delta: any) {
    if (this.target) {
      this.chaseTarget()
    }
    this.setVelocity(Math.cos(this.movementAngle) * this.speed, Math.sin(this.movementAngle) * this.speed)
    this.wobble()
  }

  chaseTarget() {
    this.findPathToTarget()
    this.takePathToTarget()
  }

  path!: number[][]
  findPathToTarget() {
    this.path = this.scene.pathfinder.findPath(
      this.scene.map.worldToTileX(this.x!)!, 
      this.scene.map.worldToTileY(this.y!)!, 
      this.scene.map.worldToTileX(this.target.x!)!, 
      this.scene.map.worldToTileY(this.target.y!)!, 
      this.scene.walkableGrid.clone()
    )


    for (let step of this.path) {
      if (this.debug) {
        this.gfx.fillCircle((this.x!)!, (this.y!)!,5)
        .fillRect((this.target.x!)!, (this.target.y!)!, 5, 5)
        .fillRect( this.scene.map.tileToWorldX(step[0])!, this.scene.map.tileToWorldY(step[1])!, 5,5 )
      }
    }
  }

  takePathToTarget() {
    const secondStep = this.path?.[1]
    if (secondStep?.length) {
      // console.log({ firstStep })
      let dest = this.scene.map.tileToWorldXY(secondStep[0], secondStep[1])!
      // we want them to angle for the center of the tile, not the TL corner
      dest.x += this.scene.map.tileWidth / 2
      dest.y += this.scene.map.tileHeight / 2
      if (this.debug) {
        this.gfx.fillCircle(dest.x, dest.y, 10)
      }

      // maybe/maybe not
      // const distance = Phaser.Math.Distance.BetweenPoints(this, dest)
      // // if we're close enough to the goal, move on to the next tile
      // if (distance <= this.scene.map.tileWidth/4) {
      //   const thirdStep = this.path?.[2]
      //   if (thirdStep?.length) {
      //     dest = this.scene.map.tileToWorldXY(thirdStep[0], thirdStep[1])!
      //     dest.x += this.scene.map.tileWidth / 2
      //     dest.y += this.scene.map.tileHeight / 2
      //   }
      // }
      
      if (this.debug) {
        this.gfx.setDefaultStyles({ lineStyle:{ color: 0x0000ff } })
        .lineBetween(this.x, this.y, dest.x, dest.y)
      }
      this.movementAngle = Phaser.Math.Angle.BetweenPoints(this, dest)
    }
  }

  wobble() {
    // assert(this.body)

    // const wobbleFactor = this.speed / 2
    // const angle = Math.random() * 2 * Math.PI
    // const wobbleX = Math.random() * wobbleFactor * (Math.random() < 0.5 ? -1 : 1)
    // const wobbleY = Math.random() * wobbleFactor * (Math.random() < 0.5 ? -1 : 1)
    // this.body.velocity.x += Math.cos(angle) * wobbleFactor + wobbleX
    // this.body.velocity.y += Math.sin(angle) * wobbleFactor + wobbleY
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
    if (this.debug) {
      this.gfx.clear()
    }
    this.dead = true
    EventEmitter.emit('demonFelled')
    this.checkRoomComplete()
    this.scene.checkLevelComplete() // dont call after destroy()
    this.setVisible(false)
    this.setActive(false)
    this.body!.destroy()
  }
}
