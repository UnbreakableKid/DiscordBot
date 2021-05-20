import { MessageComponentTypes } from "../../types/messages/components/message_component_types.ts";
/** A type guard function to tell if it is a action row component */ export function isActionRow(
  component,
) {
  return component.type === MessageComponentTypes.ActionRow;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvdHlwZV9ndWFyZHMvaXNfYWN0aW9uX3Jvdy50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBBY3Rpb25Sb3cgfSBmcm9tIFwiLi4vLi4vdHlwZXMvbWVzc2FnZXMvY29tcG9uZW50cy9hY3Rpb25fcm93LnRzXCI7XG5pbXBvcnQgdHlwZSB7IE1lc3NhZ2VDb21wb25lbnQgfSBmcm9tIFwiLi4vLi4vdHlwZXMvbWVzc2FnZXMvY29tcG9uZW50cy9tZXNzYWdlX2NvbXBvbmVudHMudHNcIjtcbmltcG9ydCB7IE1lc3NhZ2VDb21wb25lbnRUeXBlcyB9IGZyb20gXCIuLi8uLi90eXBlcy9tZXNzYWdlcy9jb21wb25lbnRzL21lc3NhZ2VfY29tcG9uZW50X3R5cGVzLnRzXCI7XG5cbi8qKiBBIHR5cGUgZ3VhcmQgZnVuY3Rpb24gdG8gdGVsbCBpZiBpdCBpcyBhIGFjdGlvbiByb3cgY29tcG9uZW50ICovXG5leHBvcnQgZnVuY3Rpb24gaXNBY3Rpb25Sb3coXG4gIGNvbXBvbmVudDogTWVzc2FnZUNvbXBvbmVudCxcbik6IGNvbXBvbmVudCBpcyBBY3Rpb25Sb3cge1xuICByZXR1cm4gY29tcG9uZW50LnR5cGUgPT09IE1lc3NhZ2VDb21wb25lbnRUeXBlcy5BY3Rpb25Sb3c7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBRVMscUJBQXFCLFNBQVEsMERBQTREO0FBRWxHLEVBQW9FLEFBQXBFLGdFQUFvRSxBQUFwRSxFQUFvRSxpQkFDcEQsV0FBVyxDQUN6QixTQUEyQjtXQUVwQixTQUFTLENBQUMsSUFBSSxLQUFLLHFCQUFxQixDQUFDLFNBQVMifQ==