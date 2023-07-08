import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import colors from '../constants/colors'

export class MainMenuScene extends Phaser.Scene {
  private rexUI!: RexUIPlugin

  constructor() {
    super('MainMenuScene');
  }

  create() {
    // Add title image
    const titleImage = this.rexUI.add.label({
      width: 40,
      height: 40,
  
      background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 20, colors.TEXTBOX_BG_COLOR),
  
      text: this.add.text(0, 0, 'DEMON FELLER', {
        fontFamily: 'pkmn', color: colors.TEXT_COLOR
      }),
  
      space: {
        left: 10,
        right: 10,
      },
  
      align: 'center',

      anchor: {
        centerX: 'center',
        centerY: 'top'
      }
    })
    .setInteractive()
    .setOrigin(0.5, 0.5)

    // Add play button
    const playButton = this.rexUI.add.label({
      width: 40,
      height: 40,
  
      background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 20, colors.TEXTBOX_BG_COLOR),
  
      text: this.add.text(0, 0, 'Play', {
        fontFamily: 'pkmn', color: colors.TEXT_COLOR
      }),
  
      space: {
        left: 10,
        right: 10,
      },
  
      align: 'center',

      anchor:{ 
        centerX: 'center',
        centerY:'top+20%'
      }
    })
    .setInteractive()
    .setOrigin(0.5, 0.5)

    playButton.on('pointerup', () => {
      // Transition to game scene
      this.scene.start('GameScene');
    }, this);
  }
}
