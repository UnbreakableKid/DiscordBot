import { encode } from "./deps.ts";
import { eventHandlers } from "../bot.ts";
import { isActionRow } from "../helpers/type_guards/is_action_row.ts";
import { isButton } from "../helpers/type_guards/is_button.ts";
import { Errors } from "../types/discordeno/errors.ts";
import { DiscordApplicationCommandOptionTypes } from "../types/interactions/commands/application_command_option_types.ts";
import { ButtonStyles } from "../types/messages/components/button_styles.ts";
import { SLASH_COMMANDS_NAME_REGEX } from "./constants.ts";
import { validateLength } from "./validate_length.ts";
export async function urlToBase64(url) {
  const buffer = await fetch(url).then((res) => res.arrayBuffer());
  const imageStr = encode(buffer);
  const type = url.substring(url.lastIndexOf(".") + 1);
  return `data:image/${type};base64,${imageStr}`;
}
/** Allows easy way to add a prop to a base object when needing to use complicated getters solution. */
// deno-lint-ignore no-explicit-any
export function createNewProp(value) {
  return {
    configurable: true,
    enumerable: true,
    writable: true,
    value,
  };
}
export function delay(ms) {
  return new Promise((res) =>
    setTimeout(() => {
      res();
    }, ms)
  );
}
export const formatImageURL = (url, size = 128, format) => {
  return `${url}.${format ||
    (url.includes("/a_") ? "gif" : "jpg")}?size=${size}`;
};
function camelToSnakeCase(text) {
  return text.replace(/[A-Z]/g, ($1) => `_${$1.toLowerCase()}`);
}
function snakeToCamelCase(text) {
  return text.replace(
    /([-_][a-z])/gi,
    ($1) => $1.toUpperCase().replace("_", ""),
  );
}
function isConvertableObject(obj) {
  return obj === Object(obj) && !Array.isArray(obj) &&
    typeof obj !== "function" && !(obj instanceof Blob);
}
export function snakelize( // deno-lint-ignore no-explicit-any
  obj,
) {
  if (isConvertableObject(obj)) {
    // deno-lint-ignore no-explicit-any
    const convertedObject = {};
    Object.keys(obj).forEach((key) => {
      eventHandlers.debug?.(
        "loop",
        `Running forEach loop in snakelize function.`,
      );
      convertedObject[camelToSnakeCase(key)] = snakelize( // deno-lint-ignore no-explicit-any
        (obj)[key],
      );
    });
    return convertedObject;
  } else if (Array.isArray(obj)) {
    obj = obj.map((element) => snakelize(element));
  }
  return obj;
}
export function camelize( // deno-lint-ignore no-explicit-any
  obj,
) {
  if (isConvertableObject(obj)) {
    // deno-lint-ignore no-explicit-any
    const convertedObject = {};
    Object.keys(obj).forEach((key) => {
      eventHandlers.debug?.(
        "loop",
        `Running forEach loop in camelize function.`,
      );
      convertedObject[snakeToCamelCase(key)] = camelize( // deno-lint-ignore no-explicit-any
        (obj)[key],
      );
    });
    return convertedObject;
  } else if (Array.isArray(obj)) {
    obj = obj.map((element) => camelize(element));
  }
  return obj;
}
/** @private */ function validateSlashOptionChoices(choices, optionType) {
  for (const choice of choices) {
    eventHandlers.debug?.(
      "loop",
      `Running for of loop in validateSlashOptionChoices function.`,
    );
    if (
      !validateLength(choice.name, {
        min: 1,
        max: 100,
      })
    ) {
      throw new Error(Errors.INVALID_SLASH_OPTIONS_CHOICES);
    }
    if (
      optionType === DiscordApplicationCommandOptionTypes.String &&
        (typeof choice.value !== "string" || choice.value.length < 1 ||
          choice.value.length > 100) ||
      optionType === DiscordApplicationCommandOptionTypes.Integer &&
        typeof choice.value !== "number"
    ) {
      throw new Error(Errors.INVALID_SLASH_OPTIONS_CHOICES);
    }
  }
}
/** @private */ function validateSlashOptions(options) {
  for (const option of options) {
    eventHandlers.debug?.(
      "loop",
      `Running for of loop in validateSlashOptions function.`,
    );
    if (
      option.choices?.length &&
      (option.choices.length > 25 ||
        option.type !== DiscordApplicationCommandOptionTypes.String &&
          option.type !== DiscordApplicationCommandOptionTypes.Integer)
    ) {
      throw new Error(Errors.INVALID_SLASH_OPTIONS_CHOICES);
    }
    if (
      !validateLength(option.name, {
        min: 1,
        max: 32,
      }) || !validateLength(option.description, {
        min: 1,
        max: 100,
      })
    ) {
      throw new Error(Errors.INVALID_SLASH_OPTIONS_CHOICES);
    }
    if (option.choices) {
      validateSlashOptionChoices(option.choices, option.type);
    }
  }
}
export function validateSlashCommands(commands, create = false) {
  for (const command of commands) {
    eventHandlers.debug?.(
      "loop",
      `Running for of loop in validateSlashCommands function.`,
    );
    if (
      command.name &&
        (!SLASH_COMMANDS_NAME_REGEX.test(command.name) ||
          command.name.toLowerCase() !== command.name) ||
      create && !command.name
    ) {
      throw new Error(Errors.INVALID_SLASH_NAME);
    }
    if (
      command.description && !validateLength(command.description, {
          min: 1,
          max: 100,
        }) || create && !command.description
    ) {
      throw new Error(Errors.INVALID_SLASH_DESCRIPTION);
    }
    if (command.options?.length) {
      if (command.options.length > 25) {
        throw new Error(Errors.INVALID_SLASH_OPTIONS);
      }
      validateSlashOptions(command.options);
    }
  }
}
// Typescript is not so good as we developers so we need this little utility function to help it out
// Taken from https://fettblog.eu/typescript-hasownproperty/
/** TS save way to check if a property exists in an object */
// deno-lint-ignore ban-types
export function hasOwnProperty(obj, prop) {
  // deno-lint-ignore no-prototype-builtins
  return obj.hasOwnProperty(prop);
}
export function validateComponents(components) {
  if (!components?.length) return;
  let actionRowCounter = 0;
  for (const component of components) {
    // 5 Link buttons can not have a customId
    if (isButton(component)) {
      if (component.type === ButtonStyles.Link && component.customId) {
        throw new Error(Errors.LINK_BUTTON_CANNOT_HAVE_CUSTOM_ID);
      }
      // Other buttons must have a customId
      if (!component.customId && component.type !== ButtonStyles.Link) {
        throw new Error(Errors.BUTTON_REQUIRES_CUSTOM_ID);
      }
      if (
        !validateLength(component.label, {
          max: 80,
        })
      ) {
        throw new Error(Errors.COMPONENT_LABEL_TOO_BIG);
      }
      if (
        component.customId && !validateLength(component.customId, {
          max: 100,
        })
      ) {
        throw new Error(Errors.COMPONENT_CUSTOM_ID_TOO_BIG);
      }
      if (typeof component.emoji === "string") {
        // A snowflake id was provided
        if (/^[0-9]+$/.test(component.emoji)) {
          component.emoji = {
            id: component.emoji,
          };
        } else {
          // A unicode emoji was provided
          component.emoji = {
            name: component.emoji,
          };
        }
      }
    }
    if (!isActionRow(component)) {
      continue;
    }
    actionRowCounter++;
    // Max of 5 ActionRows per message
    if (actionRowCounter > 5) throw new Error(Errors.TOO_MANY_ACTION_ROWS);
    // Max of 5 Buttons (or any component type) within an ActionRow
    if (component.components?.length > 5) {
      throw new Error(Errors.TOO_MANY_COMPONENTS);
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3V0aWwvdXRpbHMudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGVuY29kZSB9IGZyb20gXCIuL2RlcHMudHNcIjtcbmltcG9ydCB7IGV2ZW50SGFuZGxlcnMgfSBmcm9tIFwiLi4vYm90LnRzXCI7XG5pbXBvcnQgeyBpc0FjdGlvblJvdyB9IGZyb20gXCIuLi9oZWxwZXJzL3R5cGVfZ3VhcmRzL2lzX2FjdGlvbl9yb3cudHNcIjtcbmltcG9ydCB7IGlzQnV0dG9uIH0gZnJvbSBcIi4uL2hlbHBlcnMvdHlwZV9ndWFyZHMvaXNfYnV0dG9uLnRzXCI7XG5pbXBvcnQgeyBFcnJvcnMgfSBmcm9tIFwiLi4vdHlwZXMvZGlzY29yZGVuby9lcnJvcnMudHNcIjtcbmltcG9ydCB0eXBlIHsgQXBwbGljYXRpb25Db21tYW5kT3B0aW9uIH0gZnJvbSBcIi4uL3R5cGVzL2ludGVyYWN0aW9ucy9jb21tYW5kcy9hcHBsaWNhdGlvbl9jb21tYW5kX29wdGlvbi50c1wiO1xuaW1wb3J0IHR5cGUgeyBBcHBsaWNhdGlvbkNvbW1hbmRPcHRpb25DaG9pY2UgfSBmcm9tIFwiLi4vdHlwZXMvaW50ZXJhY3Rpb25zL2NvbW1hbmRzL2FwcGxpY2F0aW9uX2NvbW1hbmRfb3B0aW9uX2Nob2ljZS50c1wiO1xuaW1wb3J0IHsgRGlzY29yZEFwcGxpY2F0aW9uQ29tbWFuZE9wdGlvblR5cGVzIH0gZnJvbSBcIi4uL3R5cGVzL2ludGVyYWN0aW9ucy9jb21tYW5kcy9hcHBsaWNhdGlvbl9jb21tYW5kX29wdGlvbl90eXBlcy50c1wiO1xuaW1wb3J0IHR5cGUgeyBDcmVhdGVHbG9iYWxBcHBsaWNhdGlvbkNvbW1hbmQgfSBmcm9tIFwiLi4vdHlwZXMvaW50ZXJhY3Rpb25zL2NvbW1hbmRzL2NyZWF0ZV9nbG9iYWxfYXBwbGljYXRpb25fY29tbWFuZC50c1wiO1xuaW1wb3J0IHR5cGUgeyBFZGl0R2xvYmFsQXBwbGljYXRpb25Db21tYW5kIH0gZnJvbSBcIi4uL3R5cGVzL2ludGVyYWN0aW9ucy9jb21tYW5kcy9lZGl0X2dsb2JhbF9hcHBsaWNhdGlvbl9jb21tYW5kLnRzXCI7XG5pbXBvcnQgeyBCdXR0b25TdHlsZXMgfSBmcm9tIFwiLi4vdHlwZXMvbWVzc2FnZXMvY29tcG9uZW50cy9idXR0b25fc3R5bGVzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IE1lc3NhZ2VDb21wb25lbnRzIH0gZnJvbSBcIi4uL3R5cGVzL21lc3NhZ2VzL2NvbXBvbmVudHMvbWVzc2FnZV9jb21wb25lbnRzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IERpc2NvcmRJbWFnZUZvcm1hdCB9IGZyb20gXCIuLi90eXBlcy9taXNjL2ltYWdlX2Zvcm1hdC50c1wiO1xuaW1wb3J0IHR5cGUgeyBEaXNjb3JkSW1hZ2VTaXplIH0gZnJvbSBcIi4uL3R5cGVzL21pc2MvaW1hZ2Vfc2l6ZS50c1wiO1xuaW1wb3J0IHsgU0xBU0hfQ09NTUFORFNfTkFNRV9SRUdFWCB9IGZyb20gXCIuL2NvbnN0YW50cy50c1wiO1xuaW1wb3J0IHsgdmFsaWRhdGVMZW5ndGggfSBmcm9tIFwiLi92YWxpZGF0ZV9sZW5ndGgudHNcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVybFRvQmFzZTY0KHVybDogc3RyaW5nKSB7XG4gIGNvbnN0IGJ1ZmZlciA9IGF3YWl0IGZldGNoKHVybCkudGhlbigocmVzKSA9PiByZXMuYXJyYXlCdWZmZXIoKSk7XG4gIGNvbnN0IGltYWdlU3RyID0gZW5jb2RlKGJ1ZmZlcik7XG4gIGNvbnN0IHR5cGUgPSB1cmwuc3Vic3RyaW5nKHVybC5sYXN0SW5kZXhPZihcIi5cIikgKyAxKTtcbiAgcmV0dXJuIGBkYXRhOmltYWdlLyR7dHlwZX07YmFzZTY0LCR7aW1hZ2VTdHJ9YDtcbn1cblxuLyoqIEFsbG93cyBlYXN5IHdheSB0byBhZGQgYSBwcm9wIHRvIGEgYmFzZSBvYmplY3Qgd2hlbiBuZWVkaW5nIHRvIHVzZSBjb21wbGljYXRlZCBnZXR0ZXJzIHNvbHV0aW9uLiAqL1xuLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOZXdQcm9wKHZhbHVlOiBhbnkpOiBQcm9wZXJ0eURlc2NyaXB0b3Ige1xuICByZXR1cm4geyBjb25maWd1cmFibGU6IHRydWUsIGVudW1lcmFibGU6IHRydWUsIHdyaXRhYmxlOiB0cnVlLCB2YWx1ZSB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVsYXkobXM6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlcyk6IG51bWJlciA9PlxuICAgIHNldFRpbWVvdXQoKCk6IHZvaWQgPT4ge1xuICAgICAgcmVzKCk7XG4gICAgfSwgbXMpXG4gICk7XG59XG5cbmV4cG9ydCBjb25zdCBmb3JtYXRJbWFnZVVSTCA9IChcbiAgdXJsOiBzdHJpbmcsXG4gIHNpemU6IERpc2NvcmRJbWFnZVNpemUgPSAxMjgsXG4gIGZvcm1hdD86IERpc2NvcmRJbWFnZUZvcm1hdCxcbikgPT4ge1xuICByZXR1cm4gYCR7dXJsfS4ke2Zvcm1hdCB8fFxuICAgICh1cmwuaW5jbHVkZXMoXCIvYV9cIikgPyBcImdpZlwiIDogXCJqcGdcIil9P3NpemU9JHtzaXplfWA7XG59O1xuXG5mdW5jdGlvbiBjYW1lbFRvU25ha2VDYXNlKHRleHQ6IHN0cmluZykge1xuICByZXR1cm4gdGV4dC5yZXBsYWNlKC9bQS1aXS9nLCAoJDEpID0+IGBfJHskMS50b0xvd2VyQ2FzZSgpfWApO1xufVxuXG5mdW5jdGlvbiBzbmFrZVRvQ2FtZWxDYXNlKHRleHQ6IHN0cmluZykge1xuICByZXR1cm4gdGV4dC5yZXBsYWNlKFxuICAgIC8oWy1fXVthLXpdKS9naSxcbiAgICAoJDEpID0+ICQxLnRvVXBwZXJDYXNlKCkucmVwbGFjZShcIl9cIiwgXCJcIiksXG4gICk7XG59XG5cbmZ1bmN0aW9uIGlzQ29udmVydGFibGVPYmplY3Qob2JqOiB1bmtub3duKSB7XG4gIHJldHVybiAoXG4gICAgb2JqID09PSBPYmplY3Qob2JqKSAmJlxuICAgICFBcnJheS5pc0FycmF5KG9iaikgJiZcbiAgICB0eXBlb2Ygb2JqICE9PSBcImZ1bmN0aW9uXCIgJiZcbiAgICAhKG9iaiBpbnN0YW5jZW9mIEJsb2IpXG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzbmFrZWxpemU8VD4oXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIG9iajogUmVjb3JkPHN0cmluZywgYW55PiB8IFJlY29yZDxzdHJpbmcsIGFueT5bXSxcbik6IFQge1xuICBpZiAoaXNDb252ZXJ0YWJsZU9iamVjdChvYmopKSB7XG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICBjb25zdCBjb252ZXJ0ZWRPYmplY3Q6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcblxuICAgIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBldmVudEhhbmRsZXJzLmRlYnVnPy4oXG4gICAgICAgIFwibG9vcFwiLFxuICAgICAgICBgUnVubmluZyBmb3JFYWNoIGxvb3AgaW4gc25ha2VsaXplIGZ1bmN0aW9uLmAsXG4gICAgICApO1xuICAgICAgY29udmVydGVkT2JqZWN0W2NhbWVsVG9TbmFrZUNhc2Uoa2V5KV0gPSBzbmFrZWxpemUoXG4gICAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgICAgIChvYmogYXMgUmVjb3JkPHN0cmluZywgYW55Pilba2V5XSxcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gY29udmVydGVkT2JqZWN0IGFzIFQ7XG4gIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvYmopKSB7XG4gICAgb2JqID0gb2JqLm1hcCgoZWxlbWVudCkgPT4gc25ha2VsaXplKGVsZW1lbnQpKTtcbiAgfVxuXG4gIHJldHVybiBvYmogYXMgVDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhbWVsaXplPFQ+KFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBvYmo6IFJlY29yZDxzdHJpbmcsIGFueT4gfCBSZWNvcmQ8c3RyaW5nLCBhbnk+W10sXG4pOiBUIHtcbiAgaWYgKGlzQ29udmVydGFibGVPYmplY3Qob2JqKSkge1xuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgY29uc3QgY29udmVydGVkT2JqZWN0OiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge307XG5cbiAgICBPYmplY3Qua2V5cyhvYmopLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgZXZlbnRIYW5kbGVycy5kZWJ1Zz8uKFxuICAgICAgICBcImxvb3BcIixcbiAgICAgICAgYFJ1bm5pbmcgZm9yRWFjaCBsb29wIGluIGNhbWVsaXplIGZ1bmN0aW9uLmAsXG4gICAgICApO1xuICAgICAgY29udmVydGVkT2JqZWN0W3NuYWtlVG9DYW1lbENhc2Uoa2V5KV0gPSBjYW1lbGl6ZShcbiAgICAgICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICAgICAgKG9iaiBhcyBSZWNvcmQ8c3RyaW5nLCBhbnk+KVtrZXldLFxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBjb252ZXJ0ZWRPYmplY3QgYXMgVDtcbiAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9iaikpIHtcbiAgICBvYmogPSBvYmoubWFwKChlbGVtZW50KSA9PiBjYW1lbGl6ZShlbGVtZW50KSk7XG4gIH1cblxuICByZXR1cm4gb2JqIGFzIFQ7XG59XG5cbi8qKiBAcHJpdmF0ZSAqL1xuZnVuY3Rpb24gdmFsaWRhdGVTbGFzaE9wdGlvbkNob2ljZXMoXG4gIGNob2ljZXM6IEFwcGxpY2F0aW9uQ29tbWFuZE9wdGlvbkNob2ljZVtdLFxuICBvcHRpb25UeXBlOiBEaXNjb3JkQXBwbGljYXRpb25Db21tYW5kT3B0aW9uVHlwZXMsXG4pIHtcbiAgZm9yIChjb25zdCBjaG9pY2Ugb2YgY2hvaWNlcykge1xuICAgIGV2ZW50SGFuZGxlcnMuZGVidWc/LihcbiAgICAgIFwibG9vcFwiLFxuICAgICAgYFJ1bm5pbmcgZm9yIG9mIGxvb3AgaW4gdmFsaWRhdGVTbGFzaE9wdGlvbkNob2ljZXMgZnVuY3Rpb24uYCxcbiAgICApO1xuICAgIGlmICghdmFsaWRhdGVMZW5ndGgoY2hvaWNlLm5hbWUsIHsgbWluOiAxLCBtYXg6IDEwMCB9KSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKEVycm9ycy5JTlZBTElEX1NMQVNIX09QVElPTlNfQ0hPSUNFUyk7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgKG9wdGlvblR5cGUgPT09IERpc2NvcmRBcHBsaWNhdGlvbkNvbW1hbmRPcHRpb25UeXBlcy5TdHJpbmcgJiZcbiAgICAgICAgKHR5cGVvZiBjaG9pY2UudmFsdWUgIT09IFwic3RyaW5nXCIgfHxcbiAgICAgICAgICBjaG9pY2UudmFsdWUubGVuZ3RoIDwgMSB8fFxuICAgICAgICAgIGNob2ljZS52YWx1ZS5sZW5ndGggPiAxMDApKSB8fFxuICAgICAgKG9wdGlvblR5cGUgPT09IERpc2NvcmRBcHBsaWNhdGlvbkNvbW1hbmRPcHRpb25UeXBlcy5JbnRlZ2VyICYmXG4gICAgICAgIHR5cGVvZiBjaG9pY2UudmFsdWUgIT09IFwibnVtYmVyXCIpXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoRXJyb3JzLklOVkFMSURfU0xBU0hfT1BUSU9OU19DSE9JQ0VTKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIEBwcml2YXRlICovXG5mdW5jdGlvbiB2YWxpZGF0ZVNsYXNoT3B0aW9ucyhvcHRpb25zOiBBcHBsaWNhdGlvbkNvbW1hbmRPcHRpb25bXSkge1xuICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBvcHRpb25zKSB7XG4gICAgZXZlbnRIYW5kbGVycy5kZWJ1Zz8uKFxuICAgICAgXCJsb29wXCIsXG4gICAgICBgUnVubmluZyBmb3Igb2YgbG9vcCBpbiB2YWxpZGF0ZVNsYXNoT3B0aW9ucyBmdW5jdGlvbi5gLFxuICAgICk7XG4gICAgaWYgKFxuICAgICAgb3B0aW9uLmNob2ljZXM/Lmxlbmd0aCAmJlxuICAgICAgKG9wdGlvbi5jaG9pY2VzLmxlbmd0aCA+IDI1IHx8XG4gICAgICAgIChvcHRpb24udHlwZSAhPT0gRGlzY29yZEFwcGxpY2F0aW9uQ29tbWFuZE9wdGlvblR5cGVzLlN0cmluZyAmJlxuICAgICAgICAgIG9wdGlvbi50eXBlICE9PSBEaXNjb3JkQXBwbGljYXRpb25Db21tYW5kT3B0aW9uVHlwZXMuSW50ZWdlcikpXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoRXJyb3JzLklOVkFMSURfU0xBU0hfT1BUSU9OU19DSE9JQ0VTKTtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICAhdmFsaWRhdGVMZW5ndGgob3B0aW9uLm5hbWUsIHsgbWluOiAxLCBtYXg6IDMyIH0pIHx8XG4gICAgICAhdmFsaWRhdGVMZW5ndGgob3B0aW9uLmRlc2NyaXB0aW9uLCB7IG1pbjogMSwgbWF4OiAxMDAgfSlcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihFcnJvcnMuSU5WQUxJRF9TTEFTSF9PUFRJT05TX0NIT0lDRVMpO1xuICAgIH1cblxuICAgIGlmIChvcHRpb24uY2hvaWNlcykge1xuICAgICAgdmFsaWRhdGVTbGFzaE9wdGlvbkNob2ljZXMob3B0aW9uLmNob2ljZXMsIG9wdGlvbi50eXBlKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlU2xhc2hDb21tYW5kcyhcbiAgY29tbWFuZHM6IChDcmVhdGVHbG9iYWxBcHBsaWNhdGlvbkNvbW1hbmQgfCBFZGl0R2xvYmFsQXBwbGljYXRpb25Db21tYW5kKVtdLFxuICBjcmVhdGUgPSBmYWxzZSxcbikge1xuICBmb3IgKGNvbnN0IGNvbW1hbmQgb2YgY29tbWFuZHMpIHtcbiAgICBldmVudEhhbmRsZXJzLmRlYnVnPy4oXG4gICAgICBcImxvb3BcIixcbiAgICAgIGBSdW5uaW5nIGZvciBvZiBsb29wIGluIHZhbGlkYXRlU2xhc2hDb21tYW5kcyBmdW5jdGlvbi5gLFxuICAgICk7XG4gICAgaWYgKFxuICAgICAgKGNvbW1hbmQubmFtZSAmJlxuICAgICAgICAoIVNMQVNIX0NPTU1BTkRTX05BTUVfUkVHRVgudGVzdChjb21tYW5kLm5hbWUpIHx8XG4gICAgICAgICAgY29tbWFuZC5uYW1lLnRvTG93ZXJDYXNlKCkgIT09IGNvbW1hbmQubmFtZSkpIHx8XG4gICAgICAoY3JlYXRlICYmICFjb21tYW5kLm5hbWUpXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoRXJyb3JzLklOVkFMSURfU0xBU0hfTkFNRSk7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgKGNvbW1hbmQuZGVzY3JpcHRpb24gJiZcbiAgICAgICAgIXZhbGlkYXRlTGVuZ3RoKGNvbW1hbmQuZGVzY3JpcHRpb24sIHsgbWluOiAxLCBtYXg6IDEwMCB9KSkgfHxcbiAgICAgIChjcmVhdGUgJiYgIWNvbW1hbmQuZGVzY3JpcHRpb24pXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoRXJyb3JzLklOVkFMSURfU0xBU0hfREVTQ1JJUFRJT04pO1xuICAgIH1cblxuICAgIGlmIChjb21tYW5kLm9wdGlvbnM/Lmxlbmd0aCkge1xuICAgICAgaWYgKGNvbW1hbmQub3B0aW9ucy5sZW5ndGggPiAyNSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoRXJyb3JzLklOVkFMSURfU0xBU0hfT1BUSU9OUyk7XG4gICAgICB9XG5cbiAgICAgIHZhbGlkYXRlU2xhc2hPcHRpb25zKGNvbW1hbmQub3B0aW9ucyk7XG4gICAgfVxuICB9XG59XG5cbi8vIFR5cGVzY3JpcHQgaXMgbm90IHNvIGdvb2QgYXMgd2UgZGV2ZWxvcGVycyBzbyB3ZSBuZWVkIHRoaXMgbGl0dGxlIHV0aWxpdHkgZnVuY3Rpb24gdG8gaGVscCBpdCBvdXRcbi8vIFRha2VuIGZyb20gaHR0cHM6Ly9mZXR0YmxvZy5ldS90eXBlc2NyaXB0LWhhc293bnByb3BlcnR5L1xuLyoqIFRTIHNhdmUgd2F5IHRvIGNoZWNrIGlmIGEgcHJvcGVydHkgZXhpc3RzIGluIGFuIG9iamVjdCAqL1xuLy8gZGVuby1saW50LWlnbm9yZSBiYW4tdHlwZXNcbmV4cG9ydCBmdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eTxUIGV4dGVuZHMge30sIFkgZXh0ZW5kcyBQcm9wZXJ0eUtleSA9IHN0cmluZz4oXG4gIG9iajogVCxcbiAgcHJvcDogWSxcbik6IG9iaiBpcyBUICYgUmVjb3JkPFksIHVua25vd24+IHtcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1wcm90b3R5cGUtYnVpbHRpbnNcbiAgcmV0dXJuIG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlQ29tcG9uZW50cyhjb21wb25lbnRzOiBNZXNzYWdlQ29tcG9uZW50cykge1xuICBpZiAoIWNvbXBvbmVudHM/Lmxlbmd0aCkgcmV0dXJuO1xuXG4gIGxldCBhY3Rpb25Sb3dDb3VudGVyID0gMDtcblxuICBmb3IgKGNvbnN0IGNvbXBvbmVudCBvZiBjb21wb25lbnRzKSB7XG4gICAgLy8gNSBMaW5rIGJ1dHRvbnMgY2FuIG5vdCBoYXZlIGEgY3VzdG9tSWRcbiAgICBpZiAoaXNCdXR0b24oY29tcG9uZW50KSkge1xuICAgICAgaWYgKFxuICAgICAgICBjb21wb25lbnQudHlwZSA9PT0gQnV0dG9uU3R5bGVzLkxpbmsgJiZcbiAgICAgICAgY29tcG9uZW50LmN1c3RvbUlkXG4gICAgICApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKEVycm9ycy5MSU5LX0JVVFRPTl9DQU5OT1RfSEFWRV9DVVNUT01fSUQpO1xuICAgICAgfVxuICAgICAgLy8gT3RoZXIgYnV0dG9ucyBtdXN0IGhhdmUgYSBjdXN0b21JZFxuICAgICAgaWYgKFxuICAgICAgICAhY29tcG9uZW50LmN1c3RvbUlkICYmIGNvbXBvbmVudC50eXBlICE9PSBCdXR0b25TdHlsZXMuTGlua1xuICAgICAgKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihFcnJvcnMuQlVUVE9OX1JFUVVJUkVTX0NVU1RPTV9JRCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghdmFsaWRhdGVMZW5ndGgoY29tcG9uZW50LmxhYmVsLCB7IG1heDogODAgfSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKEVycm9ycy5DT01QT05FTlRfTEFCRUxfVE9PX0JJRyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChcbiAgICAgICAgY29tcG9uZW50LmN1c3RvbUlkICYmXG4gICAgICAgICF2YWxpZGF0ZUxlbmd0aChjb21wb25lbnQuY3VzdG9tSWQsIHsgbWF4OiAxMDAgfSlcbiAgICAgICkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoRXJyb3JzLkNPTVBPTkVOVF9DVVNUT01fSURfVE9PX0JJRyk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50LmVtb2ppID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIC8vIEEgc25vd2ZsYWtlIGlkIHdhcyBwcm92aWRlZFxuICAgICAgICBpZiAoL15bMC05XSskLy50ZXN0KGNvbXBvbmVudC5lbW9qaSkpIHtcbiAgICAgICAgICBjb21wb25lbnQuZW1vamkgPSB7XG4gICAgICAgICAgICBpZDogY29tcG9uZW50LmVtb2ppLFxuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQSB1bmljb2RlIGVtb2ppIHdhcyBwcm92aWRlZFxuICAgICAgICAgIGNvbXBvbmVudC5lbW9qaSA9IHtcbiAgICAgICAgICAgIG5hbWU6IGNvbXBvbmVudC5lbW9qaSxcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFpc0FjdGlvblJvdyhjb21wb25lbnQpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBhY3Rpb25Sb3dDb3VudGVyKys7XG4gICAgLy8gTWF4IG9mIDUgQWN0aW9uUm93cyBwZXIgbWVzc2FnZVxuICAgIGlmIChhY3Rpb25Sb3dDb3VudGVyID4gNSkgdGhyb3cgbmV3IEVycm9yKEVycm9ycy5UT09fTUFOWV9BQ1RJT05fUk9XUyk7XG5cbiAgICAvLyBNYXggb2YgNSBCdXR0b25zIChvciBhbnkgY29tcG9uZW50IHR5cGUpIHdpdGhpbiBhbiBBY3Rpb25Sb3dcbiAgICBpZiAoY29tcG9uZW50LmNvbXBvbmVudHM/Lmxlbmd0aCA+IDUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihFcnJvcnMuVE9PX01BTllfQ09NUE9ORU5UUyk7XG4gICAgfVxuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsTUFBTSxTQUFRLFNBQVc7U0FDekIsYUFBYSxTQUFRLFNBQVc7U0FDaEMsV0FBVyxTQUFRLHVDQUF5QztTQUM1RCxRQUFRLFNBQVEsbUNBQXFDO1NBQ3JELE1BQU0sU0FBUSw2QkFBK0I7U0FHN0Msb0NBQW9DLFNBQVEsa0VBQW9FO1NBR2hILFlBQVksU0FBUSw2Q0FBK0M7U0FJbkUseUJBQXlCLFNBQVEsY0FBZ0I7U0FDakQsY0FBYyxTQUFRLG9CQUFzQjtzQkFFL0IsV0FBVyxDQUFDLEdBQVc7VUFDckMsTUFBTSxTQUFTLEtBQUssQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsR0FBSyxHQUFHLENBQUMsV0FBVzs7VUFDdkQsUUFBUSxHQUFHLE1BQU0sQ0FBQyxNQUFNO1VBQ3hCLElBQUksR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUMsQ0FBRyxLQUFJLENBQUM7WUFDM0MsV0FBVyxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsUUFBUTs7QUFHOUMsRUFBdUcsQUFBdkcsbUdBQXVHLEFBQXZHLEVBQXVHLENBQ3ZHLEVBQW1DLEFBQW5DLGlDQUFtQztnQkFDbkIsYUFBYSxDQUFDLEtBQVU7O1FBQzdCLFlBQVksRUFBRSxJQUFJO1FBQUUsVUFBVSxFQUFFLElBQUk7UUFBRSxRQUFRLEVBQUUs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
