import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import colors from '../constants/colors'

export class MainMenuScene extends Phaser.Scene {
  private rexUI!: RexUIPlugin

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    // Add title image
    const titleImage = this.rexUI.add.label({
      width: 40,
      height: 40,
  
      text: this.add.text(0, 0, 'DEMON\nFELLER', {
        fontFamily: 'pkmn', color: 'white', fontSize: 128
      }),
  
      space: {
        top: 20, left: 20, right: 20, bottom: 10
      },
  
      align: 'center',

      anchor: {
        centerX: 'center',
        centerY: 'center-200'
      }
    })
    .setInteractive()
    .setOrigin(0.5, 0.5)
    .layout()

    // Add play button
    const playButton = this.rexUI.add.label({
      width: 40,
      height: 40,
  
      background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 20, colors.TEXTBOX_BG_COLOR),
  
      text: this.add.text(0, 0, 'Play', {
        fontFamily: 'pkmn', color: colors.TEXT_COLOR, fontSize: 72
      }),
  
      space: {
        top: 20, left: 20, right: 20, bottom: 10
      },
  
      align: 'center',

      anchor:{ 
        centerX: 'center',
        centerY:'center'
      }
    })
    .setInteractive()
    .setOrigin(0.5, 0.5)
    .layout()

    playButton.on('pointerup', () => {
      // Transition to game scene
      this.scene.start('GameScene');
      this.scene.bringToTop('GameScene')
    }, this);
  }
}
