import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { GameScene } from '../game/scenes/GameScene';
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import { MainMenuScene } from '../game/scenes/MainMenuScene';
import { BootScene } from '../game/scenes/BootScene';
import EventEmitter from '../game/EventEmitter';

export const GameComponent: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [hp, setHp] = useState(3)
  const [maxHp, setMaxHp] = useState(3)
  const [speed, setSpeed] = useState(300)
  const [reloadSpeed, setReloadSpeed] = useState(40)
  const [gameOver, setGameOver] = useState(false)
  const [levelUp, setLevelUp] = useState(false)
  const [demonsFelled, setDemonsFelled] = useState(0)
  const [demonsFelledLevel, setDemonsFelledLevel] = useState(0)
  const [demonsToFell, setDemonsToFell] = useState(0)
  const [minimap, setMinimap] = useState<DocumentFragment>()
  const [level, setLevel] = useState(1)

  const minimapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: 'game-container',
      width: windowSize.width,
      height: windowSize.height,
      scene: [BootScene, MainMenuScene, GameScene],
      physics: {
        default: 'arcade',
      },
      // pixelArt: true, // enable for no antialiasing
      plugins: {
        scene: [{
          key: 'rexUI',
          plugin: RexUIPlugin,
          mapping: 'rexUI'
        }]
      },
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
      }
    };
  }, []);

  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.scale.resize(windowSize.width, windowSize.height);
    }
  }, [windowSize]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const healthListener = ([hp, max]: [number, number]) => {
      console.log('health event', hp, max)
      setHp(hp)
      setMaxHp(max)
    };

    const speedListener = (speed: number) => {
      console.log('speed event', speed)
      setSpeed(speed)
    }

    const reloadSpeedListener = (rSpeed: number) => {
      console.log('rspeed event', rSpeed)
      setReloadSpeed(rSpeed)
    }

    const demonsFelledListener = (felled: number) => {
      console.log('felled event', felled)
      setDemonsFelled(felled)
    }

    const demonFelledLevelListener = (demons: number) => {
      setDemonsFelledLevel(demons)
    }

    const demonsToFellListener = (demons: number) => {
      setDemonsToFell(demons)
    }

    const minimapListener = (mm: DocumentFragment) => {
      console.log('minimap event')
      setMinimap(mm)
      if (minimapRef.current) {
        minimapRef.current.innerHTML = '';
        minimapRef.current.appendChild(mm);
      }
    }

    const gameOverListener = () => {
      setGameOver(true)
    }

    const levelUpListener = (newLevel: number) => {
      setLevel(newLevel)
      setLevelUp(true)
    }
    
    EventEmitter.on('health', healthListener);
    EventEmitter.on('speed', speedListener);
    EventEmitter.on('reloadSpeed', reloadSpeedListener);
    EventEmitter.on('gameOver', gameOverListener);
    EventEmitter.on('demonsFelledLevel', demonFelledLevelListener);
    EventEmitter.on('demonsFelled', demonsFelledListener);
    EventEmitter.on('demonsToFell', demonsToFellListener);
    EventEmitter.on('minimap', minimapListener);
    EventEmitter.on('levelUp', levelUpListener);
    
    return () => {
      EventEmitter.off('health', healthListener);
      EventEmitter.off('speed', speedListener);
      EventEmitter.off('reloadSpeed', reloadSpeedListener);
      EventEmitter.off('gameOver', gameOverListener);
      EventEmitter.off('demonsFelledLevel', demonFelledLevelListener);
      EventEmitter.off('demonsFelled', demonsFelledListener);
      EventEmitter.off('demonsToFell', demonsToFellListener);
      EventEmitter.off('levelUp', levelUpListener);
    };
  }, [])

  const stats = <div className='stats'>
    <div className='health bar'>
      HP:
      <div className='stat'> {hp}/{maxHp}</div>
    </div>
    <div className='speed bar'>
      SPEED:
      <div className='stat'> {Math.round(speed / 24)}MPH</div>
    </div>
    <div className='reloadSpeed bar'>
      R.O.F.:
      <div className='stat'>{Number(40 / (reloadSpeed || 40)).toPrecision(3)}x</div>
    </div>
    <div className='demonsFelled bar'>
      FELLED (LV):
      <div className='stat'>{demonsFelledLevel}/{demonsToFell}</div>
    </div>
    <div className='demonsFelled bar'>
      FELLED:
      <div className='stat'> {demonsFelled}</div>
    </div>
  </div>
  return <>
    <div id="game-container" style={{ width: '100%', height: '100%' }} />
    {stats}
    <div id='minimap' ref={minimapRef}></div>
    {levelUp && <div className='level-up overlay'>
      <div className='notice'>
        <h1>LEVEL {level} COMPLETE!</h1>
        {stats}
        <p className='ty'>
          BUT HELL IS NOT YET EMPTY
        </p>
        <button className='big-btn continue' onClick={() => {
          setLevelUp(false)
          EventEmitter.emit('goToNextLevel')
        }}>GO DEEPER</button>
      </div>
    </div>}
    {gameOver && <div className='game-over overlay'>
      <div className='notice'>
        <h1>GAME OVER</h1>
        {stats}
        <p className='ty'>
          THANK YOU FOR YOUR SERVICE
        </p>
        <button className='big-btn restart' onClick={() => {
          setGameOver(false)
          // Remove the GameScene completely
          gameRef?.current?.scene.remove('GameScene');
          // Add it back in and start it
          gameRef?.current?.scene.add('GameScene', GameScene, true);
        }}>TRY AGAIN</button>
      </div>
    </div>}
  </>;
};
