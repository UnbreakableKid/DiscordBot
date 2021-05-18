import { EventEmitter } from "https://deno.land/std@0.51.0/node/events.ts";
export class Player extends EventEmitter {
    /**
   * The id of the guild this player belongs to.
   */ guild;
    /**
   * The socket this player belongs to.
   */ socket;
    /**
   * The id of the voice channel this player is connected to.
   */ channel;
    /**
   * Whether this player is paused or not.
   */ paused;
    /**
   * The current playing track.
   */ track;
    /**
   * Whether this player is playing or not.
   */ playing;
    /**
   * The unix timestamp in which this player started playing.
   */ timestamp;
    /**
   * Track position in milliseconds.
   */ position;
    /**
   * The current volume of this player.
   */ volume;
    /**
   * Equalizer bands this player is using.
   */ equalizer;
    /**
   * If this player is connected to a voice channel.
   */ connected;
    /**
   * The voice state for this player.
   * @internal
   */ _state;
    /**
   * The voice server for this player.
   * @internal
   */ _server;
    /**
   * @param socket The socket this player belongs to.
   * @param guild The guild that this player is for.
   */ constructor(socket, guild){
        super();
        this.socket = socket;
        this.guild = guild;
        this.paused = false;
        this.playing = false;
        this.position = 0;
        this.volume = 100;
        this.equalizer = [];
        this.connected = false;
        this.on("playerUpdate", this._playerUpdate.bind(this));
        this.on("event", this._event.bind(this));
    }
    /**
   * The head manager of everything.
   * @since 2.1.0
   */ get manager() {
        return this.socket.manager;
    }
    /**
   * Connects to the specified voice channel.
   * @param channel A channel id or object.
   * @param options Options for self mute, self deaf, or force connecting.
   * @since 2.1.x
   */ connect(channel, options = {
    }) {
        const channelId = typeof channel === "object" ? channel?.id : channel;
        this.socket.manager.send(this.guild, {
            op: 4,
            d: {
                guild_id: this.guild,
                channel_id: channelId ? channelId : null,
                self_deaf: options.selfDeaf ?? false,
                self_mute: options.selfMute ?? false
            }
        });
        this.channel = channelId;
        this.connected = !!channelId;
        return this;
    }
    /**
   * Disconnect from the voice channel.
   * @since 2.1.x
   */ disconnect() {
        return this.connect(null);
    }
    /**
   * Moves this player to another socket.
   * @param socket The socket to move to.
   * @since 3.0.14
   */ async move(socket) {
        this.socket = socket;
        await this.destroy();
        if (this.channel) this.connect(this.channel);
        return this;
    }
    /**
   * Plays the specified base64 track.
   * @param track The track to play.
   * @param options Play options to send along with the track.
   * @since 1.x.x
   */ play(track, options = {
    }) {
        return this.send("play", Object.assign({
            track: typeof track === "object" ? track.track : track
        }, options));
    }
    /**
   * Change the volume of the player. You can omit the volume param to reset back to 100
   * @param volume May range from 0 to 1000, defaults to 100
   */ setVolume(volume = 100) {
        if (volume < 0 || volume > 1000) throw new RangeError(`Player#setVolume (${this.guild}): Volume must be within the 0 to 1000 range.`);
        this.volume = volume;
        return this.send("volume", {
            volume
        });
    }
    /**
   * Change the paused state of this player. `true` to pause, `false` to resume.
   * @param state Pause state, defaults to true.
   * @since 1.x.x
   */ pause(state = true) {
        this.paused = state;
        this.playing = !state;
        return this.send("pause", {
            pause: state
        });
    }
    /**
   * Resumes the player, if paused.
   * @since 1.x.x
   */ resume() {
        return this.pause(false);
    }
    /**
   * Stops the current playing track.
   * @since 1.x.x
   */ stop() {
        delete this.track;
        delete this.timestamp;
        this.position = 0;
        return this.send("stop");
    }
    /**
   * Seek to a position in the current song.
   * @param position The position to seek to in milliseconds.
   */ seek(position) {
        if (!this.track) throw new Error(`Player#seek() ${this.guild}: Not playing anything.`);
        return this.send("seek", {
            position
        });
    }
    /**
   * Sets the equalizer of this player.
   * @param bands Equalizer bands to use.
   * @since 2.1.x
   */ setEqualizer(bands) {
        this.equalizer = bands ?? [];
        return this.send("equalizer", {
            bands
        });
    }
    /**
   * Destroy this player.
   * @param disconnect Disconnect from the voice channel.
   * @since 1.x.x
   */ async destroy(disconnect = false) {
        if (disconnect) await this.disconnect();
        return this.send("destroy");
    }
    /**
   * Provide a voice update from discord.
   * @param update
   * @since 1.x.x
   * @private
   */ provide(update) {
        if ("token" in update) this._server = update;
        else this._state = update;
        return this;
    }
    /**
   * Send a voice update to lavalink.
   * @since 2.1.x
   * @internal
   */ async voiceUpdate() {
        if (!this._server || !this._state) return;
        await this.send("voiceUpdate", {
            sessionId: this._state.session_id,
            event: this._server
        }, true);
        delete this._state;
        delete this._server;
    }
    /**
   * Send data to lavalink as this player.
   * @param op The operation.
   * @param data The data.
   * @param priority Whether or not this is a prioritized operation.
   * @since 1.0.0
   */ async send(op, data = {
    }, priority = false) {
        await this.socket.send({
            op,
            ...data,
            guildId: this.guild
        }, priority);
        return this;
    }
    /**
   * @private
   */ async _event(event) {
        switch(event.type){
            case "TrackEndEvent":
                if (event.reason !== "REPLACED") this.playing = false;
                delete this.timestamp;
                delete this.track;
                this.emit("end", event);
                break;
            case "TrackExceptionEvent":
                this.emit("error", event);
                break;
            case "TrackStartEvent":
                this.playing = true;
                this.track = event.track;
                this.emit("start", event);
                break;
            case "TrackStuckEvent":
                await this.stop();
                this.emit("stuck", event);
                break;
            case "WebSocketClosedEvent":
                this.emit("closed", event);
                break;
        }
    }
    /**
   * @private
   */ _playerUpdate(update) {
        if (!update.state) return;
        this.position = update.state.position;
        this.timestamp = update.state.time;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9sYXZhZGVuby9tYXN0ZXIvc3JjL2FwaS9QbGF5ZXIudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC41MS4wL25vZGUvZXZlbnRzLnRzXCI7XG5cbmltcG9ydCB0eXBlIHsgTWFuYWdlciwgVm9pY2VTZXJ2ZXIsIFZvaWNlU3RhdGUgfSBmcm9tIFwiLi4vTWFuYWdlci50c1wiO1xuaW1wb3J0IHR5cGUgeyBTb2NrZXQgfSBmcm9tIFwiLi9Tb2NrZXQudHNcIjtcbmltcG9ydCB0eXBlIHtcbiAgRXF1YWxpemVyQmFuZCxcbiAgRXZlbnQsXG4gIFBsYXllclVwZGF0ZSxcbiAgVHJhY2ssXG4gIFRyYWNrRW5kRXZlbnQsXG4gIFRyYWNrRXhjZXB0aW9uRXZlbnQsXG4gIFRyYWNrU3RhcnRFdmVudCxcbiAgVHJhY2tTdHVja0V2ZW50LFxuICBXZWJTb2NrZXRDbG9zZWRFdmVudFxufSBmcm9tIFwiLi4vQHR5cGVzL2luZGV4LmQudHNcIjtcblxuZXhwb3J0IGNsYXNzIFBsYXllciBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIC8qKlxuICAgKiBUaGUgaWQgb2YgdGhlIGd1aWxkIHRoaXMgcGxheWVyIGJlbG9uZ3MgdG8uXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgZ3VpbGQ6IHN0cmluZztcblxuICAvKipcbiAgICogVGhlIHNvY2tldCB0aGlzIHBsYXllciBiZWxvbmdzIHRvLlxuICAgKi9cbiAgcHVibGljIHNvY2tldDogU29ja2V0O1xuXG4gIC8qKlxuICAgKiBUaGUgaWQgb2YgdGhlIHZvaWNlIGNoYW5uZWwgdGhpcyBwbGF5ZXIgaXMgY29ubmVjdGVkIHRvLlxuICAgKi9cbiAgcHVibGljIGNoYW5uZWw6IHN0cmluZyB8IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogV2hldGhlciB0aGlzIHBsYXllciBpcyBwYXVzZWQgb3Igbm90LlxuICAgKi9cbiAgcHVibGljIHBhdXNlZDogYm9vbGVhbjtcblxuICAvKipcbiAgICogVGhlIGN1cnJlbnQgcGxheWluZyB0cmFjay5cbiAgICovXG4gIHB1YmxpYyB0cmFjazogc3RyaW5nIHwgdW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoaXMgcGxheWVyIGlzIHBsYXlpbmcgb3Igbm90LlxuICAgKi9cbiAgcHVibGljIHBsYXlpbmc6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFRoZSB1bml4IHRpbWVzdGFtcCBpbiB3aGljaCB0aGlzIHBsYXllciBzdGFydGVkIHBsYXlpbmcuXG4gICAqL1xuICBwdWJsaWMgdGltZXN0YW1wOiBudW1iZXIgfCB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFRyYWNrIHBvc2l0aW9uIGluIG1pbGxpc2Vjb25kcy5cbiAgICovXG4gIHB1YmxpYyBwb3NpdGlvbjogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgY3VycmVudCB2b2x1bWUgb2YgdGhpcyBwbGF5ZXIuXG4gICAqL1xuICBwdWJsaWMgdm9sdW1lOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEVxdWFsaXplciBiYW5kcyB0aGlzIHBsYXllciBpcyB1c2luZy5cbiAgICovXG4gIHB1YmxpYyBlcXVhbGl6ZXI6IEVxdWFsaXplckJhbmRbXTtcblxuICAvKipcbiAgICogSWYgdGhpcyBwbGF5ZXIgaXMgY29ubmVjdGVkIHRvIGEgdm9pY2UgY2hhbm5lbC5cbiAgICovXG4gIHB1YmxpYyBjb25uZWN0ZWQ6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFRoZSB2b2ljZSBzdGF0ZSBmb3IgdGhpcyBwbGF5ZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBfc3RhdGU6IFZvaWNlU3RhdGUgfCB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFRoZSB2b2ljZSBzZXJ2ZXIgZm9yIHRoaXMgcGxheWVyLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByaXZhdGUgX3NlcnZlcjogVm9pY2VTZXJ2ZXIgfCB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBzb2NrZXQgVGhlIHNvY2tldCB0aGlzIHBsYXllciBiZWxvbmdzIHRvLlxuICAgKiBAcGFyYW0gZ3VpbGQgVGhlIGd1aWxkIHRoYXQgdGhpcyBwbGF5ZXIgaXMgZm9yLlxuICAgKi9cbiAgcHVibGljIGNvbnN0cnVjdG9yKHNvY2tldDogU29ja2V0LCBndWlsZDogc3RyaW5nKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMuc29ja2V0ID0gc29ja2V0O1xuICAgIHRoaXMuZ3VpbGQgPSBndWlsZDtcblxuICAgIHRoaXMucGF1c2VkID0gZmFsc2U7XG4gICAgdGhpcy5wbGF5aW5nID0gZmFsc2U7XG4gICAgdGhpcy5wb3NpdGlvbiA9IDA7XG4gICAgdGhpcy52b2x1bWUgPSAxMDA7XG4gICAgdGhpcy5lcXVhbGl6ZXIgPSBbXTtcbiAgICB0aGlzLmNvbm5lY3RlZCA9IGZhbHNlO1xuXG4gICAgdGhpcy5vbihcInBsYXllclVwZGF0ZVwiLCB0aGlzLl9wbGF5ZXJVcGRhdGUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5vbihcImV2ZW50XCIsIHRoaXMuX2V2ZW50LmJpbmQodGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBoZWFkIG1hbmFnZXIgb2YgZXZlcnl0aGluZy5cbiAgICogQHNpbmNlIDIuMS4wXG4gICAqL1xuICBwdWJsaWMgZ2V0IG1hbmFnZXIoKTogTWFuYWdlciB7XG4gICAgcmV0dXJuIHRoaXMuc29ja2V0Lm1hbmFnZXI7XG4gIH1cblxuICAvKipcbiAgICogQ29ubmVjdHMgdG8gdGhlIHNwZWNpZmllZCB2b2ljZSBjaGFubmVsLlxuICAgKiBAcGFyYW0gY2hhbm5lbCBBIGNoYW5uZWwgaWQgb3Igb2JqZWN0LlxuICAgKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIGZvciBzZWxmIG11dGUsIHNlbGYgZGVhZiwgb3IgZm9yY2UgY29ubmVjdGluZy5cbiAgICogQHNpbmNlIDIuMS54XG4gICAqL1xuICBwdWJsaWMgY29ubmVjdChjaGFubmVsOiBzdHJpbmcgfCBudWxsIHwgRGljdGlvbmFyeTxhbnk+LCBvcHRpb25zOiBDb25uZWN0T3B0aW9ucyA9IHt9KTogdGhpcyB7XG4gICAgY29uc3QgY2hhbm5lbElkID0gdHlwZW9mIGNoYW5uZWwgPT09IFwib2JqZWN0XCIgPyBjaGFubmVsPy5pZCA6IGNoYW5uZWw7XG5cbiAgICB0aGlzLnNvY2tldC5tYW5hZ2VyLnNlbmQodGhpcy5ndWlsZCwge1xuICAgICAgb3A6IDQsXG4gICAgICBkOiB7XG4gICAgICAgIGd1aWxkX2lkOiB0aGlzLmd1aWxkLFxuICAgICAgICBjaGFubmVsX2lkOiBjaGFubmVsSWQgPyBjaGFubmVsSWQgOiBudWxsLFxuICAgICAgICBzZWxmX2RlYWY6IG9wdGlvbnMuc2VsZkRlYWYgPz8gZmFsc2UsXG4gICAgICAgIHNlbGZfbXV0ZTogb3B0aW9ucy5zZWxmTXV0ZSA/PyBmYWxzZVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5jaGFubmVsID0gY2hhbm5lbElkO1xuICAgIHRoaXMuY29ubmVjdGVkID0gISFjaGFubmVsSWQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogRGlzY29ubmVjdCBmcm9tIHRoZSB2b2ljZSBjaGFubmVsLlxuICAgKiBAc2luY2UgMi4xLnhcbiAgICovXG4gIHB1YmxpYyBkaXNjb25uZWN0KCk6IHRoaXMge1xuICAgIHJldHVybiB0aGlzLmNvbm5lY3QobnVsbCk7XG4gIH1cblxuICAvKipcbiAgICogTW92ZXMgdGhpcyBwbGF5ZXIgdG8gYW5vdGhlciBzb2NrZXQuXG4gICAqIEBwYXJhbSBzb2NrZXQgVGhlIHNvY2tldCB0byBtb3ZlIHRvLlxuICAgKiBAc2luY2UgMy4wLjE0XG4gICAqL1xuICBwdWJsaWMgYXN5bmMgbW92ZShzb2NrZXQ6IFNvY2tldCk6IFByb21pc2U8UGxheWVyPiB7XG4gICAgdGhpcy5zb2NrZXQgPSBzb2NrZXQ7XG5cbiAgICBhd2FpdCB0aGlzLmRlc3Ryb3koKTtcbiAgICBpZiAodGhpcy5jaGFubmVsKSB0aGlzLmNvbm5lY3QodGhpcy5jaGFubmVsKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFBsYXlzIHRoZSBzcGVjaWZpZWQgYmFzZTY0IHRyYWNrLlxuICAgKiBAcGFyYW0gdHJhY2sgVGhlIHRyYWNrIHRvIHBsYXkuXG4gICAqIEBwYXJhbSBvcHRpb25zIFBsYXkgb3B0aW9ucyB0byBzZW5kIGFsb25nIHdpdGggdGhlIHRyYWNrLlxuICAgKiBAc2luY2UgMS54LnhcbiAgICovXG4gIHB1YmxpYyBwbGF5KHRyYWNrOiBzdHJpbmcgfCBUcmFjaywgb3B0aW9uczogUGxheU9wdGlvbnMgPSB7fSk6IFByb21pc2U8dGhpcz4ge1xuICAgIHJldHVybiB0aGlzLnNlbmQoXCJwbGF5XCIsIE9iamVjdC5hc3NpZ24oe1xuICAgICAgdHJhY2s6IHR5cGVvZiB0cmFjayA9PT0gXCJvYmplY3RcIiA/IHRyYWNrLnRyYWNrIDogdHJhY2tcbiAgICB9LCBvcHRpb25zKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGFuZ2UgdGhlIHZvbHVtZSBvZiB0aGUgcGxheWVyLiBZb3UgY2FuIG9taXQgdGhlIHZvbHVtZSBwYXJhbSB0byByZXNldCBiYWNrIHRvIDEwMFxuICAgKiBAcGFyYW0gdm9sdW1lIE1heSByYW5nZSBmcm9tIDAgdG8gMTAwMCwgZGVmYXVsdHMgdG8gMTAwXG4gICAqL1xuICBwdWJsaWMgc2V0Vm9sdW1lKHZvbHVtZTogbnVtYmVyID0gMTAwKTogUHJvbWlzZTx0aGlzPiB7XG4gICAgaWYgKHZvbHVtZSA8IDAgfHwgdm9sdW1lID4gMTAwMClcbiAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKGBQbGF5ZXIjc2V0Vm9sdW1lICgke3RoaXMuZ3VpbGR9KTogVm9sdW1lIG11c3QgYmUgd2l0aGluIHRoZSAwIHRvIDEwMDAgcmFuZ2UuYCk7XG5cbiAgICB0aGlzLnZvbHVtZSA9IHZvbHVtZTtcblxuICAgIHJldHVybiB0aGlzLnNlbmQoXCJ2b2x1bWVcIiwgeyB2b2x1bWUgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGFuZ2UgdGhlIHBhdXNlZCBzdGF0ZSBvZiB0aGlzIHBsYXllci4gYHRydWVgIHRvIHBhdXNlLCBgZmFsc2VgIHRvIHJlc3VtZS5cbiAgICogQHBhcmFtIHN0YXRlIFBhdXNlIHN0YXRlLCBkZWZhdWx0cyB0byB0cnVlLlxuICAgKiBAc2luY2UgMS54LnhcbiAgICovXG4gIHB1YmxpYyBwYXVzZShzdGF0ZSA9IHRydWUpOiBQcm9taXNlPHRoaXM+IHtcbiAgICB0aGlzLnBhdXNlZCA9IHN0YXRlO1xuICAgIHRoaXMucGxheWluZyA9ICFzdGF0ZTtcbiAgICByZXR1cm4gdGhpcy5zZW5kKFwicGF1c2VcIiwgeyBwYXVzZTogc3RhdGUgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVzdW1lcyB0aGUgcGxheWVyLCBpZiBwYXVzZWQuXG4gICAqIEBzaW5jZSAxLngueFxuICAgKi9cbiAgcHVibGljIHJlc3VtZSgpOiBQcm9taXNlPHRoaXM+IHtcbiAgICByZXR1cm4gdGhpcy5wYXVzZShmYWxzZSk7XG4gIH1cblxuICAvKipcbiAgICogU3RvcHMgdGhlIGN1cnJlbnQgcGxheWluZyB0cmFjay5cbiAgICogQHNpbmNlIDEueC54XG4gICAqL1xuICBwdWJsaWMgc3RvcCgpOiBQcm9taXNlPHRoaXM+IHtcbiAgICBkZWxldGUgdGhpcy50cmFjaztcbiAgICBkZWxldGUgdGhpcy50aW1lc3RhbXA7XG4gICAgdGhpcy5wb3NpdGlvbiA9IDA7XG5cbiAgICByZXR1cm4gdGhpcy5zZW5kKFwic3RvcFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWVrIHRvIGEgcG9zaXRpb24gaW4gdGhlIGN1cnJlbnQgc29uZy5cbiAgICogQHBhcmFtIHBvc2l0aW9uIFRoZSBwb3NpdGlvbiB0byBzZWVrIHRvIGluIG1pbGxpc2Vjb25kcy5cbiAgICovXG4gIHB1YmxpYyBzZWVrKHBvc2l0aW9uOiBudW1iZXIpOiBQcm9taXNlPHRoaXM+IHtcbiAgICBpZiAoIXRoaXMudHJhY2spIHRocm93IG5ldyBFcnJvcihgUGxheWVyI3NlZWsoKSAke3RoaXMuZ3VpbGR9OiBOb3QgcGxheWluZyBhbnl0aGluZy5gKTtcbiAgICByZXR1cm4gdGhpcy5zZW5kKFwic2Vla1wiLCB7IHBvc2l0aW9uIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGVxdWFsaXplciBvZiB0aGlzIHBsYXllci5cbiAgICogQHBhcmFtIGJhbmRzIEVxdWFsaXplciBiYW5kcyB0byB1c2UuXG4gICAqIEBzaW5jZSAyLjEueFxuICAgKi9cbiAgcHVibGljIHNldEVxdWFsaXplcihiYW5kczogRXF1YWxpemVyQmFuZFtdKTogUHJvbWlzZTx0aGlzPiB7XG4gICAgdGhpcy5lcXVhbGl6ZXIgPSBiYW5kcyA/PyBbXTtcbiAgICByZXR1cm4gdGhpcy5zZW5kKFwiZXF1YWxpemVyXCIsIHsgYmFuZHMgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveSB0aGlzIHBsYXllci5cbiAgICogQHBhcmFtIGRpc2Nvbm5lY3QgRGlzY29ubmVjdCBmcm9tIHRoZSB2b2ljZSBjaGFubmVsLlxuICAgKiBAc2luY2UgMS54LnhcbiAgICovXG4gIHB1YmxpYyBhc3luYyBkZXN0cm95KGRpc2Nvbm5lY3QgPSBmYWxzZSk6IFByb21pc2U8dGhpcz4ge1xuICAgIGlmIChkaXNjb25uZWN0KSBhd2FpdCB0aGlzLmRpc2Nvbm5lY3QoKTtcbiAgICByZXR1cm4gdGhpcy5zZW5kKFwiZGVzdHJveVwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm92aWRlIGEgdm9pY2UgdXBkYXRlIGZyb20gZGlzY29yZC5cbiAgICogQHBhcmFtIHVwZGF0ZVxuICAgKiBAc2luY2UgMS54LnhcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHB1YmxpYyBwcm92aWRlKHVwZGF0ZTogVm9pY2VTdGF0ZSB8IFZvaWNlU2VydmVyKTogdGhpcyB7XG4gICAgaWYgKFwidG9rZW5cIiBpbiB1cGRhdGUpIHRoaXMuX3NlcnZlciA9IHVwZGF0ZTtcbiAgICBlbHNlIHRoaXMuX3N0YXRlID0gdXBkYXRlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgYSB2b2ljZSB1cGRhdGUgdG8gbGF2YWxpbmsuXG4gICAqIEBzaW5jZSAyLjEueFxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHB1YmxpYyBhc3luYyB2b2ljZVVwZGF0ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMuX3NlcnZlciB8fCAhdGhpcy5fc3RhdGUpIHJldHVybjtcblxuICAgIGF3YWl0IHRoaXMuc2VuZChcInZvaWNlVXBkYXRlXCIsIHtcbiAgICAgIHNlc3Npb25JZDogdGhpcy5fc3RhdGUuc2Vzc2lvbl9pZCxcbiAgICAgIGV2ZW50OiB0aGlzLl9zZXJ2ZXIsXG4gICAgfSwgdHJ1ZSk7XG5cbiAgICBkZWxldGUgdGhpcy5fc3RhdGU7XG4gICAgZGVsZXRlIHRoaXMuX3NlcnZlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIGRhdGEgdG8gbGF2YWxpbmsgYXMgdGhpcyBwbGF5ZXIuXG4gICAqIEBwYXJhbSBvcCBUaGUgb3BlcmF0aW9uLlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgZGF0YS5cbiAgICogQHBhcmFtIHByaW9yaXR5IFdoZXRoZXIgb3Igbm90IHRoaXMgaXMgYSBwcmlvcml0aXplZCBvcGVyYXRpb24uXG4gICAqIEBzaW5jZSAxLjAuMFxuICAgKi9cbiAgcHVibGljIGFzeW5jIHNlbmQob3A6IHN0cmluZywgZGF0YTogRGljdGlvbmFyeSA9IHt9LCBwcmlvcml0eSA9IGZhbHNlKTogUHJvbWlzZTx0aGlzPiB7XG4gICAgYXdhaXQgdGhpcy5zb2NrZXQuc2VuZCh7IG9wLCAuLi5kYXRhLCBndWlsZElkOiB0aGlzLmd1aWxkIH0sIHByaW9yaXR5KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBfZXZlbnQoZXZlbnQ6IEV2ZW50KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgc3dpdGNoIChldmVudC50eXBlKSB7XG4gICAgICBjYXNlIFwiVHJhY2tFbmRFdmVudFwiOlxuICAgICAgICBpZiAoZXZlbnQucmVhc29uICE9PSBcIlJFUExBQ0VEXCIpIHRoaXMucGxheWluZyA9IGZhbHNlO1xuICAgICAgICBkZWxldGUgdGhpcy50aW1lc3RhbXA7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnRyYWNrO1xuICAgICAgICB0aGlzLmVtaXQoXCJlbmRcIiwgZXZlbnQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJUcmFja0V4Y2VwdGlvbkV2ZW50XCI6XG4gICAgICAgIHRoaXMuZW1pdChcImVycm9yXCIsIGV2ZW50KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiVHJhY2tTdGFydEV2ZW50XCI6XG4gICAgICAgIHRoaXMucGxheWluZyA9IHRydWU7XG4gICAgICAgIHRoaXMudHJhY2sgPSBldmVudC50cmFjaztcbiAgICAgICAgdGhpcy5lbWl0KFwic3RhcnRcIiwgZXZlbnQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJUcmFja1N0dWNrRXZlbnRcIjpcbiAgICAgICAgYXdhaXQgdGhpcy5zdG9wKClcbiAgICAgICAgdGhpcy5lbWl0KFwic3R1Y2tcIiwgZXZlbnQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJXZWJTb2NrZXRDbG9zZWRFdmVudFwiOlxuICAgICAgICB0aGlzLmVtaXQoXCJjbG9zZWRcIiwgZXZlbnQpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgX3BsYXllclVwZGF0ZSh1cGRhdGU6IFBsYXllclVwZGF0ZSk6IHZvaWQge1xuICAgIGlmICghdXBkYXRlLnN0YXRlKSByZXR1cm47XG4gICAgdGhpcy5wb3NpdGlvbiA9IHVwZGF0ZS5zdGF0ZS5wb3NpdGlvbjtcbiAgICB0aGlzLnRpbWVzdGFtcCA9IHVwZGF0ZS5zdGF0ZS50aW1lO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGxheWVyIHtcbiAgLyoqXG4gICAqIFdoZW4gdGhlIHBsYXllciByZWNlaXZlcyBhbiB1cGRhdGUgZnJvbSBsYXZhbGluay5cbiAgICovXG4gIG9uKGV2ZW50OiBcInBsYXllclVwZGF0ZVwiLCBsaXN0ZW5lcjogKHVwZGF0ZTogUGxheWVyVXBkYXRlKSA9PiBhbnkpOiB0aGlzO1xuXG4gIC8qKlxuICAgKiBFbWl0dGVkIHdoZW4gdGhlIHBsYXllciByZWNlaXZlcyBhIHBsYXllciBldmVudC5cbiAgICovXG4gIG9uKGV2ZW50OiBcImV2ZW50XCIsIGxpc3RlbmVyOiAoZXZlbnQ6IEV2ZW50KSA9PiBhbnkpOiB0aGlzO1xuXG4gIC8qKlxuICAgKiBFbWl0dGVkIHdoZW4gdGhlIHdlYnNvY2tldCB3YXMgY2xvc2VkLlxuICAgKi9cbiAgb24oZXZlbnQ6IFwiY2xvc2VkXCIsIGxpc3RlbmVyOiAoZXZlbnQ6IFdlYlNvY2tldENsb3NlZEV2ZW50KSA9PiBhbnkpOiB0aGlzO1xuXG4gIC8qKlxuICAgKiBFbWl0dGVkIHdoZW4gYSB0cmFjayBzdG9wcy5cbiAgICovXG4gIG9uKGV2ZW50OiBcImVuZFwiLCBsaXN0ZW5lcjogKGV2ZW50OiBUcmFja0VuZEV2ZW50KSA9PiBhbnkpOiB0aGlzO1xuXG4gIC8qKlxuICAgKiBFbWl0dGVkIHdoZW4gdGhlIHBsYXllciBoYXMgcmFuIGludG8gYW4gZXhjZXB0aW9uLlxuICAgKi9cbiAgb24oZXZlbnQ6IFwiZXJyb3JcIiwgbGlzdGVuZXI6IChldmVudDogVHJhY2tFeGNlcHRpb25FdmVudCkgPT4gYW55KTogdGhpcztcblxuICAvKipcbiAgICogRW1pdHRlZCB3aGVuIGEgcGxheWVyIGhhcyBzdGFydGVkIGEgdHJhY2suXG4gICAqL1xuICBvbihldmVudDogXCJzdGFydFwiLCBsaXN0ZW5lcjogKGV2ZW50OiBUcmFja1N0YXJ0RXZlbnQpID0+IGFueSk6IHRoaXM7XG5cbiAgLyoqXG4gICAqIEVtaXR0ZWQgd2hlbiBhIHRyYWNrIGlzIHN0dWNrLlxuICAgKi9cbiAgb24oZXZlbnQ6IFwic3R1Y2tcIiwgbGlzdGVuZXI6IChldmVudDogVHJhY2tTdHVja0V2ZW50KSA9PiBhbnkpOiB0aGlzO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBsYXlPcHRpb25zIHtcbiAgLyoqXG4gICAqIFRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIG9mZnNldCB0aGUgdHJhY2sgYnkuXG4gICAqL1xuICBzdGFydFRpbWU/OiBudW1iZXI7XG4gIC8qKlxuICAgKiBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyBhdCB3aGljaCBwb2ludCB0aGUgdHJhY2sgc2hvdWxkIHN0b3AgcGxheWluZ1xuICAgKi9cbiAgZW5kVGltZT86IG51bWJlcjtcbiAgLyoqXG4gICAqIFRoaXMgb3BlcmF0aW9uIHdpbGwgYmUgaWdub3JlZCBpZiBhIHRyYWNrIGlzIGFscmVhZHkgcGxheWluZyBvciBwYXVzZWQuXG4gICAqL1xuICBub1JlcGxhY2U/OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbm5lY3RPcHRpb25zIHtcbiAgLyoqXG4gICAqIElmIHlvdSB3YW5uYSBzZWxmIGRlYWZlbiB0aGUgYm90LlxuICAgKi9cbiAgc2VsZkRlYWY/OiBib29sZWFuO1xuICAvKipcbiAgICogSWYgeW91IHdhbnQgdG8gc2VsZiBtdXRlIHRoZSBib3QuXG4gICAqL1xuICBzZWxmTXV0ZT86IGJvb2xlYW47XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsWUFBWSxTQUFRLDJDQUE2QzthQWdCN0QsTUFBTSxTQUFTLFlBQVk7SUFDdEMsRUFFRyxBQUZIOztHQUVHLEFBRkgsRUFFRyxDQUNhLEtBQUs7SUFFckIsRUFFRyxBQUZIOztHQUVHLEFBRkgsRUFFRyxDQUNJLE1BQU07SUFFYixFQUVHLEFBRkg7O0dBRUcsQUFGSCxFQUVH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