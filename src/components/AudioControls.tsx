import React, { useState } from "react";
import EventEmitter from "../game/EventEmitter";

const AudioControl = () => {
  const [isMuted, setMuted] = useState(false);
  const [musicVolume, setMusicVolume] = useState(50);
  const [sfxVolume, setSfxVolume] = useState(50);

  const handleMute = () => {
    const nextMuteState = !isMuted;
    setMuted(nextMuteState);
    EventEmitter.emit('muteChanged', nextMuteState);
  };

  const handleMusicVolumeChange = (event: any) => {
    const volume = event.target.value;
    setMusicVolume(volume);
    EventEmitter.emit('musicVolumeChanged', volume);
  };

  const handleSfxVolumeChange = (event: any) => {
    const volume = event.target.value;
    setSfxVolume(volume);
    EventEmitter.emit('sfxVolumeChanged', volume);
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

      <button className="btn" onClick={handleMute}>
        {isMuted ? "Unmute" : "Mute"}
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
