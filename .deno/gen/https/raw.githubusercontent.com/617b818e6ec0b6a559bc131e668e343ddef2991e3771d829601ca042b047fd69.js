import { EventEmitter } from "https://deno.land/std@0.66.0/node/events.ts";
import { Socket } from "./api/Socket.ts";
import { Player } from "./api/Player.ts";
const defaults = {
    resuming: {
        key: Math.random().toString(32),
        timeout: 60000
    },
    reconnect: {
        auto: true,
        delay: 15000,
        maxTries: 5
    },
    shards: 1
};
export class Manager extends EventEmitter {
    /**
   * A map of connected sockets.
   */ sockets;
    /**
   * A map of connected players.
   */ players;
    /**
   * The options this manager was created with.
   */ options;
    /**
   * The client's user id.
   */ userId;
    /**
   * A send method for sending voice state updates to discord.
   */ send;
    /**
   * Resume options.
   */ resuming;
    /**
   * The array of socket data this manager was created with.
   */ nodes;
    /**
   * @param nodes An array of sockets to connect to.
   * @param options
   */ constructor(nodes, options){
        super();
        options = Object.assign(defaults, options);
        this.sockets = new Map();
        this.players = new Map();
        this.nodes = nodes;
        this.options = options;
        this.userId = options.userId;
        this.send = options.send;
        this.resuming = typeof options.resuming === "boolean" ? !options.resuming ? null : defaults.resuming : options.resuming ?? defaults.resuming;
        if (!options.send || typeof options.send !== "function") throw new TypeError("Please provide a send function for sending packets to discord.");
        if (this.options.shards < 1) throw new TypeError("Shard count must be 1 or greater.");
    }
    /**
   * Ideal nodes to use.
   */ get ideal() {
        return [
            ...this.sockets.values()
        ].sort((a, b)=>a.penalties - b.penalties
        );
    }
    /**
   * Initializes this manager. Connects all provided sockets.
   * @param userId The client user id.
   * @since 1.0.0
   */ init(userId = this.userId) {
        if (!userId) throw new Error("Provide a client id for lavalink to use.");
        else this.userId = userId;
        for (const s of this.nodes){
            if (!this.sockets.has(s.id)) {
                const socket = new Socket(this, s);
                try {
                    socket.connect();
                    this.sockets.set(s.id, socket);
                } catch (e) {
                    this.emit("socketError", socket, e);
                }
            }
        }
    }
    /**
   * Used for providing voice server updates to lavalink.
   * @param update The voice server update sent by Discord.
   * @since 1.0.0
   */ async serverUpdate(update) {
        const player = this.players.get(update.guild_id);
        if (player) {
            player.provide(update);
            await player.voiceUpdate();
        }
        return;
    }
    /**
   * Used for providing voice state updates to lavalink
   * @param update The voice state update sent by Discord.
   * @since 1.0.0
   */ async stateUpdate(update) {
        const player = this.players.get(update.guild_id ?? "");
        if (player && update.user_id === this.userId) {
            if (update.channel_id !== player.channel) {
                player.emit("move", update.channel_id);
                player.channel = update.channel_id;
            }
            player.provide(update);
            await player.voiceUpdate();
        }
    }
    /**
   * Create a player.
   * @param guild The guild this player is for.
   * @since 2.1.0
   */ create(guild) {
        const id = typeof guild === "string" ? guild : guild.id;
        const existing = this.players.get(id);
        if (existing) return existing;
        const sock = this.ideal[0];
        if (!sock) throw new Error("Manager#create(): No available nodes.");
        const player = new Player(sock, id);
        this.players.set(id, player);
        return player;
    }
    /**
   * Destroys a player and leaves the connected voice channel.
   * @param guild The guild id of the player to destroy.
   * @since 2.1.0
   */ async destroy(guild) {
        const id = typeof guild === "string" ? guild : guild.id;
        const player = this.players.get(id);
        if (player) {
            await player.destroy(true);
            return this.players.delete(id);
        } else return false;
    }
    /**
   * Search lavalink for songs.
   * @param query The search query.
   */ async search(query) {
        const socket = this.ideal[0];
        if (!socket) throw new Error("Manager#create(): No available sockets.");
        const resp = await fetch(`http${socket.secure ? "s" : ""}://${socket.address}/loadtracks?identifier=${encodeURIComponent(query ?? '')}`, {
            headers: {
                Authorization: socket.password ?? 'youshallnotpass'
            },
            method: 'GET'
        });
        const data = await resp.json();
        return data;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9sYXZhZGVuby9tYXN0ZXIvc3JjL01hbmFnZXIudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC42Ni4wL25vZGUvZXZlbnRzLnRzXCI7XG5pbXBvcnQgeyBXZWJTb2NrZXRDbG9zZUV2ZW50IH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjY2LjAvd3MvbW9kLnRzXCI7XG5pbXBvcnQgeyBTb2NrZXQsIFNvY2tldERhdGEgfSBmcm9tIFwiLi9hcGkvU29ja2V0LnRzXCI7XG5pbXBvcnQgeyBQbGF5ZXIgfSBmcm9tIFwiLi9hcGkvUGxheWVyLnRzXCI7XG5cbmltcG9ydCB0eXBlIHsgTG9hZFRyYWNrc1Jlc3BvbnNlIH0gZnJvbSBcIi4vQHR5cGVzL3RyYWNrLmQudHNcIjtcblxuY29uc3QgZGVmYXVsdHMgPSB7XG4gIHJlc3VtaW5nOiB7IGtleTogTWF0aC5yYW5kb20oKS50b1N0cmluZygzMiksIHRpbWVvdXQ6IDYwMDAwIH0sXG4gIHJlY29ubmVjdDogeyBhdXRvOiB0cnVlLCBkZWxheTogMTUwMDAsIG1heFRyaWVzOiA1IH0sXG4gIHNoYXJkczogMSxcbn0gYXMgTWFuYWdlck9wdGlvbnNcblxuXG5kZWNsYXJlIGdsb2JhbCB7XG4gIHR5cGUgRGljdGlvbmFyeTxUID0gYW55PiA9IFJlY29yZDxzdHJpbmcsIFQ+XG59XG5cbmV4cG9ydCBjbGFzcyBNYW5hZ2VyIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgLyoqXG4gICAqIEEgbWFwIG9mIGNvbm5lY3RlZCBzb2NrZXRzLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IHNvY2tldHM6IE1hcDxzdHJpbmcsIFNvY2tldD47XG5cbiAgLyoqXG4gICAqIEEgbWFwIG9mIGNvbm5lY3RlZCBwbGF5ZXJzLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IHBsYXllcnM6IE1hcDxzdHJpbmcsIFBsYXllcj47XG5cbiAgLyoqXG4gICAqIFRoZSBvcHRpb25zIHRoaXMgbWFuYWdlciB3YXMgY3JlYXRlZCB3aXRoLlxuICAgKi9cbiAgcHVibGljIG9wdGlvbnM6IFJlcXVpcmVkPE1hbmFnZXJPcHRpb25zPjtcblxuICAvKipcbiAgICogVGhlIGNsaWVudCdzIHVzZXIgaWQuXG4gICAqL1xuICBwdWJsaWMgdXNlcklkOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIEEgc2VuZCBtZXRob2QgZm9yIHNlbmRpbmcgdm9pY2Ugc3RhdGUgdXBkYXRlcyB0byBkaXNjb3JkLlxuICAgKi9cbiAgcHVibGljIHNlbmQ6IFNlbmQ7XG5cbiAgLyoqXG4gICAqIFJlc3VtZSBvcHRpb25zLlxuICAgKi9cbiAgcHVibGljIHJlc3VtaW5nOiBSZXN1bWVPcHRpb25zO1xuXG4gIC8qKlxuICAgKiBUaGUgYXJyYXkgb2Ygc29ja2V0IGRhdGEgdGhpcyBtYW5hZ2VyIHdhcyBjcmVhdGVkIHdpdGguXG4gICAqL1xuICBwcml2YXRlIHJlYWRvbmx5IG5vZGVzOiBTb2NrZXREYXRhW107XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBub2RlcyBBbiBhcnJheSBvZiBzb2NrZXRzIHRvIGNvbm5lY3QgdG8uXG4gICAqIEBwYXJhbSBvcHRpb25zXG4gICAqL1xuICBwdWJsaWMgY29uc3RydWN0b3Iobm9kZXM6IFNvY2tldERhdGFbXSwgb3B0aW9uczogTWFuYWdlck9wdGlvbnMpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oZGVmYXVsdHMsIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5zb2NrZXRzID0gbmV3IE1hcCgpO1xuICAgIHRoaXMucGxheWVycyA9IG5ldyBNYXAoKTtcbiAgICB0aGlzLm5vZGVzID0gbm9kZXM7XG5cbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIGFzIFJlcXVpcmVkPE1hbmFnZXJPcHRpb25zPjtcbiAgICB0aGlzLnVzZXJJZCA9IG9wdGlvbnMudXNlcklkO1xuICAgIHRoaXMuc2VuZCA9IG9wdGlvbnMuc2VuZDtcbiAgICB0aGlzLnJlc3VtaW5nID0gKHR5cGVvZiBvcHRpb25zLnJlc3VtaW5nID09PSBcImJvb2xlYW5cIlxuICAgICAgPyAhb3B0aW9ucy5yZXN1bWluZyA/IG51bGwgOiBkZWZhdWx0cy5yZXN1bWluZ1xuICAgICAgOiBvcHRpb25zLnJlc3VtaW5nID8/IGRlZmF1bHRzLnJlc3VtaW5nKSBhcyBSZXN1bWVPcHRpb25zO1xuXG4gICAgaWYgKCFvcHRpb25zLnNlbmQgfHwgdHlwZW9mIG9wdGlvbnMuc2VuZCAhPT0gXCJmdW5jdGlvblwiKVxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlBsZWFzZSBwcm92aWRlIGEgc2VuZCBmdW5jdGlvbiBmb3Igc2VuZGluZyBwYWNrZXRzIHRvIGRpc2NvcmQuXCIpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5zaGFyZHMhIDwgMSlcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJTaGFyZCBjb3VudCBtdXN0IGJlIDEgb3IgZ3JlYXRlci5cIik7XG4gIH1cblxuICAvKipcbiAgICogSWRlYWwgbm9kZXMgdG8gdXNlLlxuICAgKi9cbiAgcHVibGljIGdldCBpZGVhbCgpOiBTb2NrZXRbXSB7XG4gICAgcmV0dXJuIFsgLi4udGhpcy5zb2NrZXRzLnZhbHVlcygpIF0uc29ydCgoYSwgYikgPT4gYS5wZW5hbHRpZXMgLSBiLnBlbmFsdGllcyk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhpcyBtYW5hZ2VyLiBDb25uZWN0cyBhbGwgcHJvdmlkZWQgc29ja2V0cy5cbiAgICogQHBhcmFtIHVzZXJJZCBUaGUgY2xpZW50IHVzZXIgaWQuXG4gICAqIEBzaW5jZSAxLjAuMFxuICAgKi9cbiAgcHVibGljIGluaXQodXNlcklkOiBzdHJpbmcgPSB0aGlzLnVzZXJJZCEpOiB2b2lkIHtcbiAgICBpZiAoIXVzZXJJZCkgdGhyb3cgbmV3IEVycm9yKFwiUHJvdmlkZSBhIGNsaWVudCBpZCBmb3IgbGF2YWxpbmsgdG8gdXNlLlwiKTtcbiAgICBlbHNlIHRoaXMudXNlcklkID0gdXNlcklkO1xuXG4gICAgZm9yIChjb25zdCBzIG9mIHRoaXMubm9kZXMpIHtcbiAgICAgIGlmICghdGhpcy5zb2NrZXRzLmhhcyhzLmlkKSkge1xuICAgICAgICBjb25zdCBzb2NrZXQgPSBuZXcgU29ja2V0KHRoaXMsIHMpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgc29ja2V0LmNvbm5lY3QoKTtcbiAgICAgICAgICB0aGlzLnNvY2tldHMuc2V0KHMuaWQsIHNvY2tldCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICB0aGlzLmVtaXQoXCJzb2NrZXRFcnJvclwiLCBzb2NrZXQsIGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVzZWQgZm9yIHByb3ZpZGluZyB2b2ljZSBzZXJ2ZXIgdXBkYXRlcyB0byBsYXZhbGluay5cbiAgICogQHBhcmFtIHVwZGF0ZSBUaGUgdm9pY2Ugc2VydmVyIHVwZGF0ZSBzZW50IGJ5IERpc2NvcmQuXG4gICAqIEBzaW5jZSAxLjAuMFxuICAgKi9cbiAgcHVibGljIGFzeW5jIHNlcnZlclVwZGF0ZSh1cGRhdGU6IFZvaWNlU2VydmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgcGxheWVyID0gdGhpcy5wbGF5ZXJzLmdldCh1cGRhdGUuZ3VpbGRfaWQpO1xuICAgIGlmIChwbGF5ZXIpIHtcbiAgICAgIHBsYXllci5wcm92aWRlKHVwZGF0ZSk7XG4gICAgICBhd2FpdCBwbGF5ZXIudm9pY2VVcGRhdGUoKVxuICAgIH1cblxuICAgIHJldHVybjtcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2VkIGZvciBwcm92aWRpbmcgdm9pY2Ugc3RhdGUgdXBkYXRlcyB0byBsYXZhbGlua1xuICAgKiBAcGFyYW0gdXBkYXRlIFRoZSB2b2ljZSBzdGF0ZSB1cGRhdGUgc2VudCBieSBEaXNjb3JkLlxuICAgKiBAc2luY2UgMS4wLjBcbiAgICovXG4gIHB1YmxpYyBhc3luYyBzdGF0ZVVwZGF0ZSh1cGRhdGU6IFZvaWNlU3RhdGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBwbGF5ZXIgPSB0aGlzLnBsYXllcnMuZ2V0KHVwZGF0ZS5ndWlsZF9pZCA/PyBcIlwiKTtcbiAgICBpZiAocGxheWVyICYmIHVwZGF0ZS51c2VyX2lkID09PSB0aGlzLnVzZXJJZCkge1xuICAgICAgaWYgKHVwZGF0ZS5jaGFubmVsX2lkICE9PSBwbGF5ZXIuY2hhbm5lbCkge1xuICAgICAgICBwbGF5ZXIuZW1pdChcIm1vdmVcIiwgdXBkYXRlLmNoYW5uZWxfaWQpO1xuICAgICAgICBwbGF5ZXIuY2hhbm5lbCA9IHVwZGF0ZS5jaGFubmVsX2lkITtcbiAgICAgIH1cblxuICAgICAgcGxheWVyLnByb3ZpZGUodXBkYXRlKTtcbiAgICAgIGF3YWl0IHBsYXllci52b2ljZVVwZGF0ZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBwbGF5ZXIuXG4gICAqIEBwYXJhbSBndWlsZCBUaGUgZ3VpbGQgdGhpcyBwbGF5ZXIgaXMgZm9yLlxuICAgKiBAc2luY2UgMi4xLjBcbiAgICovXG4gIHB1YmxpYyBjcmVhdGUoZ3VpbGQ6IHN0cmluZyB8IERpY3Rpb25hcnkpOiBQbGF5ZXIge1xuICAgIGNvbnN0IGlkID0gdHlwZW9mIGd1aWxkID09PSBcInN0cmluZ1wiID8gZ3VpbGQgOiBndWlsZC5pZDtcblxuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5wbGF5ZXJzLmdldChpZCk7XG4gICAgaWYgKGV4aXN0aW5nKSByZXR1cm4gZXhpc3Rpbmc7XG5cbiAgICBjb25zdCBzb2NrID0gdGhpcy5pZGVhbFswXTtcbiAgICBpZiAoIXNvY2spXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNYW5hZ2VyI2NyZWF0ZSgpOiBObyBhdmFpbGFibGUgbm9kZXMuXCIpO1xuXG4gICAgY29uc3QgcGxheWVyID0gbmV3IFBsYXllcihzb2NrLCBpZCk7XG4gICAgdGhpcy5wbGF5ZXJzLnNldChpZCwgcGxheWVyKTtcblxuICAgIHJldHVybiBwbGF5ZXI7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgYSBwbGF5ZXIgYW5kIGxlYXZlcyB0aGUgY29ubmVjdGVkIHZvaWNlIGNoYW5uZWwuXG4gICAqIEBwYXJhbSBndWlsZCBUaGUgZ3VpbGQgaWQgb2YgdGhlIHBsYXllciB0byBkZXN0cm95LlxuICAgKiBAc2luY2UgMi4xLjBcbiAgICovXG4gIHB1YmxpYyBhc3luYyBkZXN0cm95KGd1aWxkOiBzdHJpbmcgfCBEaWN0aW9uYXJ5KTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgaWQgPSB0eXBlb2YgZ3VpbGQgPT09IFwic3RyaW5nXCIgPyBndWlsZCA6IGd1aWxkLmlkO1xuICAgIGNvbnN0IHBsYXllciA9IHRoaXMucGxheWVycy5nZXQoaWQpO1xuXG4gICAgaWYgKHBsYXllcikge1xuICAgICAgYXdhaXQgcGxheWVyLmRlc3Ryb3kodHJ1ZSk7XG4gICAgICByZXR1cm4gdGhpcy5wbGF5ZXJzLmRlbGV0ZShpZCk7XG4gICAgfSBlbHNlIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWFyY2ggbGF2YWxpbmsgZm9yIHNvbmdzLlxuICAgKiBAcGFyYW0gcXVlcnkgVGhlIHNlYXJjaCBxdWVyeS5cbiAgICovXG4gIHB1YmxpYyBhc3luYyBzZWFyY2gocXVlcnk6IHN0cmluZyk6IFByb21pc2U8TG9hZFRyYWNrc1Jlc3BvbnNlPiB7XG4gICAgY29uc3Qgc29ja2V0ID0gdGhpcy5pZGVhbFswXTtcbiAgICBpZiAoIXNvY2tldClcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk1hbmFnZXIjY3JlYXRlKCk6IE5vIGF2YWlsYWJsZSBzb2NrZXRzLlwiKVxuICAgICAgICAgICAgICAgIFxuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBmZXRjaChgaHR0cCR7c29ja2V0LnNlY3VyZSA/IFwic1wiIDogXCJcIn06Ly8ke3NvY2tldC5hZGRyZXNzfS9sb2FkdHJhY2tzP2lkZW50aWZpZXI9JHtlbmNvZGVVUklDb21wb25lbnQocXVlcnkgPz8gJycpfWAsIHtcbiAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogc29ja2V0LnBhc3N3b3JkID8/ICd5b3VzaGFsbG5vdHBhc3MnIH0sXG4gICAgICBtZXRob2Q6ICdHRVQnLFxuICAgIH0pO1xuICAgIFxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwLmpzb24oKTtcbiAgICByZXR1cm4gZGF0YTtcbiAgfVxufVxuXG5leHBvcnQgdHlwZSBTZW5kID0gKGd1aWxkSWQ6IHN0cmluZywgcGF5bG9hZDogYW55KSA9PiBhbnk7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWFuYWdlciB7XG4gIC8qKlxuICAgKiBFbWl0dGVkIHdoZW4gYSBsYXZhbGluayBzb2NrZXQgaXMgcmVhZHkuXG4gICAqL1xuICBvbihldmVudDogXCJzb2NrZXRSZWFkeVwiLCBsaXN0ZW5lcjogKHNvY2tldDogU29ja2V0KSA9PiBhbnkpOiB0aGlzO1xuXG4gIC8qKlxuICAgKiBFbWl0dGVkIHdoZW4gYSBsYXZhbGluayBzb2NrZXQgaGFzIHJhbiBpbnRvIGFuIGVycm9yLlxuICAgKi9cbiAgb24oZXZlbnQ6IFwic29ja2V0RXJyb3JcIiwgbGlzdGVuZXI6IChzb2NrZXQ6IFNvY2tldCwgZXJyb3I6IGFueSkgPT4gYW55KTogdGhpcztcblxuICAvKipcbiAgICogRW1pdHRlZCB3aGVuIGEgbGF2YWxpbmsgc29ja2V0IGhhcyBiZWVuIGNsb3NlZC5cbiAgICovXG4gIG9uKGV2ZW50OiBcInNvY2tldENsb3NlXCIsIGxpc3RlbmVyOiAoc29ja2V0OiBTb2NrZXQsIGV2ZW50OiBXZWJTb2NrZXRDbG9zZUV2ZW50KSA9PiBhbnkpOiB0aGlzO1xuXG4gIC8qKlxuICAgKiBFbWl0dGVkIHdoZW4gYSBsYXZhbGluayBzb2NrZXQgaGFzIHJhbiBvdXQgb2YgcmVjb25uZWN0IHRyaWVzLlxuICAgKi9cbiAgb24oZXZlbnQ6IFwic29ja2V0RGlzY29ubmVjdFwiLCBsaXN0ZW5lcjogKHNvY2tldDogU29ja2V0KSA9PiBhbnkpOiB0aGlzO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1hbmFnZXJPcHRpb25zIHtcbiAgLyoqXG4gICAqIEEgbWV0aG9kIHVzZWQgZm9yIHNlbmRpbmcgZGlzY29yZCB2b2ljZSB1cGRhdGVzLlxuICAgKi9cbiAgc2VuZDogU2VuZDtcblxuICAvKipcbiAgICogVGhlIG51bWJlciBvZiBzaGFyZHMgdGhlIGNsaWVudCBoYXMuXG4gICAqL1xuICBzaGFyZHM/OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSB1c2VyIGlkIG9mIHRoZSBib3QgKG5vdC1yZWNvbW1lbmRlZCwgcHJvdmlkZSBpdCBpbiBNYW5hZ2VyI2luaXQpXG4gICAqL1xuICB1c2VySWQ/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIElmIHlvdSB3YW50IHRvIGVuYWJsZSByZXN1bWluZy5cbiAgICovXG4gIHJlc3VtaW5nPzogUmVzdW1lT3B0aW9ucyB8IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIE9wdGlvbnMgZm9yIHJlY29ubmVjdGlvbi5cbiAgICovXG4gIHJlY29ubmVjdD86IFJlY29ubmVjdE9wdGlvbnM7XG59XG5cbmludGVyZmFjZSBSZWNvbm5lY3RPcHRpb25zIHtcbiAgLyoqXG4gICAqIFRoZSB0b3RhbCBhbW91bnQgb2YgcmVjb25uZWN0IHRyaWVzXG4gICAqL1xuICBtYXhUcmllcz86IG51bWJlcjtcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgcmVjb25uZWN0aW9uJ3MgYXJlIGF1dG9tYXRpY2FsbHkgZG9uZS5cbiAgICovXG4gIGF1dG8/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBUaGUgZGVsYXkgYmV0d2VlbiBzb2NrZXQgcmVjb25uZWN0aW9uJ3MuXG4gICAqL1xuICBkZWxheT86IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZXN1bWVPcHRpb25zIHtcbiAgLyoqXG4gICAqIFRoZSByZXN1bWUgdGltZW91dC5cbiAgICovXG4gIHRpbWVvdXQ/OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSByZXN1bWUga2V5IHRvIHVzZS4gSWYgb21pdHRlZCBhIHJhbmRvbSBvbmUgd2lsbCBiZSBhc3NpZ25lZC5cbiAgICovXG4gIGtleT86IHN0cmluZztcbn1cblxuLyoqIEBpbnRlcm5hbCBodHRwczovL2Rpc2NvcmQuY29tL2RldmVsb3BlcnMvZG9jcy90b3BpY3MvZ2F0ZXdheSN2b2ljZS1zZXJ2ZXItdXBkYXRlICovXG5leHBvcnQgaW50ZXJmYWNlIFZvaWNlU2VydmVyIHtcbiAgLyoqIFZvaWNlIGNvbm5lY3Rpb24gdG9rZW4gKi9cbiAgdG9rZW46IHN0cmluZztcbiAgLyoqIFRoZSBndWlsZCB0aGlzIHZvaWNlIHNlcnZlciB1cGRhdGUgaXMgZm9yICovXG4gIGd1aWxkX2lkOiBzdHJpbmc7XG4gIC8qKiBUaGUgdm9pY2Ugc2VydmVyIGhvc3QgKi9cbiAgZW5kcG9pbnQ6IHN0cmluZztcbn1cblxuLyoqIEBpbnRlcm5hbCBodHRwczovL2Rpc2NvcmQuY29tL2RldmVsb3BlcnMvZG9jcy9yZXNvdXJjZXMvdm9pY2Ujdm9pY2Utc3RhdGUtb2JqZWN0ICovXG5leHBvcnQgaW50ZXJmYWNlIFZvaWNlU3RhdGUge1xuICAvKiogVGhlIGd1aWxkIGlkIHRoaXMgdm9pY2Ugc3RhdGUgaXMgZm9yICovXG4gIGd1aWxkX2lkPzogc3RyaW5nO1xuICAvKiogVGhlIGNoYW5uZWwgaWQgdGhpcyB1c2VyIGlzIGNvbm5lY3RlZCB0byAqL1xuICBjaGFubmVsX2lkOiBzdHJpbmcgfCBudWxsO1xuICAvKiogVGhlIHVzZXIgaWQgdGhpcyB2b2ljZSBzdGF0ZSBpcyBmb3IgKi9cbiAgdXNlcl9pZDogc3RyaW5nO1xuICAvKiogVGhlIGd1aWxkIG1lbWJlciB0aGlzIHZvaWNlIHN0YXRlIGlzIGZvciAqL1xuICAvLyBUT0RPOiBhZGQgR3VpbGRNZW1iZXIgcGF5bG9hZCB0eXBlc1xuICBtZW1iZXI/OiBhbnk7XG4gIC8qKiBUaGUgc2Vzc2lvbiBpZCBmb3IgdGhpcyB2b2ljZSBzdGF0ZSAqL1xuICBzZXNzaW9uX2lkOiBzdHJpbmc7XG4gIC8qKiBXaGV0aGVyIHRoaXMgdXNlciBpcyBkZWFmZW5lZCBieSB0aGUgc2VydmVyICovXG4gIGRlYWY6IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIHRoaXMgdXNlciBpcyBtdXRlZCBieSB0aGUgc2VydmVyICovXG4gIG11dGU6IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIHRoaXMgdXNlciBpcyBsb2NhbGx5IGRlYWZlbmVkICovXG4gIHNlbGZfZGVhZjogYm9vbGVhbjtcbiAgLyoqIFdoZXRoZXIgdGhpcyB1c2VyIGlzIGxvY2FsbHkgbXV0ZWQgKi9cbiAgc2VsZl9tdXRlOiBib29sZWFuO1xuICAvKiogV2hldGhlciB0aGlzIHVzZXIgaXMgc3RyZWFtaW5nIHVzaW5nIFwiR28gTGl2ZVwiICovXG4gIHNlbGZfc3RyZWFtPzogYm9vbGVhbjtcbiAgLyoqIFdoZXRoZXIgdGhpcyB1c2VyJ3MgY2FtZXJhIGlzIGVuYWJsZWQgKi9cbiAgc2VsZl92aWRlbzogYm9vbGVhbjtcbiAgLyoqIFdoZXRoZXIgdGhpcyB1c2VyIGlzIG11dGVkIGJ5IHRoZSBjdXJyZW50IHVzZXIgKi9cbiAgc3VwcHJlc3M6IGJvb2xlYW47XG59Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLFlBQVksU0FBUSwyQ0FBNkM7U0FFakUsTUFBTSxTQUFvQixlQUFpQjtTQUMzQyxNQUFNLFNBQVEsZUFBaUI7TUFJbEMsUUFBUTtJQUNaLFFBQVE7UUFBSSxHQUFHLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUMsRUFBRTtRQUFHLE9BQU8sRUFBRSxLQUFLOztJQUMzRCxTQUFTO1FBQUksSUFBSSxFQUFFLElBQUk7UUFBRSxLQUFLLEVBQUUsS0FBSztRQUFFLFFBQVEsRUFBRSxDQUFDOztJQUNsRCxNQUFNLEVBQUUsQ0FBQzs7YUFR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