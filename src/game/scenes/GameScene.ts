import Phaser from 'phaser'
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import animations from '../util/animate'
import colors from '../constants/colors'
import scales from '../constants/scaling'; 
import TILES from '../constants/tiles'
import Dungeon, { Point, Room } from '@mikewesthad/dungeon';
import Feller from '../Feller';
import TilemapVisibility from '../TilemapVisibility';
import Enemy, { EnemyConfig, EnemyType } from '../Enemy';
import Bullet from '../Bullet';
import Goo from '../Goo';
import PowerUp from '../Powerup';
import EventEmitter from '../EventEmitter';
import powerUps from '../constants/powerups';
import roll from '../util/roll';
import enemyWeights from '../constants/enemies';
import Pig from '../Pig';
import { v4 as uuid } from 'uuid'
import Door from '../Door';
import Soul from '../Soul';
import Barrel from '../Barrel';
import Pathfinding, { DiagonalMovement } from 'pathfinding';
import TILE_MAPPING from '../constants/tiles';
import Rock from '../Rock';
import Stuff from '../Stuff';
import assert from '../util/assert';
import Glutton from '../Glutton';
import Imp from '../Imp';
import { PowerUpType } from '../PowerUpType';
import Hothead from '../Hothead';
import ImpMother from '../ImpMother';
import Gambler from '../Gambler';

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
  levellingUp = false
  groundLayer!: Phaser.Tilemaps.TilemapLayer
  er!: Phaser.Tilemaps.TilemapLayer
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
  creatingNewLevel = true
  keys!: any
  stuffs: Stuff[] = []
  powerups: PowerUp[] = []

  get rooms() {
    return this.dungeon.rooms as RoomWithEnemies[]
  }
  revealedRooms = new Set<string>()
  
  constructor() {
    super({ key: 'GameScene' })
    this.level = 0
  }

  create() {
    if (this.debug) {
      this.physics.world.createDebugGraphic();  
    }
    this.keys = this.input.keyboard?.addKeys({
      minus: Phaser.Input.Keyboard.KeyCodes.MINUS,
      plus: Phaser.Input.Keyboard.KeyCodes.PLUS,
      esc: Phaser.Input.Keyboard.KeyCodes.ESC,
    }) 

    this.createNewLevel()

    EventEmitter.on('demonFelled', () => {
      this.demonsFelled++
      this.demonsFelledLevel++
      EventEmitter.emit('demonsFelled', this.demonsFelled)
      EventEmitter.emit('demonsFelledLevel', this.demonsFelledLevel)
    }).on('goToNextLevel', () => {
      this.scene.resume()
      this.createNewLevel()
      this.levellingUp = false // don't resume updating until the new level is done
    }).on('gameOver', () => {
      this.gameOver = true
      this.scene.pause()
    }).on('revealRoom', (guid: string) => {
      const room = this.rooms.find(rm => rm.guid === guid) || this.fellerRoom
      if (this.revealedRooms.has(guid)) {
        return
      }
      this.revealedRooms.add(room.guid)
      console.log('room revealed', guid, room, this.rooms)
    }).on('recreateWalkableGrid', () => {
      this.createWalkableGrid()
    })

    this.scene.launch('UIScene')
    this.scene.bringToTop('UIScene')
  }

  preload() {
  }

  init() {
  }

  restart() {
    EventEmitter.emit('gameRestarted')
    this.level = 0
    this.gameOver = false
    this.demonsFelled = 0
    this.demonsFelledLevel = 0
    this.physics.world.colliders.destroy()
    this.enemies.forEach(e => e.destroy())
    this.stuffs.forEach(e => e.destroy())
    this.rooms.forEach(r => r?.enemies.forEach(e => e.destroy()))
    this.feller.destroy()
    this.feller = new Feller(this, 0, 0)
    this.create()
  }

  createDungeon() {
    const dungeon = this.dungeon = new Dungeon({
      width: 35,
      height: 35,
      doorPadding: 2,
      rooms: {
        width: { min: 7, max: 11 },
        height: { min: 7, max: 11 },
      }
      // // DEBUG: SMALL DONJON
      // width: 14,
      // height: 14,
      // doorPadding: 2,
      // rooms: { width: { min: 5, max: 5}, height: { min: 7, max: 7} }
    })

    return dungeon
  }

  createTilemap() {    
    if (this.map) {
      this.map.removeAllLayers().destroy()
      this.groundLayer?.destroy()
      this.shadowLayer?.destroy()
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

    this.dungeon.rooms.forEach((room, i) => {
      const { x, y, width, height, left, right, top, bottom } = room;
      const guid = uuid();
      (room as RoomWithEnemies).guid = guid
      if (i === 0) this.revealedRooms.add(guid)

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
    assert(this.rooms.every(rm => rm.guid))

    // MUST SET COLLISION ***AFTER*** MODIFYING LAYER
    groundLayer.setCollisionByExclusion([0, 1, 2, 3, 4, 13, 14]);
    
    if (this.debug) {
      const debugGraphics = this.add.graphics().setAlpha(0.75);
      groundLayer.renderDebug(debugGraphics, {
        tileColor: null, // Color of non-colliding tiles
        collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
        faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
      });
    }
    
    const shadowLayer = this.shadowLayer = map.createBlankLayer('Shadow', tileset)!.fill(TILES.BLANK)!;
    shadowLayer.setCollisionByExclusion([-1])

    this.tilemapVisibility = new TilemapVisibility(shadowLayer);

    return map
  }

  findUnoccupiedRoomTile(room: Room, padding = 1): [x: number, y: number] {
    let tries = 0
    let [relativeX, relativeY] = [0, 0]

    const rollForTile = () => {
      // -1/+1 = don't spawn in a wall
      relativeX = Math.round(Math.random() * room.width)
      relativeY = Math.round(Math.random() * room.height)
      tries++
      
      return ( // these are the FAILURE conditions. returning true means ROLL AGAIN
        relativeX < padding || 
        relativeY < padding ||
        relativeX > room.width - padding || 
        relativeY > room.height - padding ||
        this.walkableTilesAs01[relativeY + room.y][relativeX + room.x] !== 0
      )
    }

    let tile = rollForTile()
    
    while (tile) { // seek an empty
      if (tries > 50) 
        return [-1, -1]
      tile = rollForTile()
    }

    this.debug && console.log(`FURT took ${tries} tries`)

    return [relativeX + room.x, relativeY + room.y]
  }

  minimapUseOnly_tileIsOccupied(x: number, y: number) {
    return (
      TILE_MAPPING.WALLS_ITEMS_DOORS.includes(this.groundLayer.getTileAt(x, y)?.index) ||
      this.tileHasStuff(x, y)
    )
  }

  tileHasStuff(x: number, y: number) {
    return this.stuffs
      .filter(stuff => !stuff.dead)
      .find(stuff => this.map.worldToTileX(stuff.x) === x && this.map.worldToTileY(stuff.y) === y)
  }

  pathfindingGrid!: Pathfinding.Grid
  pathfinder!: Pathfinding.AStarFinder
  walkableTilesAs01: number[][] = []
  createWalkableGrid() {
    this.walkableTilesAs01 = []
    for (let y = 0; y < this.map.height; y++) {
      this.walkableTilesAs01.push([])
      for (let x = 0; x < this.map.width; x++) {
        const collides = this.minimapUseOnly_tileIsOccupied(x, y)
        this.walkableTilesAs01[y][x] = collides ? 1 : 0
      }
    }
    this.debug && console.log({walkable: this.walkableTilesAs01})
    this.pathfindingGrid = new Pathfinding.Grid(this.walkableTilesAs01)
    this.pathfinder = new Pathfinding.AStarFinder({ 
      diagonalMovement: DiagonalMovement.IfAtMostOneObstacle
    })
  }

  putPlayerInStartRoom() {
    const rooms = this.rooms
    const startRoom = this.startRoom = rooms.shift()!;
    startRoom.hasSpawnedPowerup = true
    const otherRooms = this.otherRooms = Phaser.Utils.Array.Shuffle(rooms);

    // Place the player in the first room
    this.fellerRoom = startRoom!;
    const [spawnX, spawnY] = this.findUnoccupiedRoomTile(this.fellerRoom)
    debugger

    const x = this.map.tileToWorldX(spawnX)! + this.map.tileWidth/2;
    const y = this.map.tileToWorldY(spawnY)! + this.map.tileHeight/2;

    const startStar = this.add.sprite(this.map.tileToWorldX(startRoom.centerX)!, this.map.tileToWorldY(startRoom.centerY)!, 'mm-star').setScale(10)
    this.cameras.main.ignore(startStar)

    if (this.feller) {
      this.feller.createNewSprite(x, y)
    } else {
      this.feller = new Feller(this, x, y);
    }
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

  tileIsNearDoor(x: number, y: number, room: Room, threshold = 400) {
    for (let door of room.getDoorLocations()) {
      const [realDoorX, realDoorY] = [door.x + room.x, door.y + room.y]
      if ((
           x + 1 === realDoorX && y === realDoorY // left
        || x - 1 === realDoorX && y === realDoorY // right
        || x === realDoorX && y + 1 === realDoorY // up
        || x === realDoorX && y - 1 === realDoorY // down
        || Phaser.Math.Distance.BetweenPoints(this.map.tileToWorldXY(realDoorX, realDoorY)!, { x, y }) < threshold
      )) {
        return true
      }
    }
    return false;
  }

  addStuffToRooms() {
    if (this.stuffs) {
      this.stuffs.forEach(o => o?.destroy())
      this.stuffs = []
    }
    this.rooms.forEach(room => {
      // Stuff room with stuff
      let maxPossibleItems = -room.getDoorLocations().length
      for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
          if (this.walkableTilesAs01[y][x] === 1) {
            continue
          }
          maxPossibleItems++
        }
      }

      this.debug && console.log({maxPossibleItems, room})

      for (let i = 0; i < maxPossibleItems/3; i++) {
        this.addOneRandomStuffToRoom(room)
      }
    })
  }

  addOneRandomStuffToRoom(room: RoomWithEnemies) {
    const roll = Math.random()
    let [x, y] = this.findUnoccupiedRoomTile(room, 2)
    let tries = 0
    while (this.tileIsNearDoor(x, y, room) && tries < 20) {
      [x, y] = this.findUnoccupiedRoomTile(room, 2)
      tries++
    }

    if (tries < 20) {
      let object;
      if (roll < 0.25) {
        object = new Barrel(this, { room, damage: 3 * this.level, health: 3 * this.level, texture: 'barrel' }, x, y)
      } else if (roll < 0.75) {
        object = new Rock(this, { room, damage: 0, health: 10 * this.level, texture: 'rock' }, x, y)          
      }
      
      if (object) {
        this.stuffs.push(object)
        this.makeTileUnwalkable(x, y)
        this.debug && console.log(this.walkableTilesAs01)
      }
    }
    return tries
  }

  makeTileUnwalkable(x: number, y: number) {
    const newWalkable = this.walkableTilesAs01.map((row, _y) => row.map((tile, _x) => {
      return x === _x && y === _y ? 1 : tile
    }))
    this.walkableTilesAs01 = newWalkable
    this.debug && console.log({ newWalkable })
  }

  createNewLevel() {
    this.creatingNewLevel = true
    this.revealedRooms = new Set()

    this.level++
    this.createDungeon()
    this.createTilemap()
    this.drawMinimap()
    this.addStuffToRooms()
    this.putPlayerInStartRoom()
    this.setupCamera()
    this.addDoorSpritesToRooms()
    this.createWalkableGrid()
    this.spawnEnemiesInRooms()

    this.powerups.forEach(p => p?.destroy())
    this.powerups = []

    EventEmitter.emit('levelChanged', this.level, this.startRoom.guid)

    if (this.level > 1) {
      const pu = this.spawnPowerUp(this.startRoom, PowerUpType.Health)
      this.spawnPowerUp(this.startRoom, PowerUpType.Bullet, pu.x + this.map.tileWidth, pu.y)
    }

    this.creatingNewLevel = false
  }

  drawMinimap() {
    this.createWalkableGrid()
    EventEmitter.emit('drawMinimap')
  }

  spawnPowerUp(room: RoomWithEnemies, type?: PowerUpType, worldX?: number, worldY?: number) {
    worldX ||= this.map.tileToWorldX(room.centerX)!;
    worldY ||= this.map.tileToWorldY(room.centerY)!;

    // Add the lens flare sprite at the powerup position
    const flare = this.add.sprite(worldX, worldY, 'powerupBG').setScale(0.1);

    this.cameras.main.flash(100)

    // Create the tween
    this.tweens.add({
      targets: flare,
      angle: 360,
      duration: 750,
      onComplete: () => {
        flare?.destroy();
      },
      ease: 'Sine.easeInOut'
    });
    this.tweens.add({
      targets: flare,
      scale: { start: 0.1, to: 3.0 },
      yoyo: true,
      duration: 450,
      ease: 'Sine.easeInOut'
    })

    const powerupExclusions = []
    if (this.feller.speed >= this.feller.SPEED_LIMIT) {
      powerupExclusions.push(PowerUpType.Speed)
    }
    if (this.feller.RELOAD_COOLDOWN_MS <= 1) {
      powerupExclusions.push(PowerUpType.RateOfFire)
    }
    if (this.feller.knockback >= 5000) {
      powerupExclusions.push(PowerUpType.Knockback)
    }
    
    const powerup = new PowerUp(this, worldX, worldY, (type || roll(powerUps, powerupExclusions)) as PowerUpType);
    this.powerups.push(powerup)
    
    const gfx = this.add.graphics({ lineStyle: { color: 0xff0000, width: 3 }});
    if (this.debug) {
      gfx.lineBetween(worldX, worldY, this.feller.sprite.x, this.feller.sprite.y)
    }

    this.physics.add.overlap(this.feller.sprite, powerup, () => {
      this.feller.pickupPowerUp(powerup);
    });

    return powerup
  }

  checkRoomComplete(room: RoomWithEnemies) {
    if (room.enemies?.every(e => e.dead) && !room.hasSpawnedPowerup) {
      room.hasSpawnedPowerup = true
      this.spawnPowerUp(room)
      console.log('room complete', room.guid)
      EventEmitter.emit('roomComplete', room.guid)
    }
  }
  
  checkLevelComplete() {
    const roomsWithEnemies = this.rooms.filter(room => room.enemies?.filter(e => !e.dead).length > 0)
    // console.log({roomsWithEnemies})
    if (roomsWithEnemies.length > 0) {
      return false
    }
    EventEmitter.emit('levelCompleted', this.level)
    this.levellingUp = true
    this.feller.sprite.setVelocity(0)
    this.physics.world.colliders.getActive().forEach(c => c.destroy());
    this.deactivateSprites()
  }
  
  deactivateSprites() {
    this.scene.pause();
    this.enemies
      .filter((e: any) => e?.bullets)
      .map((e: any) => e.bullets.destroy());

    this.enemies.forEach(e => e.destroy())
    this.stuffs.forEach(s => s.destroy())
    this.feller.bullets.destroy()
  }

  demonsToFell = 0
  spawnEnemiesInRooms() {
    this.otherRooms.forEach(room => {
      let acceptableTiles: Point[] = []

      room.forEachTile(({ x, y }, tile) => {
        if (tile !== TILES.DUNGEON_TILES.FLOOR) return
        if (this.walkableTilesAs01?.[y]?.[x]) return
        // within this many tiles of door: RAUS!
        let notWithinThisManyTiles = 2
        for (let y1 = -notWithinThisManyTiles; y1 < notWithinThisManyTiles; y1++) {
          for (let x1 = -notWithinThisManyTiles; x1 < notWithinThisManyTiles; x1++) {
            let maybeTile = -1;
            try {
              maybeTile = room.getTileAt(x1 + x, y1 + y)
              if (maybeTile === TILES.DUNGEON_TILES.DOOR) {
                return
              }
            } catch {
              continue
            }
          }
        }
        acceptableTiles.push({ x, y })
      })
      
      const numToSpawn = Phaser.Math.Clamp(
        Math.floor(Math.random() * acceptableTiles.length), 
        this.level * 2, 
        this.level * 3
      )
    
      acceptableTiles = Phaser.Utils.Array.Shuffle(acceptableTiles.filter(t => t))
      this.debug && console.log({ room, acceptableTiles, numToSpawn })

      for (let i = 0; i < numToSpawn; i++) {
        if (!acceptableTiles[i]) break
        const enemyType = roll(enemyWeights)
        let enemy: Enemy | null = null;
        let {x, y} = acceptableTiles[i]
        this.debug && console.log('spawning enemy at', { x, y })
        this.spawnEnemy(enemyType, room, x, y)
      }
    });

    this.demonsToFell = 0
    for (let room of this.rooms) {
      this.demonsToFell += room.enemies.length 
    }

    this.demonsFelledLevel = 0
    EventEmitter.emit('demonsToFell', this.demonsToFell)
    EventEmitter.emit('demonsFelledLevel', this.demonsFelledLevel)
  }

  spawnEnemy(enemyType: EnemyType, room: RoomWithEnemies, tileX: number, tileY: number) {
    let enemy: Enemy | null = null;
    switch(enemyType) {
      case EnemyType.Goo:
        enemy = new Goo(this, { level: this.level, room, enemyType, texture: 'goo' }, tileX, tileY)
        break
      case EnemyType.Pig:
        enemy = new Pig(this, { level: this.level, room, enemyType, texture: 'pig' }, tileX, tileY)
        break
      case EnemyType.Glutton:
        enemy = new Glutton(this, { level: this.level, room, enemyType, texture: 'belcher' }, tileX, tileY)
        break
      case EnemyType.Soul:
        enemy = new Soul(this, { level: this.level, room, enemyType, texture: 'soul' }, tileX, tileY)
        break
      case EnemyType.Imp:
        enemy = new Imp(this, { level: this.level, room, enemyType, texture: 'imp' }, tileX, tileY)
        break
      case EnemyType.ImpMother:
        enemy = new ImpMother(this, { level: this.level, room, enemyType, texture: 'impmother' }, tileX, tileY)
        break
      case EnemyType.Gambler:
        enemy = new Gambler(this, { level: this.level, room, enemyType, texture: 'gambler' }, tileX, tileY)
        break
      case EnemyType.Hothead:
        enemy = new Hothead(this, { level: this.level, room, enemyType, texture: 'hothead' }, tileX, tileY)
        break
      default:
        break
    }
    if (enemy) {
      this.setUpEnemy(enemy)
      room.enemies ||= []
      room.enemies.push(enemy)
      return enemy
    }
  }

  setUpEnemy(enemy: Enemy) {
    this.physics.add.overlap(this.feller.sprite, enemy, () => {
      enemy.attack(this.feller)
    });
    this.enemies.push(enemy)
  }

  fixedUpdate(time: any, delta: any) {
    if (this.gameOver) {
      return
    }

    if (this.creatingNewLevel) {
      return
    }

    if (this.levellingUp) {
      return
    }

    if (this.debug) {
      if (Phaser.Input.Keyboard.JustDown(this.keys?.minus)) {
        this.cameras.main.setZoom(this.cameras.main.zoom / 1.25)
      } else if (Phaser.Input.Keyboard.JustDown(this.keys?.plus)) {
        this.cameras.main.setZoom(this.cameras.main.zoom * 1.25)
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys?.esc)) {
      EventEmitter.emit('pause')
      this.scene.pause()
    }
    
    this.feller.fixedUpdate(time, delta);
    this.enemies.forEach(x => x.fixedUpdate(time, delta))
    this.stuffs.forEach(x => x.fixedUpdate(time, delta))
    this.powerups.forEach(x => x.fixedUpdate(time, delta))

    this.fellerRoom = this.dungeon.getRoomAt(this.feller.tileX, this.feller.tileY)! as RoomWithEnemies;
    if (!this.revealedRooms.has(this.fellerRoom.guid)) {
      this.revealedRooms.add(this.fellerRoom.guid)
    }
    
    this.tilemapVisibility.setActiveRoom(this.fellerRoom);
    // console.log(this.feller.sprite.body!.x, this.feller.sprite.body!.y)
  }

  fixedDeltaTime = 1/60
  lastUpdateTime = performance.now()
  lastDeltaTime = 0
  update(time: any, delta: any) {
    let currentTime = performance.now()
    const deltaTime = currentTime - this.lastUpdateTime
    this.lastDeltaTime = deltaTime
    if (deltaTime > this.fixedDeltaTime) {
      this.fixedUpdate(currentTime, deltaTime)
      this.lastUpdateTime = currentTime - (deltaTime % this.fixedDeltaTime);
    }
    // this.feller.makeGunFollowFellerAndPointAtPointer_andMoveShieldsAndWings()
  }
}
