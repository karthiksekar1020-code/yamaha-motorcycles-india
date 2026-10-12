/** Plain-English names for audit-log actions. */
const ACTION_LABEL: Record<string, string> = {
  "auth.login": "Signed in", "auth.logout": "Signed out", "auth.password_changed": "Changed password",
  "auth.mfa_enabled": "Turned on two-step sign-in", "auth.mfa_disabled": "Turned off two-step sign-in",
  "motorcycle.create": "Added a motorcycle", "motorcycle.update": "Edited a motorcycle", "motorcycle.publish": "Published a motorcycle",
  "motorcycle.unpublish": "Unpublished a motorcycle", "motorcycle.delete": "Deleted a motorcycle",
  "gallery.upload": "Uploaded a photo", "gallery.update": "Edited a photo", "gallery.publish": "Published a photo", "gallery.unpublish": "Unpublished a photo",
  "gallery.replace": "Replaced a photo", "gallery.delete": "Deleted a photo", "gallery.reorder": "Reordered the gallery",
  "gallery.hide_builtin": "Removed a built-in photo from the gallery", "gallery.restore_builtin": "Restored a built-in photo",
  "content.save_draft": "Saved a content draft", "content.publish": "Published page content", "content.unpublish": "Unpublished page content", "content.discard_draft": "Discarded a content draft",
};

export const actionLabel = (a: string) => ACTION_LABEL[a] ?? a;
