import Phaser from 'phaser'
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';

import animations from '../util/animate'
import colors from '../constants/colors'
import scales from '../constants/scaling'; 
import TILES from '../constants/tiles'
import Dungeon, { Room } from '@mikewesthad/dungeon';
import Feller from '../Feller';
import TilemapVisibility from '../TilemapVisibility';
import Enemy, { EnemyConfig, EnemyType } from '../Enemy';
import Bullet from '../Bullet';
import Goo from '../Goo';
import PowerUp, { PowerUpType } from '../Powerup';
import EventEmitter from '../EventEmitter';
import powerUps from '../constants/powerups';
import roll from '../util/roll';
import enemyWeights from '../constants/enemies';
import Pig from '../Pig';
import { assert } from 'console';
import { v4 as uuid } from 'uuid'
import Door from '../Door';
import Soul from '../Soul';
import Barrel from '../Barrel';
import Pathfinding, { DiagonalMovement } from 'pathfinding';
import TILE_MAPPING from '../constants/tiles';
import Rock from '../Rock';
import Stuff from '../Stuff';

export interface Portal { destination: string, sprite?: Phaser.Physics.Arcade.Sprite, label?: RexUIPlugin.Label }
export interface RoomWithEnemies extends Room {
  enemies: Enemy[]
  hasSpawnedPowerup: boolean
  guid: string
  doorSprites: Door[]
}
export interface OurCursorKeys extends Phaser.Types.Input.Keyboard.CursorKeys {
  tractor: Phaser.Input.Keyboard.Key
}

export class GameScene extends Phaser.Scene {
  debug = false


  feller!: Feller
  rexUI!: RexUIPlugin
  level!: number
  dungeon!: Dungeon
  rooms!: RoomWithEnemies[]
  levellingUp = false
  groundLayer!: Phaser.Tilemaps.TilemapLayer
  stuffLayer!: Phaser.Tilemaps.TilemapLayer
  shadowLayer!: Phaser.Tilemaps.TilemapLayer
  tilemapVisibility!: TilemapVisibility;
  fellerRoom!: RoomWithEnemies
  enemies: Enemy[] = []
  map!: Phaser.Tilemaps.Tilemap
  startRoom!: RoomWithEnemies
  otherRooms!: RoomWithEnemies[]
  demonsFelled = 0
  demonsFelledLevel = 0
  gameOver = false
  keys!: any
  stuffs: Stuff[] = []
  
  constructor() {
    super({ key: 'GameScene' })
    this.level = 0
  }

  preload() {
  }

  init() {
  }

  createDungeon() {
    const increaseRatio = Math.ceil(this.level / 3)
    const roomSize = 7 * increaseRatio
    const dungeon = this.dungeon = new Dungeon({
      width: 28 * increaseRatio,
      height: 28 * increaseRatio,
      doorPadding: 2,
      rooms: {
        width: { min: roomSize, max: roomSize },
        height: { min: roomSize, max: roomSize },
      }
      // // DEBUG: SMALL DONJON
      // width: 14,
      // height: 14,
      // doorPadding: 2,
      // rooms: { width: { min: 5, max: 5}, height: { min: 7, max: 7} }
    })

    const dhtml = dungeon.drawToHtml({ })
    EventEmitter.emit('minimap', dhtml)
    return dungeon
  }

  createTilemap() {    
    if (this.map) {
      this.map.removeAllLayers().destroy()
      this.groundLayer && this.groundLayer.destroy()
      this.stuffLayer && this.stuffLayer.destroy()
      this.shadowLayer && this.shadowLayer.destroy()
      this.load.image('tileset', 'assets/tileset.png')
    }

    const map = this.map = this.make.tilemap({
      tileWidth: 200,
      tileHeight: 200,
      width: this.dungeon.width,
      height: this.dungeon.height
    })
    map.scene = this
    map.scene.sys.textures = this.sys.textures

    const tileset = map.addTilesetImage('tileset', undefined, 200, 200, 0, 0)!
  
    const groundLayer = this.groundLayer = map.createBlankLayer('Ground', tileset)!.fill(TILES.BLANK)
    const stuffLayer = this.stuffLayer = map.createBlankLayer('Stuff', tileset)!
    stuffLayer.fill(-1);

    this.dungeon.rooms.forEach((room) => {
      const { x, y, width, height, left, right, top, bottom } = room;
      (room as RoomWithEnemies).guid = uuid()

      // Fill the floor with mostly clean tiles
      this.groundLayer.weightedRandomize(TILES.FLOOR, x + 1, y + 1, width - 2, height - 2);

      // Place the room corners tiles
      this.groundLayer.putTileAt(TILES.WALL.TOP_LEFT, left, top);
      this.groundLayer.putTileAt(TILES.WALL.TOP_RIGHT, right, top);
      this.groundLayer.putTileAt(TILES.WALL.BOTTOM_RIGHT, right, bottom);
      this.groundLayer.putTileAt(TILES.WALL.BOTTOM_LEFT, left, bottom);

      // Fill the walls with mostly clean tiles
      this.groundLayer.weightedRandomize(TILES.WALL.TOP, left + 1, top, width - 2, 1);
      this.groundLayer.weightedRandomize(TILES.WALL.BOTTOM, left + 1, bottom, width - 2, 1);
      this.groundLayer.weightedRandomize(TILES.WALL.LEFT, left, top + 1, 1, height - 2);
      this.groundLayer.weightedRandomize(TILES.WALL.RIGHT, right, top + 1, 1, height - 2);

      // Dungeons have rooms that are connected with doors. Each door has an x & y relative to the
      // room's location. Each direction has a different door to tile mapping.
      const doors = room.getDoorLocations(); // → Returns an array of {x, y} objects
      for (let door of doors) {
        if (door.y === 0) {
          this.groundLayer.putTileAt(TILES.DOOR.TOP, x + door.x, y + door.y);
        } else if (door.y === room.height - 1) {
          this.groundLayer.putTileAt(TILES.DOOR.BOTTOM, x + door.x, y + door.y);
        } else if (door.x === 0) {
          this.groundLayer.putTileAt(TILES.DOOR.LEFT, x + door.x, y + door.y);
        } else if (door.x === room.width - 1) {
          this.groundLayer.putTileAt(TILES.DOOR.RIGHT, x + door.x, y + door.y);
        }
      }
    });

    // MUST SET COLLISION ***AFTER*** MODIFYING LAYER
    groundLayer.setCollisionByExclusion([0, 1, 2, 3, 4, 13, 14]);
    stuffLayer.setCollision([15, 16])
    
    if (this.debug) {
      const debugGraphics = this.add.graphics().setAlpha(0.75);
      groundLayer.renderDebug(debugGraphics, {
        tileColor: null, // Color of non-colliding tiles
        collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
        faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
      });
      stuffLayer.renderDebug(debugGraphics, {
        tileColor: null, // Color of non-colliding tiles
        collidingTileColor: new Phaser.Display.Color(0, 134, 48, 255), // Color of colliding tiles
        faceColor: new Phaser.Display.Color(0, 39, 37, 255) // Color of colliding face edges
      });
    }
    
    const shadowLayer = this.shadowLayer = map.createBlankLayer('Shadow', tileset)!.fill(TILES.BLANK)!;
    shadowLayer.setCollisionByExclusion([-1])

    this.tilemapVisibility = new TilemapVisibility(shadowLayer);

    return map
  }

  findUnoccupiedRoomTile(room: Room, padding = 2): [x: number, y: number] {
    let [x, y] = [0, 0]

    const rollForTile = () => {
      // -1/+1 = don't spawn in a wall
      x = Math.round(Math.random() * (room.width - padding*2)) + room.x + padding
      y = Math.round(Math.random() * (room.height - padding*2)) + room.y + padding
      return (
        this.stuffs.find(stuff => this.map.worldToTileX(stuff.x) === x && this.map.worldToTileY(stuff.y) === y)
      )
    }
    
    let tile = rollForTile()
    
    while (tile) { // seek an empty
      tile = rollForTile()
    }

    return [x, y]
  }

  walkableGrid!: Pathfinding.Grid
  pathfinder!: Pathfinding.AStarFinder
  createWalkableGrid() {
    const walkableTiles: number[][] = []
    for (let y = 0; y < this.map.height; y++) {
      walkableTiles.push([])
      for (let x = 0; x < this.map.width; x++) {
        const collides = (
          TILE_MAPPING.WALLS.includes(this.groundLayer.getTileAt(x, y)?.index) ||
          TILE_MAPPING.ITEMS.includes(this.stuffLayer.getTileAt(x, y)?.index) ||
          this.stuffs.find(stuff => this.map.worldToTileX(stuff.x) === x && this.map.worldToTileY(stuff.y) === y)
        )
        walkableTiles[y][x] = collides ? 1 : 0
      }
    }
    console.log({ walkableTiles })
    this.walkableGrid = new Pathfinding.Grid(walkableTiles)
    this.pathfinder = new Pathfinding.AStarFinder({ 
      diagonalMovement: DiagonalMovement.Never
    })
  }

  putPlayerInStartRoom() {
    const rooms = this.rooms
    const startRoom = this.startRoom = rooms.shift()!;
    const otherRooms = this.otherRooms = Phaser.Utils.Array.Shuffle(rooms);

    // Place the player in the first room
    this.fellerRoom = startRoom!;
    const [spawnX, spawnY] = this.findUnoccupiedRoomTile(this.fellerRoom)

    const x = this.map.tileToWorldX(spawnX)!;
    const y = this.map.tileToWorldY(spawnY)!;

    if (this.feller) {
      this.feller.createNewSprite(x, y)
    } else {
      this.feller = new Feller(this, x, y);
    }

    // this.physics.add.collider(this.feller.sprite, stuffLayer);
    this.physics.add.collider(this.feller.sprite, this.groundLayer);
    this.physics.add.collider(this.feller.sprite, this.stuffLayer);
  }

  setupCamera() {
    const camera = this.cameras.main;
    camera.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    camera.startFollow(this.feller.sprite);
  }

  addDoorSpritesToRooms() {
    // don't add doors to first room!
    this.otherRooms.forEach(room => {
      const doors = room.getDoorLocations(); 
      room.doorSprites ||= []

      for (let door of doors) {
        const [x, y] = [this.map.tileToWorldX(door.x + room.x)!, this.map.tileToWorldY(door.y + room.y)!]
        if (door.y === 0) {
          room.doorSprites.push(new Door(this, room as RoomWithEnemies, 'N', x, y));
        } else if (door.y === room.height - 1) {
          room.doorSprites.push(new Door(this, room as RoomWithEnemies, 'S', x, y));
        } else if (door.x === 0) {
          room.doorSprites.push(new Door(this, room as RoomWithEnemies, 'W', x, y));
        } else if (door.x === room.width - 1) {
          room.doorSprites.push(new Door(this, room as RoomWithEnemies, 'E', x, y));
        }
      }
    })
  }

  tileIsNearDoor(x: number, y: number, room: Room, threshold = 500) {
    for (let door of room.getDoorLocations()) {
      const doorX = this.map.tileToWorldX(door.x)!
      const doorY = this.map.tileToWorldY(door.y)!
      if (Math.abs(x - doorX) < threshold && 
          Math.abs(y - doorY) < threshold) {
        return true;
      }
    }
    return false;
  }

  addStuffToRooms() {
    if (this.stuffs) {
      this.stuffs.forEach(o => o.destroy())
      this.stuffs = []
    }
    this.rooms = this.dungeon.rooms.slice() as RoomWithEnemies[];
    this.rooms.forEach(room => {
      // Stuff room with stuff
      const rollForStuff = () => {
        const roll = Math.random()
        // debugger
        let [x, y] = this.findUnoccupiedRoomTile(room, 1)
        while (this.tileIsNearDoor(x, y, room)) {
          [x, y] = this.findUnoccupiedRoomTile(room, 1)
        }

        let object;
        if (roll > 0.5) {
          // this.stuffLayer.putTileAt(TILES.ROCK, x, y)   
          object = new Rock(this, { room, damage: 0, health: 10, texture: 'rock' }, x, y)          
        } else if (roll < 0.25) {
          // this.stuffLayer.putTileAt(TILES.BARREL, x, y)
          object = new Barrel(this, { room, damage: 3, health: 3, texture: 'barrel' }, x, y)
        }

        if (object) this.stuffs.push(object)
      }

      let rolls = this.level * 4
      while (rolls > 0) {
        rollForStuff()
        rolls--
      }
    })
  }

  createNewLevel() {
    this.level++
    console.log('level', this.level)
    this.createDungeon()
    this.createTilemap()
    this.addStuffToRooms()
    this.putPlayerInStartRoom()
    this.setupCamera()
    this.spawnEnemiesInRooms()
    this.addDoorSpritesToRooms()
    this.createWalkableGrid()
  }

  create() {
    if (this.debug) {
      this.physics.world.createDebugGraphic();  
      this.keys = this.input.keyboard?.addKeys({
        minus: Phaser.Input.Keyboard.KeyCodes.MINUS,
        plus: Phaser.Input.Keyboard.KeyCodes.PLUS,
      }) 
    }

    this.createNewLevel()

    EventEmitter.on('demonFelled', () => {
      this.demonsFelled++
      this.demonsFelledLevel++
      EventEmitter.emit('demonsFelled', this.demonsFelled)
      EventEmitter.emit('demonsFelledLevel', this.demonsFelledLevel)
    })

    EventEmitter.on('goToNextLevel', () => {
      this.createNewLevel()
      this.levellingUp = false // don't resume updating until the new level is done
    })

    EventEmitter.on('gameOver', () => {
      this.gameOver = true
      this.deactivateSprites()
    })
  }

  spawnPowerUp(room: RoomWithEnemies, type?: PowerUpType) {
    const x = this.map.tileToWorldX(room.centerX)!;
    const y = this.map.tileToWorldY(room.centerY)!;
    
    // Add the lens flare sprite at the powerup position
    const flare = this.add.sprite(x, y, 'boom').setScale(0.1);

    // Create the tween
    this.tweens.add({
      targets: flare,
      angle: 360,
      duration: 750,
      onComplete: () => {
        flare.destroy(); // Destroy the flare when the animation completes
      },
      ease: 'Sine.easeInOut'
    });
    this.tweens.add({
      targets: flare,
      scale: { start: 0.1, to: 10.0 },
      yoyo: true,
      duration: 450,
      ease: 'Sine.easeInOut'
    })

    const powerup = new PowerUp(this, x, y, (type || roll(powerUps)) as PowerUpType);
    
    const gfx = this.add.graphics({ lineStyle: { color: 0xff0000, width: 3 }});
    if (this.debug) {
      gfx.lineBetween(x, y, this.feller.sprite.x, this.feller.sprite.y)
    }


    this.physics.add.overlap(this.feller.sprite, powerup, () => {
      this.feller.pickupPowerUp(powerup);
      powerup.destroy();
      gfx.clear();
    });
  }
  
  checkLevelComplete() {
    const roomsWithEnemies = this.rooms.filter(room => room.enemies?.filter(e => !e.dead).length > 0)
    console.log({roomsWithEnemies})
    if (roomsWithEnemies.length > 0) {
      return false
    }
    EventEmitter.emit('levelUp', this.level + 1) // don't increment it yet
    this.levellingUp = true
    this.feller.sprite.setVelocity(0)
    this.physics.world.colliders.getActive().forEach(c => c.destroy());
    this.deactivateSprites()
  }
  
  deactivateSprites() {
    [...this.enemies, ...this.stuffs, ...this.feller.bullets].forEach(thing => {
      thing.setActive(false)
    })
  }

  spawnEnemiesInRooms() {
    this.otherRooms.forEach(room => {
      for(let i = 0; i < Math.random() * 3 * this.level; i++) {
        const enemyType = roll(enemyWeights)
        let enemy: Enemy | null = null;
        switch(enemyType) {
          case EnemyType.Goo:
            enemy = new Goo(this, { room, enemyType, texture: 'goo' })
            break
          case EnemyType.Pig:
            enemy = new Pig(this, { room, enemyType, texture: 'pig' })
            break
          case EnemyType.Soul:
            enemy = new Soul(this, { room, enemyType, texture: 'soul' })
            break
          default:
            break
        }
        if (enemy) {
          this.setUpEnemy(enemy)
          room.enemies ||= []
          room.enemies.push(enemy)
        }
      }
    });

    let demonsToFell = 0
    for (let room of this.rooms) {
      demonsToFell += room.enemies.length
    }

    this.demonsFelledLevel = 0
    EventEmitter.emit('demonsToFell', demonsToFell)
    EventEmitter.emit('demonsFelledLevel', this.demonsFelledLevel)
  }

  setUpEnemy(enemy: Enemy) {
    this.physics.add.overlap(this.feller.sprite, enemy, () => {
      enemy.attack(this.feller)
    });
    // TODO they're pushing each other out of bounds
    // this.enemies.forEach(e => this.physics.add.overlap(e, enemy, () => {
    //   enemy.pushAway(e)
    // }))
    this.enemies.push(enemy)
  }

  update(time: any, delta: any) {
    if (this.gameOver) {
      return
    }

    if (this.levellingUp) {
      return
    }

    this.feller.update(time, delta);

     // Find the player's room using another helper method from the dungeon that converts from
    // dungeon XY (in grid units) to the corresponding room instance
    const playerTileX = this.groundLayer.worldToTileX(this.feller.sprite.x);
    const playerTileY = this.groundLayer.worldToTileY(this.feller.sprite.y);
    this.fellerRoom = this.dungeon.getRoomAt(playerTileX, playerTileY)! as RoomWithEnemies;
    
    this.tilemapVisibility.setActiveRoom(this.fellerRoom);
    // console.log(this.feller.sprite.body!.x, this.feller.sprite.body!.y)

    if (this.debug) {
      if (Phaser.Input.Keyboard.JustDown(this.keys?.minus)) {
        this.cameras.main.setZoom(this.cameras.main.zoom / 1.25)
      } else if (Phaser.Input.Keyboard.JustDown(this.keys?.plus)) {
        this.cameras.main.setZoom(this.cameras.main.zoom * 1.25)
      }
    } 
  }
}
