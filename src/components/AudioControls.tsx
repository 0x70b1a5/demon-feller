import React, { useState } from "react";
import EventEmitter from "../game/EventEmitter";

const AudioControl = () => {
  const prefix = '__demonfeller-'
  let startMuted: any = localStorage.getItem(prefix+'isMuted') === 'true'
  let startMusicVolume: any = +localStorage.getItem(prefix+'musicVolume')! || 0.5
  let startSfxVolume: any = +localStorage.getItem(prefix+'sfxVolume')! || 1
  
  startMusicVolume = isNaN(startMusicVolume) ? 0.5 : startMusicVolume
  startSfxVolume = isNaN(startSfxVolume) ? 0.5 : startSfxVolume

  const [isMuted, setMuted] = useState(startMuted);
  const [musicVolume, setMusicVolume] = useState(startMusicVolume);
  const [sfxVolume, setSfxVolume] = useState(startSfxVolume);
  const [rwdFwdDisabled, setRwdFwdDisabled] = useState(false)

  const handleMute = () => {
    const nextMuteState = !isMuted;
    setMuted(nextMuteState);
    localStorage.setItem(prefix+'isMuted', String(nextMuteState))
    EventEmitter.emit('muteChanged', nextMuteState);
  };

  const handleMusicVolumeChange = (event: any) => {
    const volume = event.target.value;
    setMusicVolume(volume);
    localStorage.setItem(prefix+'musicVolume', volume)
    EventEmitter.emit('musicVolumeChanged', volume);
  };

  const handleSfxVolumeChange = (event: any) => {
    const volume = event.target.value;
    setSfxVolume(volume);
    localStorage.setItem(prefix+'sfxVolume', volume)
    EventEmitter.emit('sfxVolumeChanged', volume);
  };

  const handleRewind = (event: any) => {
    setRwdFwdDisabled(true)
    EventEmitter.emit('musicRewind');
    setTimeout(() => setRwdFwdDisabled(false), 1000)
  };

  const handleForward = (event: any) => {
    setRwdFwdDisabled(true)
    EventEmitter.emit('musicForward');
    setTimeout(() => setRwdFwdDisabled(false), 1000)
  };

  return (
    <div className="audio-controls">
      <div>
        <label>Volume:</label>
        <input
          type="range"
          min="0"
          max="1"
          step={0.1}
          value={musicVolume}
          onChange={handleMusicVolumeChange}
        />
      </div>

      <button className="btn mute" onClick={handleMute}>
        {isMuted ? "Unmute" : "Mute"}
      </button>

      {/* <button className="btn rwd" disabled={rwdFwdDisabled} onClick={handleRewind}>
        ⏪
      </button> */}

      <button className="btn fwd" disabled={rwdFwdDisabled} onClick={handleForward}>
        Skip Current Track ⏩
      </button>

      {/* <div>
        <label>SFX Volume:</label>
        <input
          type="range"
          min="0"
          max="100"
          value={sfxVolume}
          onChange={handleSfxVolumeChange}
        />
      </div> */}
    </div>
  );
};

export default AudioControl;
