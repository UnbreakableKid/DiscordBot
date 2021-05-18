import { connectWebSocket, isWebSocketCloseEvent, isWebSocketPingEvent, isWebSocketPongEvent } from "https://deno.land/std@0.66.0/ws/mod.ts";
import { Buffer } from "https://deno.land/std@0.66.0/node/buffer.ts";
export var Status;
(function(Status) {
    Status[Status["CONNECTED"] = 0] = "CONNECTED";
    Status[Status["CONNECTING"] = 1] = "CONNECTING";
    Status[Status["IDLE"] = 2] = "IDLE";
    Status[Status["DISCONNECTED"] = 3] = "DISCONNECTED";
    Status[Status["RECONNECTING"] = 4] = "RECONNECTING";
})(Status || (Status = {
}));
export class Socket {
    /**
   * The manager instance.
   */ manager;
    /**
   * This lavalink nodes identifier.
   */ id;
    /**
   * Number of remaining reconnect tries.
   */ remainingTries;
    /**
   * The status of this lavalink node.
   */ status;
    /**
   * Hostname of the lavalink node.
   */ host;
    /**
   * Port of the lavalink node.
   */ port;
    /**
   * Password of the lavalink node.
   */ password;
    /**
   * The performance stats of this player.
   */ stats;
    /**
   * The resume key.
   */ resumeKey;
    /**
   * Whether or not this lavalink node uses an ssl.
   */ secure;
    /**
   * The timeout for reconnecting.
   */ reconnectTimeout;
    /**
   * WebSocket instance for this socket.
   */ ws;
    /**
   * Queue for outgoing messages.
   */ queue;
    /**
   * @param manager
   * @param data
   */ constructor(manager, data){
        this.manager = manager;
        this.id = data.id;
        this.host = data.host;
        this.port = data.port;
        this.secure = data.secure ?? false;
        Object.defineProperty(this, "password", {
            value: data.password ?? "youshallnotpass"
        });
        this.remainingTries = Number(manager.options.reconnect.maxTries ?? 5);
        this.status = Status.IDLE;
        this.queue = [];
        this.stats = {
            cpu: {
                cores: 0,
                lavalinkLoad: 0,
                systemLoad: 0
            },
            frameStats: {
                deficit: 0,
                nulled: 0,
                sent: 0
            },
            memory: {
                allocated: 0,
                free: 0,
                reservable: 0,
                used: 0
            },
            players: 0,
            playingPlayers: 0,
            uptime: 0
        };
    }
    // @ts-ignore
    /**
   *
   */ get reconnection() {
        return this.manager.options.reconnect;
    }
    /**
   * Whether or not this socket is connected.
   */ get connected() {
        return !!this.ws && !this.ws?.isClosed;
    }
    /**
   * The address of this lavalink node.
   */ get address() {
        return `${this.host}${this.port ? `:${this.port}` : ""}`;
    }
    /**
   * Get the total penalty count for this node.
   */ get penalties() {
        const cpu = Math.pow(1.05, 100 * this.stats.cpu.systemLoad) * 10 - 10;
        let deficit = 0, nulled = 0;
        if (this.stats.frameStats?.deficit != -1) {
            deficit = Math.pow(1.03, 500 * ((this.stats.frameStats?.deficit ?? 0) / 3000)) * 600 - 600;
            nulled = (Math.pow(1.03, 500 * ((this.stats.frameStats?.nulled ?? 0) / 3000)) * 600 - 600) * 2;
            nulled *= 2;
        }
        return cpu + deficit + nulled;
    }
    /**
   * Send a message to lavalink.
   * @param data The message data.
   * @param priority If this message should be prioritized.
   * @since 1.0.0
   */ async send(data, priority = false) {
        return new Promise((resolve, reject)=>{
            data = JSON.stringify(data);
            this.queue[priority ? "unshift" : "push"]({
                data: data,
                reject,
                resolve
            });
            if (this.connected) this._processQueue();
        });
    }
    /**
   * Connects to the lavalink node.
   * @since 1.0.0
   */ async connect() {
        if (this.status !== Status.RECONNECTING) this.status = Status.CONNECTING;
        if (this.connected) {
            this.ws?.close(1012);
            delete this.ws;
        }
        const headers = new Headers();
        headers.append("authorization", this.password);
        headers.append("num-shards", this.manager.options.shards.toString());
        headers.append("user-id", this.manager.userId);
        if (this.resumeKey) headers.append("resume-key", this.resumeKey);
        try {
            this.ws = await connectWebSocket(`ws${this.secure ? "s" : ""}://${this.address}`, headers);
            await this._open();
        } catch (e) {
            this.manager.emit("socketError", this, e);
        }
    }
    /**
   * Reconnect to the lavalink node.
   */ reconnect() {
        if (this.remainingTries !== 0) {
            this.remainingTries -= 1;
            this.status = Status.RECONNECTING;
            try {
                this.connect();
                clearTimeout(this.reconnectTimeout);
            } catch (e) {
                this.manager.emit("socketError", this, e);
                this.reconnectTimeout = setTimeout(()=>{
                    this.reconnect();
                }, this.reconnection.delay ?? 15000);
            }
        } else {
            this.status = Status.DISCONNECTED;
            this.manager.emit("socketDisconnect", this, "Ran out of reconnect tries.");
        }
    }
    /**
   * Configures lavalink resuming.
   * @since 1.0.0
   */ async configureResuming() {
        if (this.reconnection !== null) {
            this.resumeKey = this.manager.resuming.key ?? Math.random().toString(32);
            return this.send({
                op: "configureResuming",
                timeout: this.manager.resuming.timeout ?? 60000,
                key: this.resumeKey
            }, true);
        }
    }
    /**
   * Handles the opening of the websocket.
   * @private
   */ async _open() {
        await this._processQueue().then(()=>this.configureResuming()
        ).catch((e)=>this.manager.emit("socketError", this, e)
        );
        this.manager.emit("socketReady", this);
        this.status = Status.CONNECTED;
        for await (const data of this.ws){
            if (isWebSocketCloseEvent(data)) return this._close(data);
            if (isWebSocketPingEvent(data)) return;
            if (isWebSocketPongEvent(data)) return;
            await this._message(data);
        }
    }
    /**
   * Handles incoming messages from lavalink.
   * @since 1.0.0
   * @private
   */ async _message(data) {
        if (data instanceof ArrayBuffer) data = Buffer.from(data);
        else if (Array.isArray(data)) data = Buffer.concat(data);
        let pk;
        try {
            pk = JSON.parse(data.toString());
        } catch (e) {
            this.manager.emit("socketError", this, e);
            return;
        }
        const player = this.manager.players.get(pk.guildId);
        if (pk.guildId && player) await player.emit(pk.op, pk);
        else if (pk.op === "stats") this.stats = pk;
    }
    /**
   * Handles the close of the websocket.
   * @since 1.0.0
   * @private
   */ _close(event) {
        if (this.remainingTries === this.reconnection.maxTries) this.manager.emit("socketClose", event);
        if (event.code !== 1000 && event.reason !== "destroy") {
            if (this.reconnection.auto) this.reconnect();
        }
    }
    /**
   * @private
   */ async _processQueue() {
        if (this.queue.length === 0) return;
        while(this.queue.length > 0){
            const payload = this.queue.shift();
            if (!payload) return;
            await this._send(payload);
        }
    }
    /**
   * @private
   */ async _send(payload) {
        try {
            this.ws?.send?.(payload.data);
            payload.resolve(true, null);
        } catch (e) {
            this.manager.emit("socketError", this, e);
            payload.reject(false, e);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9sYXZhZGVuby9tYXN0ZXIvc3JjL2FwaS9Tb2NrZXQudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIGNvbm5lY3RXZWJTb2NrZXQsXG4gIGlzV2ViU29ja2V0Q2xvc2VFdmVudCxcbiAgaXNXZWJTb2NrZXRQaW5nRXZlbnQsXG4gIGlzV2ViU29ja2V0UG9uZ0V2ZW50LFxuICBXZWJTb2NrZXQsXG4gIFdlYlNvY2tldENsb3NlRXZlbnRcbn0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjY2LjAvd3MvbW9kLnRzXCI7XG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQDAuNjYuMC9ub2RlL2J1ZmZlci50c1wiO1xuXG5pbXBvcnQgdHlwZSB7IE1hbmFnZXIgfSBmcm9tIFwiLi4vTWFuYWdlci50c1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJlY29ubmVjdE9wdGlvbnMge1xuICAvKipcbiAgICogVGhlIHRvdGFsIGFtb3VudCBvZiByZWNvbm5lY3QgdHJpZXNcbiAgICovXG4gIG1heFRyaWVzPzogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCByZWNvbm5lY3Rpb24ncyBhcmUgYXV0b21hdGljYWxseSBkb25lLlxuICAgKi9cbiAgYXV0bz86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFRoZSBkZWxheSBiZXR3ZWVuIHNvY2tldCByZWNvbm5lY3Rpb24ncy5cbiAgICovXG4gIGRlbGF5PzogbnVtYmVyO1xufVxuXG5leHBvcnQgZW51bSBTdGF0dXMge1xuICBDT05ORUNURUQsXG4gIENPTk5FQ1RJTkcsXG4gIElETEUsXG4gIERJU0NPTk5FQ1RFRCxcbiAgUkVDT05ORUNUSU5HXG59XG5cbmV4cG9ydCBjbGFzcyBTb2NrZXQge1xuICAvKipcbiAgICogVGhlIG1hbmFnZXIgaW5zdGFuY2UuXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgbWFuYWdlcjogTWFuYWdlcjtcblxuICAvKipcbiAgICogVGhpcyBsYXZhbGluayBub2RlcyBpZGVudGlmaWVyLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGlkOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiByZW1haW5pbmcgcmVjb25uZWN0IHRyaWVzLlxuICAgKi9cbiAgcHVibGljIHJlbWFpbmluZ1RyaWVzOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBzdGF0dXMgb2YgdGhpcyBsYXZhbGluayBub2RlLlxuICAgKi9cbiAgcHVibGljIHN0YXR1czogU3RhdHVzO1xuXG4gIC8qKlxuICAgKiBIb3N0bmFtZSBvZiB0aGUgbGF2YWxpbmsgbm9kZS5cbiAgICovXG4gIHB1YmxpYyBob3N0OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFBvcnQgb2YgdGhlIGxhdmFsaW5rIG5vZGUuXG4gICAqL1xuICBwdWJsaWMgcG9ydD86IG51bWJlcjtcblxuICAvKipcbiAgICogUGFzc3dvcmQgb2YgdGhlIGxhdmFsaW5rIG5vZGUuXG4gICAqL1xuICBwdWJsaWMgcGFzc3dvcmQhOiBzdHJpbmdcblxuICAvKipcbiAgICogVGhlIHBlcmZvcm1hbmNlIHN0YXRzIG9mIHRoaXMgcGxheWVyLlxuICAgKi9cbiAgcHVibGljIHN0YXRzOiBOb2RlU3RhdHM7XG5cbiAgLyoqXG4gICAqIFRoZSByZXN1bWUga2V5LlxuICAgKi9cbiAgcHVibGljIHJlc3VtZUtleT86IHN0cmluZztcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhpcyBsYXZhbGluayBub2RlIHVzZXMgYW4gc3NsLlxuICAgKi9cbiAgcHVibGljIHNlY3VyZTogYm9vbGVhbjtcblxuICAvKipcbiAgICogVGhlIHRpbWVvdXQgZm9yIHJlY29ubmVjdGluZy5cbiAgICovXG4gIHByaXZhdGUgcmVjb25uZWN0VGltZW91dCE6IG51bWJlcjtcblxuICAvKipcbiAgICogV2ViU29ja2V0IGluc3RhbmNlIGZvciB0aGlzIHNvY2tldC5cbiAgICovXG4gIHByaXZhdGUgd3M/OiBXZWJTb2NrZXQ7XG5cbiAgLyoqXG4gICAqIFF1ZXVlIGZvciBvdXRnb2luZyBtZXNzYWdlcy5cbiAgICovXG4gIHByaXZhdGUgcmVhZG9ubHkgcXVldWU6IFBheWxvYWRbXTtcblxuICAvKipcbiAgICogQHBhcmFtIG1hbmFnZXJcbiAgICogQHBhcmFtIGRhdGFcbiAgICovXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihtYW5hZ2VyOiBNYW5hZ2VyLCBkYXRhOiBTb2NrZXREYXRhKSB7XG4gICAgdGhpcy5tYW5hZ2VyID0gbWFuYWdlcjtcbiAgICB0aGlzLmlkID0gZGF0YS5pZDtcblxuICAgIHRoaXMuaG9zdCA9IGRhdGEuaG9zdDtcbiAgICB0aGlzLnBvcnQgPSBkYXRhLnBvcnQ7XG4gICAgdGhpcy5zZWN1cmUgPSBkYXRhLnNlY3VyZSA/PyBmYWxzZTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJwYXNzd29yZFwiLCB7IHZhbHVlOiBkYXRhLnBhc3N3b3JkID8/IFwieW91c2hhbGxub3RwYXNzXCIgfSk7XG5cbiAgICB0aGlzLnJlbWFpbmluZ1RyaWVzID0gTnVtYmVyKG1hbmFnZXIub3B0aW9ucy5yZWNvbm5lY3QubWF4VHJpZXMgPz8gNSk7XG4gICAgdGhpcy5zdGF0dXMgPSBTdGF0dXMuSURMRTtcbiAgICB0aGlzLnF1ZXVlID0gW107XG4gICAgdGhpcy5zdGF0cyA9IHtcbiAgICAgIGNwdTogeyBjb3JlczogMCwgbGF2YWxpbmtMb2FkOiAwLCBzeXN0ZW1Mb2FkOiAwIH0sXG4gICAgICBmcmFtZVN0YXRzOiB7IGRlZmljaXQ6IDAsIG51bGxlZDogMCwgc2VudDogMCB9LFxuICAgICAgbWVtb3J5OiB7IGFsbG9jYXRlZDogMCwgZnJlZTogMCwgcmVzZXJ2YWJsZTogMCwgdXNlZDogMCB9LFxuICAgICAgcGxheWVyczogMCxcbiAgICAgIHBsYXlpbmdQbGF5ZXJzOiAwLFxuICAgICAgdXB0aW1lOiAwXG4gICAgfTtcbiAgfVxuXG4gIC8vIEB0cy1pZ25vcmVcbiAgLyoqXG4gICAqXG4gICAqL1xuICBwdWJsaWMgZ2V0IHJlY29ubmVjdGlvbigpOiBSZWNvbm5lY3RPcHRpb25zIHtcbiAgICByZXR1cm4gdGhpcy5tYW5hZ2VyLm9wdGlvbnMucmVjb25uZWN0O1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoaXMgc29ja2V0IGlzIGNvbm5lY3RlZC5cbiAgICovXG4gIHB1YmxpYyBnZXQgY29ubmVjdGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMud3MgJiYgIXRoaXMud3M/LmlzQ2xvc2VkO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBhZGRyZXNzIG9mIHRoaXMgbGF2YWxpbmsgbm9kZS5cbiAgICovXG4gIHB1YmxpYyBnZXQgYWRkcmVzcygpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHt0aGlzLmhvc3R9JHt0aGlzLnBvcnQgPyBgOiR7dGhpcy5wb3J0fWAgOiBcIlwifWA7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSB0b3RhbCBwZW5hbHR5IGNvdW50IGZvciB0aGlzIG5vZGUuXG4gICAqL1xuICBwdWJsaWMgZ2V0IHBlbmFsdGllcygpIHtcbiAgICBjb25zdCBjcHUgPSBNYXRoLnBvdygxLjA1LCAxMDAgKiB0aGlzLnN0YXRzLmNwdS5zeXN0ZW1Mb2FkKSAqIDEwIC0gMTA7XG5cbiAgICBsZXQgZGVmaWNpdCA9IDAsIG51bGxlZCA9IDA7XG4gICAgaWYgKHRoaXMuc3RhdHMuZnJhbWVTdGF0cz8uZGVmaWNpdCAhPSAtMSkge1xuICAgICAgZGVmaWNpdCA9IE1hdGgucG93KDEuMDMsIDUwMCAqICgodGhpcy5zdGF0cy5mcmFtZVN0YXRzPy5kZWZpY2l0ID8/IDApIC8gMzAwMCkpICogNjAwIC0gNjAwO1xuICAgICAgbnVsbGVkID0gKE1hdGgucG93KDEuMDMsIDUwMCAqICgodGhpcy5zdGF0cy5mcmFtZVN0YXRzPy5udWxsZWQgPz8gMCkgLyAzMDAwKSkgKiA2MDAgLSA2MDApICogMjtcbiAgICAgIG51bGxlZCAqPSAyO1xuICAgIH1cblxuICAgIHJldHVybiBjcHUgKyBkZWZpY2l0ICsgbnVsbGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgYSBtZXNzYWdlIHRvIGxhdmFsaW5rLlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgbWVzc2FnZSBkYXRhLlxuICAgKiBAcGFyYW0gcHJpb3JpdHkgSWYgdGhpcyBtZXNzYWdlIHNob3VsZCBiZSBwcmlvcml0aXplZC5cbiAgICogQHNpbmNlIDEuMC4wXG4gICAqL1xuICBwdWJsaWMgYXN5bmMgc2VuZChkYXRhOiB1bmtub3duLCBwcmlvcml0eSA9IGZhbHNlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGRhdGEgPSBKU09OLnN0cmluZ2lmeShkYXRhKTtcbiAgICAgIHRoaXMucXVldWVbcHJpb3JpdHkgPyBcInVuc2hpZnRcIiA6IFwicHVzaFwiXSh7IGRhdGE6IGRhdGEsIHJlamVjdCwgcmVzb2x2ZSB9KTtcbiAgICAgIGlmICh0aGlzLmNvbm5lY3RlZCkgdGhpcy5fcHJvY2Vzc1F1ZXVlKCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ29ubmVjdHMgdG8gdGhlIGxhdmFsaW5rIG5vZGUuXG4gICAqIEBzaW5jZSAxLjAuMFxuICAgKi9cbiAgcHVibGljIGFzeW5jIGNvbm5lY3QoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuc3RhdHVzICE9PSBTdGF0dXMuUkVDT05ORUNUSU5HKVxuICAgICAgdGhpcy5zdGF0dXMgPSBTdGF0dXMuQ09OTkVDVElORztcblxuICAgIGlmICh0aGlzLmNvbm5lY3RlZCkge1xuICAgICAgdGhpcy53cz8uY2xvc2UoMTAxMik7XG4gICAgICBkZWxldGUgdGhpcy53cztcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkZXJzID0gbmV3IEhlYWRlcnMoKTtcbiAgICBoZWFkZXJzLmFwcGVuZChcImF1dGhvcml6YXRpb25cIiwgdGhpcy5wYXNzd29yZCk7XG4gICAgaGVhZGVycy5hcHBlbmQoXCJudW0tc2hhcmRzXCIsIHRoaXMubWFuYWdlci5vcHRpb25zLnNoYXJkcy50b1N0cmluZygpKVxuICAgIGhlYWRlcnMuYXBwZW5kKFwidXNlci1pZFwiLCB0aGlzLm1hbmFnZXIudXNlcklkISk7XG4gICAgaWYgKHRoaXMucmVzdW1lS2V5KSBoZWFkZXJzLmFwcGVuZChcInJlc3VtZS1rZXlcIiwgdGhpcy5yZXN1bWVLZXkpXG5cbiAgICB0cnkge1xuICAgICAgdGhpcy53cyA9IGF3YWl0IGNvbm5lY3RXZWJTb2NrZXQoYHdzJHt0aGlzLnNlY3VyZSA/IFwic1wiIDogXCJcIn06Ly8ke3RoaXMuYWRkcmVzc31gLCBoZWFkZXJzKTtcbiAgICAgIGF3YWl0IHRoaXMuX29wZW4oKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aGlzLm1hbmFnZXIuZW1pdChcInNvY2tldEVycm9yXCIsIHRoaXMsIGUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZWNvbm5lY3QgdG8gdGhlIGxhdmFsaW5rIG5vZGUuXG4gICAqL1xuICBwdWJsaWMgcmVjb25uZWN0KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnJlbWFpbmluZ1RyaWVzICE9PSAwKSB7XG4gICAgICB0aGlzLnJlbWFpbmluZ1RyaWVzIC09IDE7XG4gICAgICB0aGlzLnN0YXR1cyA9IFN0YXR1cy5SRUNPTk5FQ1RJTkc7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMuY29ubmVjdCgpO1xuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5yZWNvbm5lY3RUaW1lb3V0KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgdGhpcy5tYW5hZ2VyLmVtaXQoXCJzb2NrZXRFcnJvclwiLCB0aGlzLCBlKTtcbiAgICAgICAgdGhpcy5yZWNvbm5lY3RUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgdGhpcy5yZWNvbm5lY3QoKTtcbiAgICAgICAgfSwgdGhpcy5yZWNvbm5lY3Rpb24uZGVsYXkgPz8gMTUwMDApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnN0YXR1cyA9IFN0YXR1cy5ESVNDT05ORUNURUQ7XG4gICAgICB0aGlzLm1hbmFnZXIuZW1pdChcInNvY2tldERpc2Nvbm5lY3RcIiwgdGhpcywgXCJSYW4gb3V0IG9mIHJlY29ubmVjdCB0cmllcy5cIik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZXMgbGF2YWxpbmsgcmVzdW1pbmcuXG4gICAqIEBzaW5jZSAxLjAuMFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBjb25maWd1cmVSZXN1bWluZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5yZWNvbm5lY3Rpb24gIT09IG51bGwpIHtcbiAgICAgIHRoaXMucmVzdW1lS2V5ID0gdGhpcy5tYW5hZ2VyLnJlc3VtaW5nLmtleSA/PyBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDMyKTtcblxuICAgICAgcmV0dXJuIHRoaXMuc2VuZCh7XG4gICAgICAgIG9wOiBcImNvbmZpZ3VyZVJlc3VtaW5nXCIsXG4gICAgICAgIHRpbWVvdXQ6IHRoaXMubWFuYWdlci5yZXN1bWluZy50aW1lb3V0ID8/IDYwMDAwLFxuICAgICAgICBrZXk6IHRoaXMucmVzdW1lS2V5XG4gICAgICB9LCB0cnVlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyB0aGUgb3BlbmluZyBvZiB0aGUgd2Vic29ja2V0LlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBfb3BlbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLl9wcm9jZXNzUXVldWUoKVxuICAgICAgLnRoZW4oKCkgPT4gdGhpcy5jb25maWd1cmVSZXN1bWluZygpKVxuICAgICAgLmNhdGNoKChlKSA9PiB0aGlzLm1hbmFnZXIuZW1pdChcInNvY2tldEVycm9yXCIsIHRoaXMsIGUpKTtcblxuICAgIHRoaXMubWFuYWdlci5lbWl0KFwic29ja2V0UmVhZHlcIiwgdGhpcyk7XG4gICAgdGhpcy5zdGF0dXMgPSBTdGF0dXMuQ09OTkVDVEVEO1xuXG4gICAgZm9yIGF3YWl0IChjb25zdCBkYXRhIG9mIHRoaXMud3MhKSB7XG4gICAgICBpZiAoaXNXZWJTb2NrZXRDbG9zZUV2ZW50KGRhdGEpKSByZXR1cm4gdGhpcy5fY2xvc2UoZGF0YSlcbiAgICAgIGlmIChpc1dlYlNvY2tldFBpbmdFdmVudChkYXRhKSkgcmV0dXJuO1xuICAgICAgaWYgKGlzV2ViU29ja2V0UG9uZ0V2ZW50KGRhdGEpKSByZXR1cm47XG4gICAgICBhd2FpdCB0aGlzLl9tZXNzYWdlKGRhdGEpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIGluY29taW5nIG1lc3NhZ2VzIGZyb20gbGF2YWxpbmsuXG4gICAqIEBzaW5jZSAxLjAuMFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBfbWVzc2FnZShkYXRhOiBVaW50OEFycmF5IHwgc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKGRhdGEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikgZGF0YSA9IEJ1ZmZlci5mcm9tKGRhdGEpO1xuICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZGF0YSkpIGRhdGEgPSBCdWZmZXIuY29uY2F0KGRhdGEpO1xuXG4gICAgbGV0IHBrOiBhbnk7XG4gICAgdHJ5IHtcbiAgICAgIHBrID0gSlNPTi5wYXJzZShkYXRhLnRvU3RyaW5nKCkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRoaXMubWFuYWdlci5lbWl0KFwic29ja2V0RXJyb3JcIiwgdGhpcywgZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcGxheWVyID0gdGhpcy5tYW5hZ2VyLnBsYXllcnMuZ2V0KHBrLmd1aWxkSWQgYXMgc3RyaW5nKTtcbiAgICBpZiAocGsuZ3VpbGRJZCAmJiBwbGF5ZXIpIGF3YWl0IHBsYXllci5lbWl0KHBrLm9wLCBwayk7XG4gICAgZWxzZSBpZiAocGsub3AgPT09IFwic3RhdHNcIikgdGhpcy5zdGF0cyA9IHBrO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgdGhlIGNsb3NlIG9mIHRoZSB3ZWJzb2NrZXQuXG4gICAqIEBzaW5jZSAxLjAuMFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfY2xvc2UoZXZlbnQ6IFdlYlNvY2tldENsb3NlRXZlbnQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5yZW1haW5pbmdUcmllcyA9PT0gdGhpcy5yZWNvbm5lY3Rpb24ubWF4VHJpZXMpXG4gICAgICB0aGlzLm1hbmFnZXIuZW1pdChcInNvY2tldENsb3NlXCIsIGV2ZW50KTtcblxuICAgIGlmIChldmVudC5jb2RlICE9PSAxMDAwICYmIGV2ZW50LnJlYXNvbiAhPT0gXCJkZXN0cm95XCIpIHtcbiAgICAgIGlmICh0aGlzLnJlY29ubmVjdGlvbi5hdXRvKSB0aGlzLnJlY29ubmVjdCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBfcHJvY2Vzc1F1ZXVlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLnF1ZXVlLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gICAgd2hpbGUgKHRoaXMucXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgcGF5bG9hZCA9IHRoaXMucXVldWUuc2hpZnQoKTtcbiAgICAgIGlmICghcGF5bG9hZCkgcmV0dXJuO1xuICAgICAgYXdhaXQgdGhpcy5fc2VuZChwYXlsb2FkKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgX3NlbmQocGF5bG9hZDogUGF5bG9hZCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLndzPy5zZW5kPy4ocGF5bG9hZC5kYXRhIGFzIHN0cmluZyk7XG4gICAgICBwYXlsb2FkLnJlc29sdmUodHJ1ZSwgbnVsbClcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aGlzLm1hbmFnZXIuZW1pdChcInNvY2tldEVycm9yXCIsIHRoaXMsIGUpXG4gICAgICBwYXlsb2FkLnJlamVjdChmYWxzZSwgZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogcHJpdmF0ZSBhc3luYyBfb25PcGVuKCkge1xuICAgIHRoaXMubWFuYWdlci5lbWl0KFwib3BlbmVkXCIsIHRoaXMuaWQpO1xuICAgIHRoaXMuZmx1c2goKVxuICAgICAgLnRoZW4oKCkgPT4gdGhpcy5jb25maWd1cmVSZXN1bWluZygpKVxuICAgICAgLmNhdGNoKChlKSA9PiB0aGlzLm1hbmFnZXIuZW1pdChcIm5vZGVFcnJvclwiLCBlLCB0aGlzLmlkKSk7XG5cbiAgICBmb3IgYXdhaXQgKGNvbnN0IHBhY2tldCBvZiB0aGlzLl93cyEpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGxldCBkYXRhOiBhbnkgPSBwYWNrZXQudG9TdHJpbmcoKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgIGRhdGEgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge31cblxuICAgICAgICBpZiAoaXNXZWJTb2NrZXRDbG9zZUV2ZW50KHBhY2tldCkpIHtcbiAgICAgICAgICBjb25zdCB7IGNvZGUsIHJlYXNvbiB9ID0gcGFja2V0O1xuICAgICAgICAgIHRoaXMubWFuYWdlci5lbWl0KFwibm9kZUNsb3NlZFwiLCB0aGlzLmlkLCBjb2RlLCByZWFzb24pO1xuICAgICAgICAgIHJldHVybiB0aGlzLnJlY29ubmVjdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGxheWVyID0gdGhpcy5tYW5hZ2VyLnBsYXllcnMuZ2V0KGRhdGEuZ3VpbGRJZCk7XG4gICAgICAgIGlmIChkYXRhLmd1aWxkSWQgJiYgcGxheWVyKSBwbGF5ZXIuZW1pdChkYXRhLm9wLCBkYXRhKTtcbiAgICAgICAgaWYgKGRhdGEub3AgPT09IFwic3RhdHNcIikgdGhpcy5zdGF0cyA9IGRhdGE7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICB0aGlzLm1hbmFnZXIuZW1pdChcIm5vZGVFcnJvclwiLCBlcnJvcik7XG4gICAgICAgIHRoaXMucmVjb25uZWN0KCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBTb2NrZXREYXRhIHtcbiAgLyoqXG4gICAqIFRoZSBJRCBvZiB0aGlzIGxhdmFsaW5rIG5vZGUuXG4gICAqL1xuICBpZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgaG9zdCBvZiB0aGlzIGxhdmFsaW5rIG5vZGUuXG4gICAqL1xuICBob3N0OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoaXMgbm9kZSBpcyBzZWN1cmVkIHZpYSBzc2wuXG4gICAqL1xuICBzZWN1cmU/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBUaGUgcG9ydCBvZiB0aGlzIGxhdmFsaW5rIG5vZGUuXG4gICAqL1xuICBwb3J0PzogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgcGFzc3dvcmQgb2YgdGhpcyBsYXZhbGluayBub2RlLlxuICAgKi9cbiAgcGFzc3dvcmQ/OiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQYXlsb2FkIHtcbiAgcmVzb2x2ZTogKC4uLmFyZ3M6IGFueVtdKSA9PiB1bmtub3duO1xuICByZWplY3Q6ICguLi5hcmdzOiB1bmtub3duW10pID0+IHVua25vd247XG4gIGRhdGE6IHVua25vd247XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTm9kZVN0YXRzIHtcbiAgcGxheWVyczogbnVtYmVyO1xuICBwbGF5aW5nUGxheWVyczogbnVtYmVyO1xuICB1cHRpbWU6IG51bWJlcjtcbiAgbWVtb3J5OiB7XG4gICAgZnJlZTogbnVtYmVyO1xuICAgIHVzZWQ6IG51bWJlcjtcbiAgICBhbGxvY2F0ZWQ6IG51bWJlcjtcbiAgICByZXNlcnZhYmxlOiBudW1iZXI7XG4gIH07XG4gIGNwdToge1xuICAgIGNvcmVzOiBudW1iZXI7XG4gICAgc3lzdGVtTG9hZDogbnVtYmVyO1xuICAgIGxhdmFsaW5rTG9hZDogbnVtYmVyO1xuICB9O1xuICBmcmFtZVN0YXRzPzoge1xuICAgIHNlbnQ/OiBudW1iZXI7XG4gICAgbnVsbGVkPzogbnVtYmVyO1xuICAgIGRlZmljaXQ/OiBudW1iZXI7XG4gIH07XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQ0UsZ0JBQWdCLEVBQ2hCLHFCQUFxQixFQUNyQixvQkFBb0IsRUFDcEIsb0JBQW9CLFNBR2Ysc0NBQXdDO1NBQ3RDLE1BQU0sU0FBUSwyQ0FBNkM7O1VBcUJ4RCxNQUFNO0lBQU4sTUFBTSxDQUFOLE1BQU0sRUFDaEIsU0FBUyxLQUFULENBQVMsS0FBVCxTQUFTO0lBREMsTUFBTSxDQUFOLE1BQU0sRUFFaEIsVUFBVSxLQUFWLENBQVUsS0FBVixVQUFVO0lBRkEsTUFBTSxDQUFOLE1BQU0sRUFHaEIsSUFBSSxLQUFKLENBQUksS0FBSixJQUFJO0lBSE0sTUFBTSxDQUFOLE1BQU0sRUFJaEIsWUFBWSxLQUFaLENBQVksS0FBWixZQUFZO0lBSkYsTUFBTSxDQUFOLE1BQU0sRUFLaEIsWUFBWSxLQUFaLENBQVksS0FBWixZQUFZO0dBTEYsTUFBTSxLQUFOLE1BQU07O2FBUUwsTUFBTTtJQUNqQixFQUVHLEFBRkg7O0dBRUcsQUFGSCxFQUVHLENBQ2EsT0FBTztJQUV2QixFQUVHLEFBRkg7O0dBRUcsQUFGSCxFQUVHLENBQ2EsRUFBRTtJQUVsQixFQUVHLEFBRkg7O0dBRUcsQUFGSCxFQUVHLENBQ0ksY0FBYztJQUVyQixFQUVHLEFBRkg7O0dBRUcsQUFGSCxFQUVHLENBQ0ksTUFBTTtJQUViLEVBRUcsQUFGSDs7R0FFRyxBQUZILEVBRUcsQ0FDSSxJQUFJO0lBRVgsRUFFRyxBQUZIOztHQUVHLEFBRkgsRUFFRyxDQUNJLElBQUk7SUFFWCxFQUVHLEFBRkg7O0dBRUcs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