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
  const [demonsFelled, setDemonsFelled] = useState(0)

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

    const demonFelledListener = (felled: number) => {
      console.log('felled event', felled)
      setReloadSpeed(felled)
    }
    
    EventEmitter.on('health', healthListener);
    EventEmitter.on('speed', speedListener);
    EventEmitter.on('reloadSpeed', reloadSpeedListener);
    EventEmitter.on('gameOver', reloadSpeedListener);
    EventEmitter.on('demonFelled', demonFelledListener);
    
    return () => {
      EventEmitter.off('health', healthListener);
      EventEmitter.off('speed', speedListener);
      EventEmitter.off('reloadSpeed', reloadSpeedListener);
      EventEmitter.off('gameOver', reloadSpeedListener);
      EventEmitter.off('demonFelled', demonFelledListener);
    };
  }, [])

  const stats = <div className='stats'>
    <div className='health bar'>{hp} / {maxHp} HP</div>
    <div className='speed bar'>SPEED: {Math.round(speed / 24)}MPH</div>
    <div className='reloadSpeed bar'>RELOAD: {Math.round(40 / (reloadSpeed || 40) * 100)}%</div>
    <div className='demonsFelled bar'>DEMONS FELLED: {demonsFelled}</div>
  </div>
  return <>
    <div id="game-container" style={{ width: '100%', height: '100%' }} />
    {stats}
    {gameOver && <div className='game-over'>
      <div className='notice'>
        <h1>GAME OVER</h1>
        {stats}
        <p>
          THANK YOU FOR YOUR SERVICE
        </p>
        <button className='restart' onClick={() => {
          setGameOver(false)
          gameRef?.current?.scene.stop('GameScene')
          gameRef?.current?.scene.start('GameScene')
        }}>TRY AGAIN</button>
      </div>
    </div>}
  </>;
};
