const animations = {
  wobbleSprite: (me: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, minRotation: number = -10, maxRotation: number = 10) => {
    me.tweens.add({
      targets: sprite,
      rotation: {
        value: Phaser.Math.DegToRad(maxRotation),
        duration: 2000 + Math.random() * 1000,
        yoyo: true,  // Go back to original position after reaching target
        repeat: -1,  // Repeat forever
        ease: 'Sine.easeInOut'  // Use a sine wave for smooth start and end
      },
      onComplete: () => {
        sprite.rotation = Phaser.Math.DegToRad(minRotation);
      }
    });
  },
  enshadow: (sprite: Phaser.GameObjects.Sprite) => {
    sprite.preFX?.addShadow(-5, -5, 0.005, 0.5, 0x0)
  }
}

export default animations
