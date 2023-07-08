import animations from "./util/animate";

/**
 * A class that wraps up our top down player logic. It creates, animates and moves a sprite in
 * response to WASD keys. Call its update method from the scene's update and call its destroy
 * method when you're done with the player.
 */
export default class Feller {
  scene!: Phaser.Scene
  sprite!: Phaser.Physics.Arcade.Sprite
  keys!: Phaser.Types.Input.Keyboard.CursorKeys

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    const anims = scene.anims;
    anims.create({
      key: 'player-walk',
      frames: anims.generateFrameNumbers('feller-sheet', { start: 1, end: 3 }),
      frameRate: 8,
      repeat: -1
    })

    this.sprite = scene.physics.add
      .sprite(x, y, 'feller-sheet', 0)
      .setSize(200, 200)

    this.sprite.anims.play('player-walk');

    this.keys = scene.input.keyboard!.createCursorKeys();
  }

  freeze() {
    this.bodify(this.sprite).moves = false;
  }

  bodify(sprite: Phaser.Physics.Arcade.Sprite) {
    return (sprite.body as Phaser.Physics.Arcade.Body)
  }

  update() {
    const keys = this.keys;
    const sprite = this.sprite;
    const speed = 300;
    const body = this.bodify(sprite)
    const prevVelocity = body.velocity.clone();

    // Stop any previous movement from the last frame
    body.setVelocity(0);

    // Horizontal movement
    if (keys.left.isDown) {
      body.setVelocityX(-speed);
      sprite.setFlipX(true);
    } else if (keys.right.isDown) {
      body.setVelocityX(speed);
      sprite.setFlipX(false);
    }

    // Vertical movement
    if (keys.up.isDown) {
      body.setVelocityY(-speed);
    } else if (keys.down.isDown) {
      body.setVelocityY(speed);
    }

    // Normalize and scale the velocity so that sprite can't move faster along a diagonal
    body.velocity.normalize().scale(speed);

    // Update the animation last and give left/right/down animations precedence over up animations
    if (keys.left.isDown || keys.right.isDown || keys.down.isDown || keys.up.isDown) {
      sprite.anims.play('player-walk', true);
    // } else if (keys.up.isDown) {
    //   sprite.anims.play('player-walk-back', true);
    } else {
      sprite.anims.stop();

      // If we were moving & now we're not, then pick a single idle frame to use
      // if (prevVelocity.y < 0) sprite.setTexture('feller', 65);
      // else sprite.setTexture('feller', 46);
      sprite.setTexture('feller-sheet', 0);
    }
    
    if (this.keys.space.isDown) {
      alert('SHOOT!!!')
    }
  }

  destroy() {
    this.sprite.destroy();
  }
}
