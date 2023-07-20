const animations = {
  wobbleSprite: (me: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, minRotation: number = -10, maxRotation: number = 10, duration = 2000, randomDuration = true) => {
    me.tweens.add({
      targets: sprite,
      rotation: {
        value: { from: Phaser.Math.DegToRad(minRotation), to: Phaser.Math.DegToRad(maxRotation) },
        duration: duration + (randomDuration ? Math.random() * 1000 : 0),
        yoyo: true,  // Go back to original position after reaching target
        repeat: -1,  // Repeat forever
        ease: 'Sine.easeInOut'  // Use a sine wave for smooth start and end
      },
    });
  },
  enshadow: (sprite: Phaser.GameObjects.Sprite) => {
    sprite.preFX?.addShadow(-5, -5, 0.01, 0.5, 0x0)
  }
}

export default animations
