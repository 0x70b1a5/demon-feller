import Phaser from 'phaser'
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';

import animations from '../util/animate'
import colors from '../constants/colors'
import scales from '../constants/scaling'; 

export interface Room { id: string, portals: Portal[], startingXY: null | [number | (() => number), number | (() => number)] }
export interface Portal { destination: string, sprite?: Phaser.Physics.Arcade.Sprite, label?: RexUIPlugin.Label }
export interface OurCursorKeys extends Phaser.Types.Input.Keyboard.CursorKeys {
  tractor: Phaser.Input.Keyboard.Key
}

export class GameScene extends Phaser.Scene {
  private feller!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private WASD!: Phaser.Types.Input.Keyboard.CursorKeys
  private rexUI!: RexUIPlugin
  
  constructor() {
    super({ key: 'GameScene' })
  }

  preload() {
  }

  init() {
  }

  create() {
    this.physics.world.createDebugGraphic();
    if (!this?.input?.keyboard) return alert('Keyboard is required!')

    this.cursors = this.input.keyboard.createCursorKeys()

    this.WASD = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      shift: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
    };

    this.feller = this.physics.add.sprite(400, 300, 'feller').setScale(scales.QUARTER)

    animations.enshadow(this.feller)
    
    this.feller.setCollideWorldBounds(true)
  }

  update() {
    this.respondToMovementKeys()
  }

  private respondToMovementKeys() {
    const b = this.bodify(this.feller.body)
    const speed = 5

    // Check for arrow key inputs and move accordingly
    if (this.cursors.left?.isDown || this.WASD.left?.isDown) {
      b.x -= speed
    } else if (this.cursors.right?.isDown || this.WASD.right?.isDown) {
      b.x += speed
    }

    if (this.cursors.up?.isDown || this.WASD.up?.isDown) {
      b.y -= speed
    } else if (this.cursors.down?.isDown || this.WASD.down?.isDown) {
      b.y += speed
    }

    if (this.cursors.space?.isDown) {
      alert('SHOOT!!!')
    }
  }

  private bodify(b: any) {
    return b as Phaser.Physics.Arcade.Body
  }
}
