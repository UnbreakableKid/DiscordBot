import i18next from "https://deno.land/x/i18next@v20.2.2/index.js";
import Backend from "https://deno.land/x/i18next_fs_backend@v1.1.1/index.js";
import { configs } from "../../configs.ts";
import { cache, sendWebhook, snowflakeToBigint } from "../../deps.ts";
import { bot } from "../../cache.ts";
import { log } from "./logger.ts";
/** This function helps translate the string to the specific guilds needs. */ export function translate(guildId, key, options) {
    const guild = cache.guilds.get(guildId);
    const language = bot.guildLanguages.get(guildId) || guild?.preferredLocale || "en_US";
    // undefined is silly bug cause i18next dont have proper typings
    const languageMap = i18next.getFixedT(language, undefined) || i18next.getFixedT("en_US", undefined);
    return languageMap(key, options);
}
export async function determineNamespaces(path, namespaces = [], folderName = "") {
    const files = Deno.readDirSync(Deno.realPathSync(path));
    for (const file of files){
        if (file.isDirectory) {
            const isLanguage = file.name.includes("-") || file.name.includes("_");
            namespaces = await determineNamespaces(`${path}/${file.name}`, namespaces, isLanguage ? "" : `${folderName + file.name}/`);
        } else {
            namespaces.push(`${folderName}${file.name.substr(0, file.name.length - 5)}`);
        }
    }
    return [
        ...new Set(namespaces)
    ];
}
export async function loadLanguages() {
    const namespaces = await determineNamespaces(Deno.realPathSync("./src/languages"));
    const languageFolder = [
        ...Deno.readDirSync(Deno.realPathSync("./src/languages")), 
    ];
    return i18next.use(Backend).init({
        initImmediate: false,
        fallbackLng: "en_US",
        interpolation: {
            escapeValue: false
        },
        load: "all",
        lng: "en_US",
        saveMissing: true,
        // Log to discord/console that a string is missing somewhere.
        missingKeyHandler: async function(lng, ns, key, fallbackValue) {
            const response = `Missing translation key: ${lng}/${ns}:${key}. Instead using: ${fallbackValue}`;
            log.warn(response);
            if (!configs.webhooks.missingTranslation.id) return;
            await sendWebhook(snowflakeToBigint(configs.webhooks.missingTranslation.id), configs.webhooks.missingTranslation.token, // deno-lint-ignore ban-ts-comment
            // @ts-ignore
            {
                content: response
            }).catch(log.error);
        },
        preload: languageFolder.map((file)=>file.isDirectory ? file.name : undefined
        )// Removes any non directory names(language names)
        .filter((name)=>name
        ),
        ns: namespaces,
        backend: {
            loadPath: `${Deno.realPathSync("./src/languages")}/{{lng}}/{{ns}}.json`
        }
    }, undefined);
}
export async function reloadLang(language) {
    const namespaces = await determineNamespaces(Deno.realPathSync("./src/languages"));
    i18next.reloadResources(language, namespaces, undefined);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL3V0aWxzL2kxOG5leHQudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBpMThuZXh0IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC94L2kxOG5leHRAdjIwLjIuMi9pbmRleC5qc1wiO1xuaW1wb3J0IEJhY2tlbmQgZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3gvaTE4bmV4dF9mc19iYWNrZW5kQHYxLjEuMS9pbmRleC5qc1wiO1xuaW1wb3J0IHsgY29uZmlncyB9IGZyb20gXCIuLi8uLi9jb25maWdzLnRzXCI7XG5pbXBvcnQgeyBjYWNoZSwgc2VuZFdlYmhvb2ssIHNub3dmbGFrZVRvQmlnaW50IH0gZnJvbSBcIi4uLy4uL2RlcHMudHNcIjtcbmltcG9ydCB7IGJvdCB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuaW1wb3J0IHsgbG9nIH0gZnJvbSBcIi4vbG9nZ2VyLnRzXCI7XG5cbi8qKiBUaGlzIGZ1bmN0aW9uIGhlbHBzIHRyYW5zbGF0ZSB0aGUgc3RyaW5nIHRvIHRoZSBzcGVjaWZpYyBndWlsZHMgbmVlZHMuICovXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNsYXRlKGd1aWxkSWQ6IGJpZ2ludCwga2V5OiBzdHJpbmcsIG9wdGlvbnM/OiB1bmtub3duKSB7XG4gIGNvbnN0IGd1aWxkID0gY2FjaGUuZ3VpbGRzLmdldChndWlsZElkKTtcbiAgY29uc3QgbGFuZ3VhZ2UgPSBib3QuZ3VpbGRMYW5ndWFnZXMuZ2V0KGd1aWxkSWQpIHx8IGd1aWxkPy5wcmVmZXJyZWRMb2NhbGUgfHxcbiAgICBcImVuX1VTXCI7XG5cbiAgLy8gdW5kZWZpbmVkIGlzIHNpbGx5IGJ1ZyBjYXVzZSBpMThuZXh0IGRvbnQgaGF2ZSBwcm9wZXIgdHlwaW5nc1xuICBjb25zdCBsYW5ndWFnZU1hcCA9IGkxOG5leHQuZ2V0Rml4ZWRUKGxhbmd1YWdlLCB1bmRlZmluZWQpIHx8XG4gICAgaTE4bmV4dC5nZXRGaXhlZFQoXCJlbl9VU1wiLCB1bmRlZmluZWQpO1xuXG4gIHJldHVybiBsYW5ndWFnZU1hcChrZXksIG9wdGlvbnMpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGV0ZXJtaW5lTmFtZXNwYWNlcyhcbiAgcGF0aDogc3RyaW5nLFxuICBuYW1lc3BhY2VzOiBzdHJpbmdbXSA9IFtdLFxuICBmb2xkZXJOYW1lID0gXCJcIixcbikge1xuICBjb25zdCBmaWxlcyA9IERlbm8ucmVhZERpclN5bmMoRGVuby5yZWFsUGF0aFN5bmMocGF0aCkpO1xuXG4gIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgIGlmIChmaWxlLmlzRGlyZWN0b3J5KSB7XG4gICAgICBjb25zdCBpc0xhbmd1YWdlID0gZmlsZS5uYW1lLmluY2x1ZGVzKFwiLVwiKSB8fCBmaWxlLm5hbWUuaW5jbHVkZXMoXCJfXCIpO1xuXG4gICAgICBuYW1lc3BhY2VzID0gYXdhaXQgZGV0ZXJtaW5lTmFtZXNwYWNlcyhcbiAgICAgICAgYCR7cGF0aH0vJHtmaWxlLm5hbWV9YCxcbiAgICAgICAgbmFtZXNwYWNlcyxcbiAgICAgICAgaXNMYW5ndWFnZSA/IFwiXCIgOiBgJHtmb2xkZXJOYW1lICsgZmlsZS5uYW1lfS9gLFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZXNwYWNlcy5wdXNoKFxuICAgICAgICBgJHtmb2xkZXJOYW1lfSR7ZmlsZS5uYW1lLnN1YnN0cigwLCBmaWxlLm5hbWUubGVuZ3RoIC0gNSl9YCxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFsuLi5uZXcgU2V0KG5hbWVzcGFjZXMpXTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWRMYW5ndWFnZXMoKSB7XG4gIGNvbnN0IG5hbWVzcGFjZXMgPSBhd2FpdCBkZXRlcm1pbmVOYW1lc3BhY2VzKFxuICAgIERlbm8ucmVhbFBhdGhTeW5jKFwiLi9zcmMvbGFuZ3VhZ2VzXCIpLFxuICApO1xuICBjb25zdCBsYW5ndWFnZUZvbGRlciA9IFtcbiAgICAuLi5EZW5vLnJlYWREaXJTeW5jKERlbm8ucmVhbFBhdGhTeW5jKFwiLi9zcmMvbGFuZ3VhZ2VzXCIpKSxcbiAgXTtcblxuICByZXR1cm4gaTE4bmV4dC51c2UoQmFja2VuZCkuaW5pdChcbiAgICB7XG4gICAgICBpbml0SW1tZWRpYXRlOiBmYWxzZSxcbiAgICAgIGZhbGxiYWNrTG5nOiBcImVuX1VTXCIsXG4gICAgICBpbnRlcnBvbGF0aW9uOiB7IGVzY2FwZVZhbHVlOiBmYWxzZSB9LFxuICAgICAgbG9hZDogXCJhbGxcIixcbiAgICAgIGxuZzogXCJlbl9VU1wiLFxuICAgICAgc2F2ZU1pc3Npbmc6IHRydWUsXG4gICAgICAvLyBMb2cgdG8gZGlzY29yZC9jb25zb2xlIHRoYXQgYSBzdHJpbmcgaXMgbWlzc2luZyBzb21ld2hlcmUuXG4gICAgICBtaXNzaW5nS2V5SGFuZGxlcjogYXN5bmMgZnVuY3Rpb24gKFxuICAgICAgICBsbmc6IHN0cmluZyxcbiAgICAgICAgbnM6IHN0cmluZyxcbiAgICAgICAga2V5OiBzdHJpbmcsXG4gICAgICAgIGZhbGxiYWNrVmFsdWU6IHN0cmluZyxcbiAgICAgICkge1xuICAgICAgICBjb25zdCByZXNwb25zZSA9XG4gICAgICAgICAgYE1pc3NpbmcgdHJhbnNsYXRpb24ga2V5OiAke2xuZ30vJHtuc306JHtrZXl9LiBJbnN0ZWFkIHVzaW5nOiAke2ZhbGxiYWNrVmFsdWV9YDtcbiAgICAgICAgbG9nLndhcm4ocmVzcG9uc2UpO1xuXG4gICAgICAgIGlmICghY29uZmlncy53ZWJob29rcy5taXNzaW5nVHJhbnNsYXRpb24uaWQpIHJldHVybjtcblxuICAgICAgICBhd2FpdCBzZW5kV2ViaG9vayhcbiAgICAgICAgICBzbm93Zmxha2VUb0JpZ2ludChjb25maWdzLndlYmhvb2tzLm1pc3NpbmdUcmFuc2xhdGlvbi5pZCksXG4gICAgICAgICAgY29uZmlncy53ZWJob29rcy5taXNzaW5nVHJhbnNsYXRpb24udG9rZW4sXG4gICAgICAgICAgLy8gZGVuby1saW50LWlnbm9yZSBiYW4tdHMtY29tbWVudFxuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICB7IGNvbnRlbnQ6IHJlc3BvbnNlIH0sXG4gICAgICAgICkuY2F0Y2gobG9nLmVycm9yKTtcbiAgICAgIH0sXG4gICAgICBwcmVsb2FkOiBsYW5ndWFnZUZvbGRlclxuICAgICAgICAubWFwKChmaWxlKSA9PiAoZmlsZS5pc0RpcmVjdG9yeSA/IGZpbGUubmFtZSA6IHVuZGVmaW5lZCkpXG4gICAgICAgIC8vIFJlbW92ZXMgYW55IG5vbiBkaXJlY3RvcnkgbmFtZXMobGFuZ3VhZ2UgbmFtZXMpXG4gICAgICAgIC5maWx0ZXIoKG5hbWUpID0+IG5hbWUpLFxuICAgICAgbnM6IG5hbWVzcGFjZXMsXG4gICAgICBiYWNrZW5kOiB7XG4gICAgICAgIGxvYWRQYXRoOiBgJHtEZW5vLnJlYWxQYXRoU3luYyhcIi4vc3JjL2xhbmd1YWdlc1wiKX0ve3tsbmd9fS97e25zfX0uanNvbmAsXG4gICAgICB9LFxuICAgICAgLy8gU2lsbHkgYnVnIGluIGkxOG5leHQgbmVlZHMgYSBzZWNvbmQgcGFyYW0gd2hlbiB1bm5lY2Vzc2FyeVxuICAgIH0sXG4gICAgdW5kZWZpbmVkLFxuICApO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVsb2FkTGFuZyhsYW5ndWFnZT86IHN0cmluZ1tdKSB7XG4gIGNvbnN0IG5hbWVzcGFjZXMgPSBhd2FpdCBkZXRlcm1pbmVOYW1lc3BhY2VzKFxuICAgIERlbm8ucmVhbFBhdGhTeW5jKFwiLi9zcmMvbGFuZ3VhZ2VzXCIpLFxuICApO1xuXG4gIGkxOG5leHQucmVsb2FkUmVzb3VyY2VzKGxhbmd1YWdlLCBuYW1lc3BhY2VzLCB1bmRlZmluZWQpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJPQUFPLE9BQU8sT0FBTSw0Q0FBOEM7T0FDM0QsT0FBTyxPQUFNLHNEQUF3RDtTQUNuRSxPQUFPLFNBQVEsZ0JBQWtCO1NBQ2pDLEtBQUssRUFB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